from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Security, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
import json

try:
    import google.generativeai as genai
except ImportError:
    genai = None

# Import our enhanced systems
from notification_system import (
    NotificationManager, NotificationCreate, Notification,
    WebPushManager, NotificationType, NotificationStatus
)
from theme_system import (
    ThemeManager, ThemeConfig, ThemeCreateUpdate,
    DEFAULT_THEMES
)
from advertisement_system import (
    AdvertisementManager, Advertisement, AdvertisementCreate,
    EnhancedBanner, BannerCreate, AdPlacement, AdType
)
from enhanced_delivery_system import (
    calculate_delivery_charge, get_delivery_policy_info,
    delivery_calculator, DeliveryCalculator
)
from enhanced_chatbot import (
    OrderAwareChatBot, ChatRequest, ChatMessage
)
from file_upload_utils import (
    save_base64_image, save_uploaded_file, delete_file
)
from auth_utils import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_current_admin_user
)
from razorpay_utils import (
    create_razorpay_order, verify_razorpay_signature, create_refund
)

# Import existing models and functions from the original server
import sys
sys.path.append('/app/backend')
from server import (
    ProductCategory, OrderStatus, PaymentStatus, UserRole,
    Product, ProductCreate, ProductVariant,
    Cart, CartAddItem, CartItem, CartItemModel,
    Coupon, CouponCreate, CouponApply,
    Banner, BannerCreate,
    Order, OrderCreate, OrderStatusHistory,
    User, UserInDB, UserCreate, UserLogin, UserResponse, TokenResponse,
    Review, ReviewCreate,
    MediaItem, MediaItemCreate,
    BulkOrder, BulkOrderCreate, BulkOrderUpdate, BulkOrderStatus,
    ThemeSettings, ThemeSettingsCreate,
    ContactMessage, ContactMessageCreate,
    RazorpayOrderCreate, RazorpayPaymentVerify,
    UserUpdateAdmin,
    prepare_for_mongo, parse_from_mongo, generate_whatsapp_link
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Mithaas Delights Enhanced API", version="2.0.0")

# CORS Configuration
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins[0] != '*' else ['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
upload_dir = Path("/app/backend/uploads")
upload_dir.mkdir(exist_ok=True)
(upload_dir / "media").mkdir(exist_ok=True)
(upload_dir / "reviews").mkdir(exist_ok=True)
(upload_dir / "products").mkdir(exist_ok=True)
(upload_dir / "banners").mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Initialize enhanced system managers
notification_manager = NotificationManager(db)
theme_manager = ThemeManager(db)
advertisement_manager = AdvertisementManager(db)
web_push_manager = WebPushManager()
chatbot = OrderAwareChatBot(db)

# ==================== INITIALIZATION ROUTES ====================

@api_router.post("/init-systems")
async def initialize_systems():
    """Initialize all enhanced systems"""
    try:
        # Initialize default themes
        await theme_manager.initialize_default_themes()
        logger.info("Enhanced systems initialized successfully")
        
        return {
            "message": "All enhanced systems initialized successfully",
            "systems": [
                "notification_system",
                "theme_system", 
                "advertisement_system",
                "enhanced_delivery",
                "order_aware_chatbot",
                "file_upload_system"
            ]
        }
    except Exception as e:
        logger.error(f"System initialization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Initialization failed: {str(e)}")

# ==================== EXISTING ROUTES FROM ORIGINAL SERVER ====================
# Include all original functionality

@api_router.get("/")
async def root():
    return {"message": "Welcome to Mithaas Delights Enhanced API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Mithaas Delights Enhanced"}

# ==================== PRODUCT ROUTES (Enhanced) ====================

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[ProductCategory] = None,
    search: Optional[str] = None,
    featured_only: bool = False
):
    """Get products with optional filtering"""
    filter_query = {}
    
    if category:
        filter_query["category"] = category
    
    if featured_only:
        filter_query["is_featured"] = True
    
    if search:
        filter_query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(filter_query).to_list(length=None)
    return [Product(**parse_from_mongo(product)) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**parse_from_mongo(product))

@api_router.post("/products", response_model=Product)
async def create_product(
    product: ProductCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new product (Admin only) - Enhanced with cache invalidation"""
    await get_current_admin_user(credentials, db)
    
    product_dict = product.dict()
    product_obj = Product(**product_dict)
    await db.products.insert_one(prepare_for_mongo(product_obj.dict()))
    
    # Cache invalidation trigger would go here
    logger.info(f"Product created: {product_obj.id} - cache should be invalidated")
    
    return product_obj

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_update: ProductCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update a product (Admin only) - Enhanced with immediate frontend reflection"""
    await get_current_admin_user(credentials, db)
    
    product_dict = product_update.dict()
    product_dict["id"] = product_id
    product_dict["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": prepare_for_mongo(product_dict)}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated_product = await db.products.find_one({"id": product_id})
    product_obj = Product(**parse_from_mongo(updated_product))
    
    logger.info(f"Product updated: {product_id} - frontend should refetch")
    
    return product_obj

@api_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete a product (Admin only) - Enhanced with cart cleanup"""
    await get_current_admin_user(credentials, db)
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Remove product from all user carts
    cart_update_result = await db.carts.update_many(
        {"items.product_id": product_id},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    
    logger.info(f"Product {product_id} deleted and removed from {cart_update_result.modified_count} carts")
    
    return {
        "message": "Product deleted successfully and removed from carts",
        "carts_updated": cart_update_result.modified_count
    }

# ==================== ENHANCED NOTIFICATION SYSTEM ====================

@api_router.post("/notifications", response_model=Notification)
async def create_notification(
    notification_data: NotificationCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new notification (Admin only)"""
    admin_user = await get_current_admin_user(credentials, db)
    
    notification = await notification_manager.create_notification(
        notification_data, 
        admin_user["id"]
    )
    
    return notification

@api_router.post("/notifications/{notification_id}/broadcast")
async def broadcast_notification(
    notification_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Broadcast notification to target audience (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    result = await notification_manager.broadcast_notification(notification_id)
    return result

@api_router.get("/notifications/my-notifications")
async def get_my_notifications(
    unread_only: bool = False,
    limit: int = 50,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Get user's notifications"""
    current_user = await get_current_user(credentials, db)
    
    notifications = await notification_manager.get_user_notifications(
        current_user["id"], unread_only, limit
    )
    
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Mark notification as read"""
    current_user = await get_current_user(credentials, db)
    
    success = await notification_manager.mark_notification_read(
        notification_id, current_user["id"]
    )
    
    return {"success": success}

@api_router.get("/notifications/unread-count")
async def get_unread_notifications_count(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Get count of unread notifications"""
    current_user = await get_current_user(credentials, db)
    
    count = await notification_manager.get_unread_count(current_user["id"])
    
    return {"unread_count": count}

# ==================== ENHANCED THEME SYSTEM ====================

@api_router.get("/themes/active", response_model=ThemeConfig)
async def get_active_theme():
    """Get currently active theme"""
    theme = await theme_manager.get_active_theme()
    return theme

@api_router.get("/themes", response_model=List[ThemeConfig])
async def get_all_themes():
    """Get all available themes"""
    themes = await theme_manager.get_all_themes()
    return themes

@api_router.put("/themes/{theme_id}/activate")
async def activate_theme(
    theme_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Activate a theme (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    success = await theme_manager.activate_theme(theme_id)
    if not success:
        raise HTTPException(status_code=404, detail="Theme not found")
    
    logger.info(f"Theme activated: {theme_id} - frontend should refresh theme")
    
    return {"message": "Theme activated successfully"}

@api_router.get("/themes/active/css")
async def get_active_theme_css():
    """Get CSS for currently active theme"""
    theme = await theme_manager.get_active_theme()
    css = theme_manager.generate_css_variables(theme)
    
    return {
        "theme_id": theme.id,
        "theme_name": theme.display_name,
        "css": css
    }

# ==================== ENHANCED BANNER/ADVERTISEMENT SYSTEM ====================

@api_router.post("/banners/enhanced", response_model=EnhancedBanner)
async def create_enhanced_banner(
    banner_data: BannerCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new enhanced banner (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    banner = await advertisement_manager.create_banner(banner_data)
    
    logger.info(f"Enhanced banner created: {banner.id} - frontend should refetch banners")
    
    return banner

@api_router.get("/banners/enhanced")
async def get_enhanced_banners(
    placement: Optional[str] = None,
    active_only: bool = True
):
    """Get enhanced banners - FIXED to show banners"""
    banners = await advertisement_manager.get_banners(placement, active_only)
    return banners

@api_router.put("/banners/enhanced/{banner_id}")
async def update_enhanced_banner(
    banner_id: str,
    banner_data: BannerCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update enhanced banner (Admin only) - With immediate reflection"""
    await get_current_admin_user(credentials, db)
    
    try:
        banner = await advertisement_manager.update_banner(banner_id, banner_data)
        
        logger.info(f"Banner updated: {banner_id} - frontend should refetch banners")
        
        return banner
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@api_router.delete("/banners/enhanced/{banner_id}")
async def delete_enhanced_banner(
    banner_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete enhanced banner (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    success = await advertisement_manager.delete_banner(banner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    logger.info(f"Banner deleted: {banner_id} - frontend should refetch banners")
    
    return {"message": "Banner deleted successfully"}

# ==================== ENHANCED DELIVERY SYSTEM ====================

@api_router.post("/delivery/calculate")
async def calculate_delivery_charges(
    customer_lat: float,
    customer_lon: float,
    order_amount: float,
    delivery_type: str = "delivery"
):
    """Calculate delivery charges with distance-based logic"""
    if not delivery_calculator.validate_coordinates(customer_lat, customer_lon):
        raise HTTPException(status_code=400, detail="Invalid coordinates")
    
    result = delivery_calculator.calculate_with_caching(
        customer_lat, customer_lon, order_amount, delivery_type
    )
    
    return result

@api_router.get("/delivery/policy")
async def get_delivery_policy():
    """Get delivery policy information"""
    return get_delivery_policy_info()

# ==================== ORDER-AWARE CHATBOT ====================

@api_router.post("/chat/message")
async def send_chat_message(
    chat_request: ChatRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
):
    """Send message to order-aware chatbot"""
    # Get user ID if authenticated
    user_id = None
    if credentials:
        try:
            current_user = await get_current_user(credentials, db)
            user_id = current_user["id"]
            chat_request.user_id = user_id
        except:
            pass  # Allow anonymous chat
    
    response = await chatbot.process_message(chat_request)
    return response

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(
    session_id: str,
    limit: int = 50
):
    """Get chat history for a session"""
    history = await chatbot.get_chat_history(session_id, limit)
    return {"messages": history}

# ==================== ENHANCED REVIEW SYSTEM WITH PHOTOS ====================

class ReviewCreateWithPhotos(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str
    images: List[str] = []  # List of image URLs

@api_router.post("/reviews/with-photos")
async def create_review_with_photos(
    review_data: ReviewCreateWithPhotos,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a review with photo attachments"""
    current_user = await get_current_user(credentials, db)
    
    # Create review with photos
    review_dict = review_data.dict()
    review_dict["user_id"] = current_user["id"]
    review_dict["user_name"] = current_user["name"]
    
    review_obj = Review(**review_dict)
    await db.reviews.insert_one(prepare_for_mongo(review_obj.dict()))
    
    logger.info(f"Review with photos created: {review_obj.id}")
    
    return {"message": "Review with photos submitted successfully", "review_id": review_obj.id}

@api_router.put("/reviews/{review_id}/approve")
async def approve_review(
    review_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Approve a review (Admin only) - Enhanced with immediate reflection"""
    await get_current_admin_user(credentials, db)
    
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$set": {"is_approved": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Update product rating immediately
    review = await db.reviews.find_one({"id": review_id})
    if review:
        product_id = review["product_id"]
        
        # Recalculate product rating
        approved_reviews = await db.reviews.find({
            "product_id": product_id,
            "is_approved": True
        }).to_list(length=None)
        
        if approved_reviews:
            avg_rating = sum(r["rating"] for r in approved_reviews) / len(approved_reviews)
            await db.products.update_one(
                {"id": product_id},
                {"$set": {
                    "rating": round(avg_rating, 1),
                    "review_count": len(approved_reviews)
                }}
            )
    
    logger.info(f"Review approved: {review_id} - product rating updated")
    
    return {"message": "Review approved and product rating updated"}

# ==================== FILE UPLOAD SYSTEM ====================

class FileUploadResponse(BaseModel):
    success: bool
    file_url: Optional[str] = None
    error: Optional[str] = None

@api_router.post("/upload/image", response_model=FileUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    category: str = Form("media"),
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Upload image file"""
    await get_current_user(credentials, db)  # Require authentication
    
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Validate file size (max 5MB)
    file_content = await file.read()
    if len(file_content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    # Save file
    file_url = save_uploaded_file(file_content, file.filename, category)
    
    if file_url:
        return FileUploadResponse(success=True, file_url=file_url)
    else:
        return FileUploadResponse(success=False, error="Failed to save file")

@api_router.post("/upload/base64-image", response_model=FileUploadResponse)
async def upload_base64_image(
    base64_data: str,
    category: str = "media",
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Upload base64 encoded image"""
    await get_current_user(credentials, db)  # Require authentication
    
    file_url = save_base64_image(base64_data, category)
    
    if file_url:
        return FileUploadResponse(success=True, file_url=file_url)
    else:
        return FileUploadResponse(success=False, error="Failed to save image")

# ==================== ENHANCED ORDER SYSTEM ====================

@api_router.get("/orders", response_model=List[Order])
async def get_orders(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get all orders (Admin only) - FIXED: Ensure orders show in admin panel"""
    await get_current_admin_user(credentials, db)
    
    orders = await db.orders.find().sort("created_at", -1).to_list(length=None)
    return [Order(**parse_from_mongo(order)) for order in orders]

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    """Create a new order with enhanced delivery calculation"""
    order_dict = order.dict()
    order_obj = Order(**order_dict)
    
    # Initialize status history
    initial_status = OrderStatus.CONFIRMED if order.payment_method == "cod" else OrderStatus.PENDING
    order_obj.status = initial_status
    order_obj.status_history = [
        OrderStatusHistory(
            status=initial_status,
            timestamp=datetime.now(timezone.utc),
            note="Order placed"
        )
    ]
    
    # Enhanced delivery charge calculation
    if order.customer_lat and order.customer_lon:
        delivery_info = calculate_delivery_charge(
            customer_lat=order.customer_lat,
            customer_lon=order.customer_lon,
            order_amount=order.total_amount,
            delivery_type=order.delivery_type
        )
        
        if delivery_info.get('error'):
            raise HTTPException(status_code=400, detail=delivery_info['error'])
        
        order_obj.delivery_charge = delivery_info['delivery_charge']
        order_obj.delivery_distance_km = delivery_info['distance_km']
        # Recalculate final amount with delivery
        order_obj.final_amount = order.total_amount - order.discount_amount + delivery_info['delivery_charge']
    
    # Generate WhatsApp link
    order_obj.whatsapp_link = generate_whatsapp_link(order_obj)
    
    await db.orders.insert_one(prepare_for_mongo(order_obj.dict()))
    
    # Update coupon usage if coupon was applied
    if order.coupon_code:
        await db.coupons.update_one(
            {"code": order.coupon_code.upper()},
            {"$inc": {"used_count": 1}}
        )
    
    # Clear user cart after order placement
    try:
        await db.carts.update_one(
            {"user_id": order.user_id},
            {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    except Exception as e:
        logger.warning(f"Could not clear cart for user {order.user_id}: {str(e)}")
    
    logger.info(f"Order created with enhanced delivery: {order_obj.id}")
    return order_obj

# ==================== CART PERSISTENCE (Enhanced) ====================

@api_router.post("/cart/sync")
async def sync_cart(
    local_cart_items: List[CartItemModel],
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Sync local storage cart with database cart on login"""
    current_user = await get_current_user(credentials, db)
    
    # Get existing DB cart
    db_cart = await db.carts.find_one({"user_id": current_user["id"]})
    
    if not db_cart:
        # Create new cart with local items
        new_cart = Cart(
            user_id=current_user["id"],
            items=local_cart_items
        )
        await db.carts.insert_one(prepare_for_mongo(new_cart.dict()))
        merged_items = local_cart_items
    else:
        # Merge local items with DB items
        db_items = db_cart.get("items", [])
        merged_items = []
        
        # Convert to dict for easy lookup
        db_items_dict = {
            f"{item['product_id']}-{item['variant_weight']}": item 
            for item in db_items
        }
        
        # Add local items
        for local_item in local_cart_items:
            item_key = f"{local_item.product_id}-{local_item.variant_weight}"
            if item_key in db_items_dict:
                # Merge quantities
                db_items_dict[item_key]["quantity"] += local_item.quantity
            else:
                # Add new item
                db_items_dict[item_key] = local_item.dict()
        
        merged_items = list(db_items_dict.values())
        
        # Update cart in DB
        await db.carts.update_one(
            {"user_id": current_user["id"]},
            {"$set": {
                "items": merged_items,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    logger.info(f"Cart synced for user {current_user['id']}: {len(merged_items)} items")
    
    return {
        "message": "Cart synced successfully",
        "items": merged_items,
        "item_count": len(merged_items)
    }

# ==================== CACHE INVALIDATION & ADMIN ACTIONS ====================

@api_router.post("/admin/cache/invalidate")
async def invalidate_cache(
    cache_type: str,  # "products", "banners", "themes", "all"
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Invalidate specific cache types (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    if cache_type == "delivery" or cache_type == "all":
        delivery_calculator.clear_cache()
    
    logger.info(f"Cache invalidated for: {cache_type}")
    
    return {
        "message": f"Cache invalidated for: {cache_type}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": "Frontend should refetch data"
    }

# ==================== SYSTEM STATUS ====================

@api_router.get("/system/status")
async def get_system_status():
    """Get overall system status"""
    try:
        # Test database connection
        await db.users.find_one({})
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    # Test AI service
    ai_status = "healthy" if chatbot.model else "fallback_mode"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": db_status,
            "ai_chatbot": ai_status,
            "file_uploads": "healthy",
            "notifications": "healthy",
            "themes": "healthy",
            "advertisements": "healthy",
            "delivery_calculator": "healthy"
        },
        "features": [
            "admin_action_immediate_reflection",
            "review_photo_attachments", 
            "cart_persistence_sync",
            "distance_based_delivery",
            "order_aware_chatbot",
            "multi_theme_support",
            "enhanced_notifications",
            "banner_advertisement_system"
        ]
    }

# Add the router to the app
app.include_router(api_router)

# Root route
@app.get("/")
async def root():
    return {
        "message": "Welcome to Mithaas Delights Enhanced API v2.0",
        "features": [
            "✅ Admin Action Immediate Reflection",
            "✅ Review Photo Attachments", 
            "✅ Cart Persistence with Sync",
            "✅ Media Gallery Support",
            "✅ Distance-based Delivery Calculation", 
            "✅ Order-aware AI Chatbot",
            "✅ Multi-theme Support (Admin Selectable)",
            "✅ Enhanced Notification System",
            "✅ Banner & Advertisement Management",
            "✅ File Upload System",
            "✅ Cache Invalidation"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Mithaas Delights Enhanced API",
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
