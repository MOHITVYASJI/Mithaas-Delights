#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Mithaas Delights E-commerce App
Tests the specific endpoints mentioned in the review request:
- Cart merge functionality
- Cart validation 
- Product update with variant cleanup
- Review moderation
- Banner toggle
- Chatbot integration
- Order tracking
"""

import requests
import json
import sys
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional

class MithaasAPITester:
    def __init__(self, base_url="http://127.0.0.1:8001"):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.test_data = {
            'products': [],
            'users': [],
            'orders': [],
            'reviews': [],
            'banners': []
        }
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None, 
                 auth_token: Optional[str] = None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if auth_token:
            test_headers['Authorization'] = f'Bearer {auth_token}'

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.log(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:500]
                })
                try:
                    return False, response.json()
                except:
                    return False, response.text

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def setup_test_data(self):
        """Create test users and basic data"""
        self.log("🚀 Setting up test data...")
        
        # Create admin user
        timestamp = int(time.time())
        admin_data = {
            "name": "Test Admin",
            "email": f"admin_{timestamp}@test.com",
            "password": "admin123",
            "phone": f"987654{timestamp % 10000:04d}"[-10:]  # Ensure 10 digits
        }
        
        success, response = self.run_test(
            "Create Admin User",
            "POST",
            "auth/register",
            200,
            data=admin_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            admin_user_id = response['user']['id']
            
            # Manually update user role to admin in database using MongoDB
            try:
                import pymongo
                client = pymongo.MongoClient("mongodb://localhost:27017")
                db = client["test_database"]
                
                result = db.users.update_one(
                    {"id": admin_user_id},
                    {"$set": {"role": "admin"}}
                )
                
                if result.modified_count > 0:
                    self.log("✅ Admin user created and role updated in database")
                    self.test_data['users'].append({
                        'id': admin_user_id,
                        'email': admin_data['email'],
                        'role': 'admin',
                        'token': self.admin_token
                    })
                else:
                    self.log("❌ Failed to update user role to admin in database")
                    return False
                    
            except Exception as e:
                self.log(f"❌ Database update failed: {str(e)}")
                return False
        else:
            self.log("❌ Failed to create admin user")
            return False

        # Create regular user
        timestamp = int(time.time())
        user_data = {
            "name": "Test User",
            "email": f"user_{timestamp}@test.com",
            "password": "user123",
            "phone": f"987654{(timestamp + 1) % 10000:04d}"[-10:]  # Ensure 10 digits, different from admin
        }
        
        success, response = self.run_test(
            "Create Regular User",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'access_token' in response:
            self.user_token = response['access_token']
            user_id = response['user']['id']
            self.log("✅ Regular user created")
            self.test_data['users'].append({
                'id': user_id,
                'email': user_data['email'],
                'role': 'user',
                'token': self.user_token
            })
        else:
            self.log("❌ Failed to create regular user")
            return False

        return True

    def create_test_products(self):
        """Create test products with variants"""
        self.log("📦 Creating test products...")
        
        products_data = [
            {
                "name": "Test Gulab Jamun",
                "description": "Sweet and delicious gulab jamun for testing",
                "category": "mithai",
                "variants": [
                    {"weight": "250g", "price": 150.0, "stock": 50},
                    {"weight": "500g", "price": 280.0, "stock": 30},
                    {"weight": "1kg", "price": 520.0, "stock": 20}
                ],
                "image_url": "https://example.com/gulab-jamun.jpg",
                "ingredients": ["milk", "sugar", "cardamom"],
                "is_featured": True
            },
            {
                "name": "Test Rasgulla",
                "description": "Soft and spongy rasgulla for testing",
                "category": "bengali_sweets",
                "variants": [
                    {"weight": "250g", "price": 120.0, "stock": 40},
                    {"weight": "500g", "price": 220.0, "stock": 25}
                ],
                "image_url": "https://example.com/rasgulla.jpg",
                "ingredients": ["milk", "sugar"],
                "is_featured": False
            }
        ]
        
        for product_data in products_data:
            success, response = self.run_test(
                f"Create Product: {product_data['name']}",
                "POST",
                "products",
                200,
                data=product_data,
                auth_token=self.admin_token
            )
            
            if success and 'id' in response:
                self.test_data['products'].append(response)
                self.log(f"✅ Product created: {response['id']}")
            else:
                self.log(f"❌ Failed to create product: {product_data['name']}")

        return len(self.test_data['products']) > 0

    def test_cart_merge(self):
        """Test POST /api/cart/merge - merges guest cart with user cart on login"""
        self.log("🛒 Testing Cart Merge Functionality...")
        
        if not self.test_data['products']:
            self.log("❌ No test products available for cart merge test")
            return False

        product = self.test_data['products'][0]
        
        # First add some items to user cart
        cart_item1 = {
            "product_id": product['id'],
            "variant_weight": "250g",
            "quantity": 2
        }
        
        success, _ = self.run_test(
            "Add Item to User Cart",
            "POST",
            "cart/add",
            200,
            data=cart_item1,
            auth_token=self.user_token
        )
        
        if not success:
            self.log("❌ Failed to add item to user cart")
            return False

        # Simulate guest cart items (different variant of same product + new product)
        guest_cart_items = [
            {
                "product_id": product['id'],
                "variant_weight": "250g",  # Same variant - should merge quantities
                "quantity": 1,
                "price": 150.0
            },
            {
                "product_id": product['id'],
                "variant_weight": "500g",  # Different variant - should add as new
                "quantity": 3,
                "price": 280.0
            }
        ]
        
        # Test cart merge
        success, response = self.run_test(
            "Cart Merge on Login",
            "POST",
            "cart/merge",
            200,
            data=guest_cart_items,
            auth_token=self.user_token
        )
        
        if success:
            # Verify cart contents
            success, cart_response = self.run_test(
                "Get Cart After Merge",
                "GET",
                "cart",
                200,
                auth_token=self.user_token
            )
            
            if success and 'items' in cart_response:
                items = cart_response['items']
                self.log(f"Cart items after merge: {len(items)}")
                
                # Check if quantities were merged correctly
                variant_250g = next((item for item in items if item['variant_weight'] == '250g'), None)
                variant_500g = next((item for item in items if item['variant_weight'] == '500g'), None)
                
                if variant_250g and variant_250g['quantity'] == 3:  # 2 + 1
                    self.log("✅ Cart merge: 250g variant quantities merged correctly")
                else:
                    self.log("❌ Cart merge: 250g variant quantities not merged correctly")
                    return False
                
                if variant_500g and variant_500g['quantity'] == 3:
                    self.log("✅ Cart merge: 500g variant added correctly")
                else:
                    self.log("❌ Cart merge: 500g variant not added correctly")
                    return False
                
                return True
            else:
                self.log("❌ Failed to get cart after merge")
                return False
        else:
            self.log("❌ Cart merge failed")
            return False

    def test_cart_validation(self):
        """Test POST /api/cart/validate - removes invalid cart items"""
        self.log("🔍 Testing Cart Validation...")
        
        # First, let's add a valid item to cart
        if not self.test_data['products']:
            self.log("❌ No test products available for cart validation test")
            return False

        product = self.test_data['products'][0]
        
        # Add valid item to cart
        cart_item = {
            "product_id": product['id'],
            "variant_weight": "250g",
            "quantity": 1
        }
        
        success, _ = self.run_test(
            "Add Valid Item for Validation Test",
            "POST",
            "cart/add",
            200,
            data=cart_item,
            auth_token=self.user_token
        )
        
        if not success:
            self.log("❌ Failed to add valid item to cart")
            return False

        # Test cart validation (should find no invalid items)
        success, response = self.run_test(
            "Cart Validation",
            "POST",
            "cart/validate",
            200,
            auth_token=self.user_token
        )
        
        if success:
            removed_count = len(response.get('removed_items', []))
            valid_count = response.get('valid_items_count', 0)
            
            self.log(f"Cart validation: {removed_count} items removed, {valid_count} valid items")
            
            if removed_count == 0 and valid_count > 0:
                self.log("✅ Cart validation working correctly")
                return True
            else:
                self.log("❌ Cart validation results unexpected")
                return False
        else:
            self.log("❌ Cart validation failed")
            return False

    def test_product_variant_cleanup(self):
        """Test PUT /api/products/{product_id} - removes deleted variants from carts"""
        self.log("🔧 Testing Product Variant Cleanup...")
        
        if not self.test_data['products']:
            self.log("❌ No test products available for variant cleanup test")
            return False

        product = self.test_data['products'][0]
        
        # Add items with different variants to cart
        cart_items = [
            {"product_id": product['id'], "variant_weight": "250g", "quantity": 1},
            {"product_id": product['id'], "variant_weight": "500g", "quantity": 2}
        ]
        
        for item in cart_items:
            success, _ = self.run_test(
                f"Add {item['variant_weight']} to Cart",
                "POST",
                "cart/add",
                200,
                data=item,
                auth_token=self.user_token
            )
            
            if not success:
                self.log(f"❌ Failed to add {item['variant_weight']} to cart")
                return False

        # Update product to remove 500g variant
        updated_product = {
            "name": product['name'],
            "description": product['description'],
            "category": product['category'],
            "variants": [
                {"weight": "250g", "price": 150.0, "stock": 50},
                {"weight": "1kg", "price": 520.0, "stock": 20}  # Removed 500g variant
            ],
            "image_url": product['image_url'],
            "ingredients": product['ingredients'],
            "is_featured": product['is_featured']
        }
        
        success, response = self.run_test(
            "Update Product (Remove 500g Variant)",
            "PUT",
            f"products/{product['id']}",
            200,
            data=updated_product,
            auth_token=self.admin_token
        )
        
        if success:
            # Check if cart was cleaned up
            success, cart_response = self.run_test(
                "Get Cart After Variant Removal",
                "GET",
                "cart",
                200,
                auth_token=self.user_token
            )
            
            if success and 'items' in cart_response:
                items = cart_response['items']
                
                # Check if 500g variant was removed from cart
                has_500g = any(item['variant_weight'] == '500g' for item in items)
                has_250g = any(item['variant_weight'] == '250g' for item in items)
                
                if not has_500g and has_250g:
                    self.log("✅ Product variant cleanup working correctly")
                    return True
                else:
                    self.log("❌ Product variant cleanup failed")
                    self.log(f"   Cart items: {[item['variant_weight'] for item in items]}")
                    return False
            else:
                self.log("❌ Failed to get cart after variant removal")
                return False
        else:
            self.log("❌ Failed to update product")
            return False

    def test_review_moderation(self):
        """Test GET /api/reviews/pending/all - returns unapproved reviews for admin"""
        self.log("📝 Testing Review Moderation...")
        
        if not self.test_data['products']:
            self.log("❌ No test products available for review test")
            return False

        product = self.test_data['products'][0]
        
        # Create a test review
        review_data = {
            "product_id": product['id'],
            "user_id": self.test_data['users'][1]['id'],  # Regular user
            "user_name": "Test User",
            "rating": 5,
            "comment": "Great product for testing!",
            "images": []
        }
        
        success, response = self.run_test(
            "Create Review",
            "POST",
            "reviews",
            200,
            data=review_data,
            auth_token=self.user_token
        )
        
        if success and 'id' in response:
            review_id = response['id']
            self.test_data['reviews'].append(response)
            
            # Test getting pending reviews (admin only)
            success, pending_response = self.run_test(
                "Get Pending Reviews (Admin)",
                "GET",
                "reviews/pending/all",
                200,
                auth_token=self.admin_token
            )
            
            if success:
                pending_reviews = pending_response if isinstance(pending_response, list) else []
                
                # Check if our review is in pending list
                our_review = next((r for r in pending_reviews if r['id'] == review_id), None)
                
                if our_review and not our_review['is_approved']:
                    self.log("✅ Review moderation: Pending reviews retrieved correctly")
                    
                    # Test approving the review
                    success, _ = self.run_test(
                        "Approve Review",
                        "PUT",
                        f"reviews/{review_id}/approve",
                        200,
                        auth_token=self.admin_token
                    )
                    
                    if success:
                        self.log("✅ Review approval working correctly")
                        return True
                    else:
                        self.log("❌ Review approval failed")
                        return False
                else:
                    self.log("❌ Review not found in pending list or already approved")
                    return False
            else:
                self.log("❌ Failed to get pending reviews")
                return False
        else:
            self.log("❌ Failed to create review")
            return False

    def test_banner_toggle(self):
        """Test PUT /api/banners/{banner_id}/toggle - toggles banner active status"""
        self.log("🎯 Testing Banner Toggle...")
        
        # Create a test banner
        banner_data = {
            "title": "Test Festival Banner",
            "image_url": "https://example.com/banner.jpg",
            "festival_name": "Test Festival",
            "description": "Test banner for toggle functionality",
            "cta_text": "Shop Now",
            "is_active": True,
            "display_order": 1
        }
        
        success, response = self.run_test(
            "Create Banner",
            "POST",
            "banners",
            200,
            data=banner_data,
            auth_token=self.admin_token
        )
        
        if success and 'id' in response:
            banner_id = response['id']
            self.test_data['banners'].append(response)
            
            # Test toggling banner status
            success, toggle_response = self.run_test(
                "Toggle Banner Status",
                "PUT",
                f"banners/{banner_id}/toggle",
                200,
                auth_token=self.admin_token
            )
            
            if success:
                new_status = toggle_response.get('is_active')
                
                if new_status == False:  # Should be deactivated
                    self.log("✅ Banner toggle: Successfully deactivated banner")
                    
                    # Toggle again to reactivate
                    success, toggle_response2 = self.run_test(
                        "Toggle Banner Status Again",
                        "PUT",
                        f"banners/{banner_id}/toggle",
                        200,
                        auth_token=self.admin_token
                    )
                    
                    if success and toggle_response2.get('is_active') == True:
                        self.log("✅ Banner toggle: Successfully reactivated banner")
                        return True
                    else:
                        self.log("❌ Banner toggle: Failed to reactivate banner")
                        return False
                else:
                    self.log("❌ Banner toggle: Status not changed correctly")
                    return False
            else:
                self.log("❌ Banner toggle failed")
                return False
        else:
            self.log("❌ Failed to create banner")
            return False

    def test_chatbot_integration(self):
        """Test POST /api/chat - chatbot with Gemini API integration"""
        self.log("🤖 Testing Chatbot Integration...")
        
        # Test basic chat functionality
        chat_data = {
            "session_id": f"test_session_{int(time.time())}",
            "message": "Hello, what sweets do you recommend?"
        }
        
        success, response = self.run_test(
            "Chatbot Basic Query",
            "POST",
            "chat",
            200,
            data=chat_data
        )
        
        if success:
            if 'response' in response and response['response']:
                self.log("✅ Chatbot: Basic query working")
                
                # Test order-related query
                order_chat_data = {
                    "session_id": chat_data["session_id"],
                    "message": "Can you help me track my recent orders?"
                }
                
                success, order_response = self.run_test(
                    "Chatbot Order Query",
                    "POST",
                    "chat",
                    200,
                    data=order_chat_data
                )
                
                if success and 'response' in order_response:
                    self.log("✅ Chatbot: Order query working")
                    return True
                else:
                    self.log("❌ Chatbot: Order query failed")
                    return False
            else:
                self.log("❌ Chatbot: No response received")
                return False
        else:
            self.log("❌ Chatbot: Basic query failed")
            return False

    def test_order_tracking(self):
        """Test GET /api/orders/track/{order_id} - order tracking with status history"""
        self.log("📦 Testing Order Tracking...")
        
        # Create a test order first
        if not self.test_data['products']:
            self.log("❌ No test products available for order test")
            return False

        product = self.test_data['products'][0]
        
        order_data = {
            "user_id": self.test_data['users'][1]['id'],  # Regular user
            "items": [
                {
                    "product_id": product['id'],
                    "product_name": product['name'],
                    "variant_weight": "250g",
                    "quantity": 2,
                    "price": 150.0
                }
            ],
            "total_amount": 300.0,
            "discount_amount": 0.0,
            "delivery_charge": 50.0,
            "tax_amount": 0.0,
            "final_amount": 350.0,
            "delivery_address": "Test Address, Test City, 123456",
            "phone_number": "9876543211",
            "email": self.test_data['users'][1]['email'],
            "payment_method": "cod"
        }
        
        success, response = self.run_test(
            "Create Test Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success and 'id' in response:
            order_id = response['id']
            self.test_data['orders'].append(response)
            
            # Test order tracking
            success, track_response = self.run_test(
                "Track Order",
                "GET",
                f"orders/track/{order_id}",
                200
            )
            
            if success:
                if 'status_history' in track_response and track_response['status_history']:
                    self.log("✅ Order tracking: Status history available")
                    
                    # Check if initial status is set
                    initial_status = track_response['status_history'][0]
                    if initial_status.get('status') in ['pending', 'confirmed']:
                        self.log("✅ Order tracking: Initial status correct")
                        return True
                    else:
                        self.log("❌ Order tracking: Initial status incorrect")
                        return False
                else:
                    self.log("❌ Order tracking: No status history found")
                    return False
            else:
                self.log("❌ Order tracking failed")
                return False
        else:
            self.log("❌ Failed to create test order")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        self.log("🚀 Starting Mithaas Delights Backend API Tests")
        self.log(f"Base URL: {self.base_url}")
        
        # Setup
        if not self.setup_test_data():
            self.log("❌ Test setup failed. Aborting tests.")
            return False
        
        if not self.create_test_products():
            self.log("❌ Product creation failed. Aborting tests.")
            return False
        
        # Run specific endpoint tests
        test_results = {
            'cart_merge': self.test_cart_merge(),
            'cart_validation': self.test_cart_validation(),
            'product_variant_cleanup': self.test_product_variant_cleanup(),
            'review_moderation': self.test_review_moderation(),
            'banner_toggle': self.test_banner_toggle(),
            'chatbot_integration': self.test_chatbot_integration(),
            'order_tracking': self.test_order_tracking()
        }
        
        # Print summary
        self.log("\n" + "="*60)
        self.log("📊 TEST SUMMARY")
        self.log("="*60)
        self.log(f"Total Tests Run: {self.tests_run}")
        self.log(f"Tests Passed: {self.tests_passed}")
        self.log(f"Tests Failed: {len(self.failed_tests)}")
        self.log(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        self.log("\n🎯 ENDPOINT TEST RESULTS:")
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"  {test_name}: {status}")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS DETAILS:")
            for i, failure in enumerate(self.failed_tests, 1):
                self.log(f"{i}. {failure['name']}")
                if 'error' in failure:
                    self.log(f"   Error: {failure['error']}")
                else:
                    self.log(f"   Expected: {failure['expected']}, Got: {failure['actual']}")
                    if failure.get('response'):
                        self.log(f"   Response: {failure['response'][:200]}...")
        
        # Return overall success
        critical_tests = ['cart_merge', 'cart_validation', 'review_moderation', 'banner_toggle']
        critical_passed = sum(1 for test in critical_tests if test_results.get(test, False))
        
        self.log(f"\n🎯 CRITICAL TESTS: {critical_passed}/{len(critical_tests)} passed")
        
        return critical_passed >= len(critical_tests) * 0.75  # 75% pass rate for critical tests

def main():
    """Main test execution"""
    tester = MithaasAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        tester.log("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        tester.log(f"\n💥 Unexpected error: {str(e)}", "ERROR")
        return 1

if __name__ == "__main__":
    sys.exit(main())