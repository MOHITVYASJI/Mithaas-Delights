"""
Cart Synchronization System for Mithaas Delights API
Handles cart sync between local storage and database, cart merging, and validation
"""

from fastapi import APIRouter, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

# Setup logging
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Create router
cart_router = APIRouter(prefix="/api", tags=["cart"])

# ==================== MODELS ====================

class CartItemModel(BaseModel):
    product_id: str
    variant_weight: str  # e.g., "250g"
    quantity: int
    price: float

class Cart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItemModel] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartSyncRequest(BaseModel):
    local_cart_items: List[CartItemModel]

class CartSyncResponse(BaseModel):
    message: str
    items: List[CartItemModel]
    total_items: int
    total_amount: float

class CartValidationResult(BaseModel):
    valid_items: List[CartItemModel]
    invalid_items: List[dict]
    total_amount: float
    warnings: List[str] = []

# ==================== HELPER FUNCTIONS ====================

def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('updated_at'), datetime):
        data['updated_at'] = data['updated_at'].isoformat()
    return data

def parse_from_mongo(item):
    """Parse MongoDB document back to Python objects"""
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    return item

# ==================== CART SYNC ENDPOINTS ====================

def setup_cart_sync_routes(db: AsyncIOMotorDatabase, get_current_user):
    """Setup cart sync routes with database and auth dependencies"""
    
    @cart_router.post("/cart/sync", response_model=CartSyncResponse)
    async def sync_cart(
        sync_request: CartSyncRequest,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Sync local storage cart with database cart on login"""
        current_user = await get_current_user(credentials, db)
        
        # Get existing cart
        cart = await db.carts.find_one({"user_id": current_user["id"]})
        
        if not cart:
            # Create new cart with local items
            validated_items = await validate_cart_items(db, sync_request.local_cart_items)
            new_cart = Cart(user_id=current_user["id"], items=validated_items.valid_items)
            await db.carts.insert_one(prepare_for_mongo(new_cart.dict()))
            
            total_amount = sum(item.price * item.quantity for item in validated_items.valid_items)
            logger.info(f"New cart created for user {current_user['id']} with {len(validated_items.valid_items)} items")
            
            return CartSyncResponse(
                message="Cart synced successfully",
                items=validated_items.valid_items,
                total_items=len(validated_items.valid_items),
                total_amount=total_amount
            )
        
        # Merge carts - combine by product_id + variant_weight
        existing_items = [CartItemModel(**item) for item in cart.get("items", [])]
        merged_items = {f"{item.product_id}-{item.variant_weight}": item for item in existing_items}
        
        for local_item in sync_request.local_cart_items:
            key = f"{local_item.product_id}-{local_item.variant_weight}"
            if key in merged_items:
                # Increase quantity
                merged_items[key].quantity += local_item.quantity
            else:
                # Add new item
                merged_items[key] = local_item
        
        # Validate all merged items
        all_items = list(merged_items.values())
        validated_items = await validate_cart_items(db, all_items)
        
        # Update cart
        await db.carts.update_one(
            {"user_id": current_user["id"]},
            {"$set": {
                "items": [item.dict() for item in validated_items.valid_items],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        total_amount = sum(item.price * item.quantity for item in validated_items.valid_items)
        logger.info(f"Cart synced for user {current_user['id']} with {len(validated_items.valid_items)} valid items")
        
        return CartSyncResponse(
            message="Cart synced successfully",
            items=validated_items.valid_items,
            total_items=len(validated_items.valid_items),
            total_amount=total_amount
        )

    @cart_router.post("/cart/validate", response_model=CartValidationResult)
    async def validate_cart(
        cart_items: List[CartItemModel],
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Validate cart items against current product availability and pricing"""
        await get_current_user(credentials, db)
        
        return await validate_cart_items(db, cart_items)

    @cart_router.post("/cart/merge")
    async def merge_guest_cart(
        guest_cart_items: List[CartItemModel],
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Merge guest cart with user cart after login"""
        current_user = await get_current_user(credentials, db)
        
        # Get existing user cart
        user_cart = await db.carts.find_one({"user_id": current_user["id"]})
        
        if not user_cart:
            # No existing cart, create new one with guest items
            validated_items = await validate_cart_items(db, guest_cart_items)
            new_cart = Cart(user_id=current_user["id"], items=validated_items.valid_items)
            await db.carts.insert_one(prepare_for_mongo(new_cart.dict()))
            
            logger.info(f"Guest cart converted to user cart for {current_user['id']}")
            return {"message": "Guest cart merged successfully", "items_count": len(validated_items.valid_items)}
        
        # Merge guest items with existing cart
        existing_items = [CartItemModel(**item) for item in user_cart.get("items", [])]
        merged_items = {f"{item.product_id}-{item.variant_weight}": item for item in existing_items}
        
        for guest_item in guest_cart_items:
            key = f"{guest_item.product_id}-{guest_item.variant_weight}"
            if key in merged_items:
                # Increase quantity
                merged_items[key].quantity += guest_item.quantity
            else:
                # Add new item
                merged_items[key] = guest_item
        
        # Validate merged items
        all_items = list(merged_items.values())
        validated_items = await validate_cart_items(db, all_items)
        
        # Update cart
        await db.carts.update_one(
            {"user_id": current_user["id"]},
            {"$set": {
                "items": [item.dict() for item in validated_items.valid_items],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Guest cart merged with user cart for {current_user['id']}")
        return {"message": "Guest cart merged successfully", "items_count": len(validated_items.valid_items)}

    @cart_router.get("/cart/summary")
    async def get_cart_summary(credentials: HTTPAuthorizationCredentials = Security(security)):
        """Get cart summary with totals and item count"""
        current_user = await get_current_user(credentials, db)
        
        cart = await db.carts.find_one({"user_id": current_user["id"]})
        if not cart:
            return {
                "total_items": 0,
                "total_amount": 0.0,
                "items": []
            }
        
        items = [CartItemModel(**item) for item in cart.get("items", [])]
        total_amount = sum(item.price * item.quantity for item in items)
        total_items = sum(item.quantity for item in items)
        
        return {
            "total_items": total_items,
            "total_amount": total_amount,
            "items": items,
            "last_updated": cart.get("updated_at")
        }

    @cart_router.post("/cart/cleanup")
    async def cleanup_cart(credentials: HTTPAuthorizationCredentials = Security(security)):
        """Remove invalid items from cart and update pricing"""
        current_user = await get_current_user(credentials, db)
        
        cart = await db.carts.find_one({"user_id": current_user["id"]})
        if not cart:
            return {"message": "No cart found"}
        
        items = [CartItemModel(**item) for item in cart.get("items", [])]
        validated_items = await validate_cart_items(db, items)
        
        # Update cart with only valid items
        await db.carts.update_one(
            {"user_id": current_user["id"]},
            {"$set": {
                "items": [item.dict() for item in validated_items.valid_items],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        removed_count = len(items) - len(validated_items.valid_items)
        logger.info(f"Cart cleanup for user {current_user['id']}: removed {removed_count} invalid items")
        
        return {
            "message": "Cart cleaned up successfully",
            "removed_items": removed_count,
            "valid_items": len(validated_items.valid_items),
            "warnings": validated_items.warnings
        }

    async def validate_cart_items(db: AsyncIOMotorDatabase, cart_items: List[CartItemModel]) -> CartValidationResult:
        """Validate cart items against current product data"""
        valid_items = []
        invalid_items = []
        warnings = []
        
        for item in cart_items:
            try:
                # Get product
                product = await db.products.find_one({"id": item.product_id})
                if not product:
                    invalid_items.append({
                        "item": item.dict(),
                        "reason": "Product not found"
                    })
                    continue
                
                # Check if product is available
                if not product.get("is_available", True) or product.get("is_sold_out", False):
                    invalid_items.append({
                        "item": item.dict(),
                        "reason": "Product not available"
                    })
                    continue
                
                # Find variant and validate
                variants = product.get("variants", [])
                variant = None
                for v in variants:
                    if v["weight"] == item.variant_weight:
                        variant = v
                        break
                
                if not variant:
                    invalid_items.append({
                        "item": item.dict(),
                        "reason": "Variant not found"
                    })
                    continue
                
                # Check variant availability
                if not variant.get("is_available", True) or variant.get("stock", 0) < item.quantity:
                    invalid_items.append({
                        "item": item.dict(),
                        "reason": "Insufficient stock"
                    })
                    continue
                
                # Update price if changed
                current_price = variant["price"]
                if item.price != current_price:
                    warnings.append(f"Price updated for {product['name']} ({item.variant_weight})")
                    item.price = current_price
                
                valid_items.append(item)
                
            except Exception as e:
                logger.error(f"Error validating cart item {item.product_id}: {str(e)}")
                invalid_items.append({
                    "item": item.dict(),
                    "reason": "Validation error"
                })
        
        total_amount = sum(item.price * item.quantity for item in valid_items)
        
        return CartValidationResult(
            valid_items=valid_items,
            invalid_items=invalid_items,
            total_amount=total_amount,
            warnings=warnings
        )

    return cart_router