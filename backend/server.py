from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
import google.generativeai as genai
from auth_utils import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin_user
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Mithaas Delights API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# Enums
class ProductCategory(str, Enum):
    MITHAI = "mithai"
    NAMKEEN = "namkeen"
    FARSAN = "farsan"
    BENGALI_SWEETS = "bengali_sweets"
    DRY_FRUIT_SWEETS = "dry_fruit_sweets"
    LADDU = "laddu"
    FESTIVAL_SPECIAL = "festival_special"

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

# New Models for Phase 1-3

# Product Variant Model
class ProductVariant(BaseModel):
    weight: str  # e.g., "250g", "500g", "1kg"
    price: float
    original_price: Optional[float] = None
    is_available: bool = True

# Updated Product Model with Variants and Media
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: ProductCategory
    variants: List[ProductVariant] = []  # New: Multiple variants
    media_gallery: List[str] = []  # New: Multiple images/videos
    image_url: str  # Keep for backward compatibility
    ingredients: List[str] = []
    is_available: bool = True
    is_sold_out: bool = False  # New: Sold out flag
    is_featured: bool = False
    discount_percentage: Optional[int] = None
    rating: float = 4.5
    review_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    category: ProductCategory
    variants: List[ProductVariant]
    media_gallery: List[str] = []
    image_url: str
    ingredients: List[str] = []
    is_available: bool = True
    is_sold_out: bool = False
    is_featured: bool = False
    discount_percentage: Optional[int] = None

# Cart Models
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

class CartAddItem(BaseModel):
    product_id: str
    variant_weight: str
    quantity: int = 1

# Coupon Model
class Coupon(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_percentage: int = Field(ge=1, le=100)
    max_discount_amount: Optional[float] = None
    min_order_amount: float = 0
    expiry_date: datetime
    is_active: bool = True
    usage_limit: Optional[int] = None
    used_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CouponCreate(BaseModel):
    code: str
    discount_percentage: int = Field(ge=1, le=100)
    max_discount_amount: Optional[float] = None
    min_order_amount: float = 0
    expiry_date: datetime
    usage_limit: Optional[int] = None

class CouponApply(BaseModel):
    code: str
    order_amount: float

# Festival Banner Model
class Banner(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    image_url: str
    festival_name: str  # e.g., "Diwali", "Holi", "Raksha Bandhan"
    description: Optional[str] = None
    cta_text: Optional[str] = "Shop Now"
    cta_link: Optional[str] = None
    is_active: bool = True
    display_order: int = 0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BannerCreate(BaseModel):
    title: str
    image_url: str
    festival_name: str
    description: Optional[str] = None
    cta_text: Optional[str] = "Shop Now"
    cta_link: Optional[str] = None
    is_active: bool = True
    display_order: int = 0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

# Updated Order Model with Payment Info
class CartItem(BaseModel):
    product_id: str
    product_name: Optional[str] = None  # Added for display purposes
    variant_weight: str
    quantity: int
    price: float

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem]
    total_amount: float
    discount_amount: float = 0
    final_amount: float
    coupon_code: Optional[str] = None
    status: OrderStatus = OrderStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    payment_method: str = "cod"  # cod, razorpay
    delivery_address: str
    phone_number: str
    email: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    whatsapp_link: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    user_id: str
    items: List[CartItem]
    total_amount: float
    discount_amount: float = 0
    final_amount: float
    coupon_code: Optional[str] = None
    delivery_address: str
    phone_number: str
    email: str
    payment_method: str = "cod"

# Razorpay Models
class RazorpayOrderCreate(BaseModel):
    amount: float

class RazorpayPaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str

# User Models
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole = UserRole.USER
    addresses: List[str] = []
    wishlist: List[str] = []  # Product IDs
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserInDB(User):
    hashed_password: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: UserRole
    addresses: List[str] = []
    wishlist: List[str] = []
    is_active: bool
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Review Model with Approval
class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_id: str
    user_name: str
    rating: int = Field(ge=1, le=5)
    comment: str
    is_approved: bool = False  # New: Admin approval
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    product_id: str
    user_id: str
    user_name: str
    rating: int = Field(ge=1, le=5)
    comment: str

# Chatbot Models
class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    message: str
    response: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    session_id: str
    message: str

# Helper functions
def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('updated_at'), datetime):
        data['updated_at'] = data['updated_at'].isoformat()
    if isinstance(data.get('expiry_date'), datetime):
        data['expiry_date'] = data['expiry_date'].isoformat()
    if isinstance(data.get('start_date'), datetime):
        data['start_date'] = data['start_date'].isoformat()
    if isinstance(data.get('end_date'), datetime):
        data['end_date'] = data['end_date'].isoformat()
    return data

def parse_from_mongo(item):
    """Parse MongoDB document back to Python objects"""
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    if isinstance(item.get('expiry_date'), str):
        item['expiry_date'] = datetime.fromisoformat(item['expiry_date'])
    if isinstance(item.get('start_date'), str):
        item['start_date'] = datetime.fromisoformat(item['start_date'])
    if isinstance(item.get('end_date'), str):
        item['end_date'] = datetime.fromisoformat(item['end_date'])
    return item

# Generate WhatsApp Link with detailed order info
def generate_whatsapp_link(order: Order) -> str:
    """Generate WhatsApp link for order confirmation with full details"""
    whatsapp_number = os.environ.get('WHATSAPP_NUMBER', '+918989549544')
    
    # Build detailed message with item breakdown including product names
    items_text = ""
    for item in order.items:
        product_display = item.product_name if item.product_name else f"Product {item.product_id[:8]}"
        items_text += f"\n- {product_display} ({item.variant_weight}) x{item.quantity} = ₹{item.price * item.quantity}"
    
    message = (
        f"Hello! I have placed an order.\n\n"
        f"Order ID: {order.id[:8]}\n"
        f"Items:{items_text}\n\n"
        f"Total Amount: ₹{order.final_amount}\n"
        f"Delivery Address: {order.delivery_address}\n\n"
        f"Please confirm my order. Thank you!"
    )
    
    encoded_message = message.replace('\n', '%0A').replace(' ', '%20')
    return f"https://wa.me/{whatsapp_number.replace('+', '')}?text={encoded_message}"

# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Welcome to Mithaas Delights API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Mithaas Delights"}

# ==================== PRODUCT ROUTES ====================

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

@api_router.get("/products/search")
async def search_products(q: str):
    """Search products by name or description"""
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Search query too short")
    
    products = await db.products.find({
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"category": {"$regex": q, "$options": "i"}}
        ]
    }).to_list(length=50)
    
    return [Product(**parse_from_mongo(product)) for product in products]

@api_router.get("/products/featured", response_model=List[Product])
async def get_featured_products():
    products = await db.products.find({"is_featured": True}).to_list(length=None)
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
    """Create a new product (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    product_dict = product.dict()
    product_obj = Product(**product_dict)
    await db.products.insert_one(prepare_for_mongo(product_obj.dict()))
    return product_obj

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_update: ProductCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update a product (Admin only)"""
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
    return Product(**parse_from_mongo(updated_product))

@api_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete a product (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# ==================== CART ROUTES ====================

@api_router.get("/cart")
async def get_cart(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get user's cart"""
    current_user = await get_current_user(credentials, db)
    
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        # Create empty cart
        new_cart = Cart(user_id=current_user["id"])
        await db.carts.insert_one(prepare_for_mongo(new_cart.dict()))
        return new_cart
    
    return Cart(**parse_from_mongo(cart))

@api_router.post("/cart/add")
async def add_to_cart(
    item: CartAddItem,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Add item to cart"""
    current_user = await get_current_user(credentials, db)
    
    # Get product to verify and get price
    product = await db.products.find_one({"id": item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Find variant price
    product_obj = Product(**parse_from_mongo(product))
    variant_price = None
    for variant in product_obj.variants:
        if variant.weight == item.variant_weight:
            variant_price = variant.price
            break
    
    if variant_price is None:
        raise HTTPException(status_code=400, detail="Invalid variant")
    
    # Get or create cart
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        cart = Cart(user_id=current_user["id"])
        cart_dict = prepare_for_mongo(cart.dict())
        await db.carts.insert_one(cart_dict)
        cart = cart_dict
    
    # Update cart items
    cart_items = cart.get("items", [])
    
    # Check if item already exists
    item_exists = False
    for cart_item in cart_items:
        if cart_item["product_id"] == item.product_id and cart_item["variant_weight"] == item.variant_weight:
            cart_item["quantity"] += item.quantity
            item_exists = True
            break
    
    if not item_exists:
        cart_items.append({
            "product_id": item.product_id,
            "variant_weight": item.variant_weight,
            "quantity": item.quantity,
            "price": variant_price
        })
    
    # Update cart
    await db.carts.update_one(
        {"user_id": current_user["id"]},
        {"$set": {
            "items": cart_items,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Item added to cart", "cart_items": len(cart_items)}

@api_router.put("/cart/update")
async def update_cart_item(
    product_id: str,
    variant_weight: str,
    quantity: int,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update cart item quantity"""
    current_user = await get_current_user(credentials, db)
    
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart_items = cart.get("items", [])
    updated = False
    
    for cart_item in cart_items:
        if cart_item["product_id"] == product_id and cart_item["variant_weight"] == variant_weight:
            if quantity <= 0:
                cart_items.remove(cart_item)
            else:
                cart_item["quantity"] = quantity
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    await db.carts.update_one(
        {"user_id": current_user["id"]},
        {"$set": {
            "items": cart_items,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Cart updated"}

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(
    product_id: str,
    variant_weight: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Remove item from cart"""
    current_user = await get_current_user(credentials, db)
    
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart_items = cart.get("items", [])
    cart_items = [item for item in cart_items if not (item["product_id"] == product_id and item["variant_weight"] == variant_weight)]
    
    await db.carts.update_one(
        {"user_id": current_user["id"]},
        {"$set": {
            "items": cart_items,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Item removed from cart"}

@api_router.delete("/cart/clear")
async def clear_cart(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Clear all items from cart"""
    current_user = await get_current_user(credentials, db)
    
    await db.carts.update_one(
        {"user_id": current_user["id"]},
        {"$set": {
            "items": [],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Cart cleared"}

# ==================== COUPON ROUTES ====================

@api_router.post("/coupons", response_model=Coupon)
async def create_coupon(
    coupon: CouponCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new coupon (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    # Check if coupon code already exists
    existing = await db.coupons.find_one({"code": coupon.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon_dict = coupon.dict()
    coupon_dict["code"] = coupon_dict["code"].upper()
    coupon_obj = Coupon(**coupon_dict)
    await db.coupons.insert_one(prepare_for_mongo(coupon_obj.dict()))
    return coupon_obj

@api_router.get("/coupons", response_model=List[Coupon])
async def get_coupons(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get all coupons (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    coupons = await db.coupons.find().to_list(length=None)
    return [Coupon(**parse_from_mongo(coupon)) for coupon in coupons]

@api_router.post("/coupons/apply")
async def apply_coupon(coupon_apply: CouponApply):
    """Validate and apply coupon"""
    coupon = await db.coupons.find_one({"code": coupon_apply.code.upper()})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    coupon_obj = Coupon(**parse_from_mongo(coupon))
    
    # Validate coupon
    if not coupon_obj.is_active:
        raise HTTPException(status_code=400, detail="Coupon is inactive")
    
    if coupon_obj.expiry_date < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Coupon has expired")
    
    if coupon_obj.usage_limit and coupon_obj.used_count >= coupon_obj.usage_limit:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    if coupon_apply.order_amount < coupon_obj.min_order_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order amount of ₹{coupon_obj.min_order_amount} required"
        )
    
    # Calculate discount
    discount = (coupon_apply.order_amount * coupon_obj.discount_percentage) / 100
    if coupon_obj.max_discount_amount:
        discount = min(discount, coupon_obj.max_discount_amount)
    
    return {
        "valid": True,
        "discount_percentage": coupon_obj.discount_percentage,
        "discount_amount": round(discount, 2),
        "final_amount": round(coupon_apply.order_amount - discount, 2)
    }

@api_router.delete("/coupons/{coupon_id}")
async def delete_coupon(
    coupon_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete a coupon (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"message": "Coupon deleted successfully"}

# ==================== BANNER ROUTES ====================

@api_router.post("/banners", response_model=Banner)
async def create_banner(
    banner: BannerCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new banner (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    banner_obj = Banner(**banner.dict())
    await db.banners.insert_one(prepare_for_mongo(banner_obj.dict()))
    return banner_obj

@api_router.get("/banners", response_model=List[Banner])
async def get_banners(active_only: bool = True):
    """Get all banners"""
    filter_query = {}
    if active_only:
        filter_query["is_active"] = True
        # Also check date range
        now = datetime.now(timezone.utc).isoformat()
        filter_query["$or"] = [
            {"start_date": None},
            {"start_date": {"$lte": now}}
        ]
    
    banners = await db.banners.find(filter_query).sort("display_order", 1).to_list(length=None)
    return [Banner(**parse_from_mongo(banner)) for banner in banners]

@api_router.put("/banners/{banner_id}", response_model=Banner)
async def update_banner(
    banner_id: str,
    banner_update: BannerCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update a banner (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    banner_dict = banner_update.dict()
    banner_dict["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.banners.update_one(
        {"id": banner_id},
        {"$set": prepare_for_mongo(banner_dict)}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    updated_banner = await db.banners.find_one({"id": banner_id})
    return Banner(**parse_from_mongo(updated_banner))

@api_router.delete("/banners/{banner_id}")
async def delete_banner(
    banner_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete a banner (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    result = await db.banners.delete_one({"id": banner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"message": "Banner deleted successfully"}

# ==================== ORDER ROUTES ====================

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    """Create a new order"""
    order_dict = order.dict()
    order_obj = Order(**order_dict)
    
    # Generate WhatsApp link
    order_obj.whatsapp_link = generate_whatsapp_link(order_obj)
    
    # If payment method is COD, mark as confirmed
    if order.payment_method == "cod":
        order_obj.payment_status = PaymentStatus.PENDING
        order_obj.status = OrderStatus.CONFIRMED
    
    await db.orders.insert_one(prepare_for_mongo(order_obj.dict()))
    
    # Update coupon usage if coupon was applied
    if order.coupon_code:
        await db.coupons.update_one(
            {"code": order.coupon_code.upper()},
            {"$inc": {"used_count": 1}}
        )
    
    return order_obj

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get order by ID"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**parse_from_mongo(order))

@api_router.get("/orders", response_model=List[Order])
async def get_orders(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get all orders (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    orders = await db.orders.find().sort("created_at", -1).to_list(length=None)
    return [Order(**parse_from_mongo(order)) for order in orders]

@api_router.get("/orders/user/my-orders", response_model=List[Order])
async def get_my_orders(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get current user's orders"""
    current_user = await get_current_user(credentials, db)
    
    orders = await db.orders.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(length=None)
    return [Order(**parse_from_mongo(order)) for order in orders]

@api_router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: OrderStatus,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update order status (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated successfully"}

# ==================== RAZORPAY ROUTES ====================

@api_router.post("/razorpay/create-order")
async def create_razorpay_order(order_data: RazorpayOrderCreate):
    """Create Razorpay order"""
    try:
        # Mock Razorpay order creation for test mode
        razorpay_order_id = f"order_{uuid.uuid4().hex[:10]}"
        
        return {
            "razorpay_order_id": razorpay_order_id,
            "amount": int(order_data.amount * 100),  # Convert to paise
            "currency": "INR",
            "key_id": os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_1234567890')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Razorpay order: {str(e)}")

@api_router.post("/razorpay/verify-payment")
async def verify_razorpay_payment(payment_data: RazorpayPaymentVerify):
    """Verify Razorpay payment"""
    try:
        # In production, verify signature with Razorpay secret
        # For test mode, we'll just update the order
        
        result = await db.orders.update_one(
            {"id": payment_data.order_id},
            {"$set": {
                "razorpay_order_id": payment_data.razorpay_order_id,
                "razorpay_payment_id": payment_data.razorpay_payment_id,
                "razorpay_signature": payment_data.razorpay_signature,
                "payment_status": PaymentStatus.COMPLETED.value,
                "status": OrderStatus.CONFIRMED.value,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {"success": True, "message": "Payment verified successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if phone number already exists (if provided)
    if user_data.phone:
        existing_phone = await db.users.find_one({"phone": user_data.phone})
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
    
    # Validate phone number format (Indian)
    if user_data.phone:
        import re
        phone_pattern = r'^(\+91)?[6-9]\d{9}$'
        if not re.match(phone_pattern, user_data.phone.replace(' ', '').replace('-', '')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number format. Please use Indian format (10 digits starting with 6-9)"
            )
    
    # Validate email format
    if not user_data.email or '@' not in user_data.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    # Validate password strength
    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Create new user with hashed password
    hashed_password = get_password_hash(user_data.password)
    user_dict = {
        "id": str(uuid.uuid4()),
        "name": user_data.name,
        "email": user_data.email,
        "phone": user_data.phone,
        "hashed_password": hashed_password,
        "role": UserRole.USER.value,
        "addresses": [],
        "wishlist": [],
        "is_active": True,
        "is_verified": False,  # Email/phone verification flag
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_dict["id"], "email": user_dict["email"], "role": user_dict["role"]})
    
    # Return token and user info
    user_response = UserResponse(
        id=user_dict["id"],
        name=user_dict["name"],
        email=user_dict["email"],
        phone=user_dict["phone"],
        role=UserRole(user_dict["role"]),
        addresses=user_dict["addresses"],
        wishlist=user_dict["wishlist"],
        is_active=user_dict["is_active"],
        created_at=datetime.fromisoformat(user_dict["created_at"])
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user and return JWT token (supports both email and phone)"""
    # Find user by email or phone
    user = await db.users.find_one({"email": credentials.email})
    
    # If not found by email, try phone
    if not user:
        user = await db.users.find_one({"phone": credentials.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]}
    )
    
    # Return token and user info
    user_response = UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        phone=user.get("phone"),
        role=UserRole(user["role"]),
        addresses=user.get("addresses", []),
        wishlist=user.get("wishlist", []),
        is_active=user.get("is_active", True),
        created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get current user information"""
    current_user = await get_current_user(credentials, db)
    
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        phone=current_user.get("phone"),
        role=UserRole(current_user["role"]),
        addresses=current_user.get("addresses", []),
        wishlist=current_user.get("wishlist", []),
        is_active=current_user.get("is_active", True),
        created_at=datetime.fromisoformat(current_user["created_at"]) if isinstance(current_user["created_at"], str) else current_user["created_at"]
    )

@api_router.put("/auth/profile", response_model=UserResponse)
async def update_profile(
    update_data: dict,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update user profile"""
    current_user = await get_current_user(credentials, db)
    
    # Fields that can be updated
    allowed_fields = ["name", "phone"]
    update_dict = {k: v for k, v in update_data.items() if k in allowed_fields}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_dict:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": update_dict}
        )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": current_user["id"]})
    
    return UserResponse(
        id=updated_user["id"],
        name=updated_user["name"],
        email=updated_user["email"],
        phone=updated_user.get("phone"),
        role=UserRole(updated_user["role"]),
        addresses=updated_user.get("addresses", []),
        wishlist=updated_user.get("wishlist", []),
        is_active=updated_user.get("is_active", True),
        created_at=datetime.fromisoformat(updated_user["created_at"]) if isinstance(updated_user["created_at"], str) else updated_user["created_at"]
    )

# ==================== USER MANAGEMENT (ADMIN) ====================

@api_router.get("/users", response_model=List[UserResponse])
async def get_all_users(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get all users (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    users = await db.users.find().to_list(length=None)
    return [UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        phone=user.get("phone"),
        role=UserRole(user["role"]),
        addresses=user.get("addresses", []),
        wishlist=user.get("wishlist", []),
        is_active=user.get("is_active", True),
        created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
    ) for user in users]

@api_router.put("/users/{user_id}/block")
async def block_user(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Block a user (Admin only)"""
    admin_user = await get_current_admin_user(credentials, db)
    
    # Prevent admin from blocking themselves
    if admin_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User blocked successfully"}

@api_router.put("/users/{user_id}/unblock")
async def unblock_user(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Unblock a user (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User unblocked successfully"}

class UserUpdateAdmin(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    addresses: Optional[List[str]] = None

@api_router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    user_update: UserUpdateAdmin,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update user details (Admin only)"""
    admin_user = await get_current_admin_user(credentials, db)
    
    # Get current user
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build update dict
    update_dict = {}
    if user_update.name is not None:
        update_dict["name"] = user_update.name
    if user_update.phone is not None:
        update_dict["phone"] = user_update.phone
    if user_update.role is not None:
        # Prevent admin from demoting themselves
        if admin_user["id"] == user_id and user_update.role != UserRole.ADMIN:
            raise HTTPException(status_code=400, detail="Cannot change your own role")
        update_dict["role"] = user_update.role.value
    if user_update.addresses is not None:
        update_dict["addresses"] = user_update.addresses
    
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one(
            {"id": user_id},
            {"$set": update_dict}
        )
    
    updated_user = await db.users.find_one({"id": user_id})
    return UserResponse(
        id=updated_user["id"],
        name=updated_user["name"],
        email=updated_user["email"],
        phone=updated_user.get("phone"),
        role=UserRole(updated_user["role"]),
        addresses=updated_user.get("addresses", []),
        wishlist=updated_user.get("wishlist", []),
        is_active=updated_user.get("is_active", True),
        created_at=datetime.fromisoformat(updated_user["created_at"]) if isinstance(updated_user["created_at"], str) else updated_user["created_at"]
    )

@api_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete a user (Admin only)"""
    admin_user = await get_current_admin_user(credentials, db)
    
    # Prevent admin from deleting themselves
    if admin_user["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

# ==================== WISHLIST ROUTES ====================

@api_router.post("/wishlist/add/{product_id}")
async def add_to_wishlist(
    product_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Add product to wishlist"""
    current_user = await get_current_user(credentials, db)
    
    # Check if product exists
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Add to wishlist
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$addToSet": {"wishlist": product_id}}
    )
    
    return {"message": "Product added to wishlist"}

@api_router.delete("/wishlist/remove/{product_id}")
async def remove_from_wishlist(
    product_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Remove product from wishlist"""
    current_user = await get_current_user(credentials, db)
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$pull": {"wishlist": product_id}}
    )
    
    return {"message": "Product removed from wishlist"}

@api_router.get("/wishlist", response_model=List[Product])
async def get_wishlist(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get user's wishlist products"""
    current_user = await get_current_user(credentials, db)
    
    wishlist_ids = current_user.get("wishlist", [])
    if not wishlist_ids:
        return []
    
    products = await db.products.find({"id": {"$in": wishlist_ids}}).to_list(length=None)
    return [Product(**parse_from_mongo(product)) for product in products]

# ==================== REVIEW ROUTES ====================

@api_router.post("/reviews", response_model=Review)
async def create_review(
    review: ReviewCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new review"""
    current_user = await get_current_user(credentials, db)
    
    review_dict = review.dict()
    review_dict["user_id"] = current_user["id"]
    review_obj = Review(**review_dict)
    await db.reviews.insert_one(prepare_for_mongo(review_obj.dict()))
    
    # Update product rating
    product = await db.products.find_one({"id": review.product_id})
    if product:
        # Calculate new average rating
        reviews = await db.reviews.find({"product_id": review.product_id, "is_approved": True}).to_list(length=None)
        if reviews:
            avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
            await db.products.update_one(
                {"id": review.product_id},
                {"$set": {"rating": round(avg_rating, 1), "review_count": len(reviews)}}
            )
    
    return review_obj

@api_router.get("/reviews/{product_id}", response_model=List[Review])
async def get_product_reviews(product_id: str, include_pending: bool = False):
    """Get reviews for a product"""
    filter_query = {"product_id": product_id}
    
    # Only show approved reviews to regular users
    if not include_pending:
        filter_query["is_approved"] = True
    
    reviews = await db.reviews.find(filter_query).to_list(length=None)
    return [Review(**parse_from_mongo(review)) for review in reviews]

@api_router.get("/reviews", response_model=List[Review])
async def get_all_reviews(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get all reviews (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    reviews = await db.reviews.find().to_list(length=None)
    return [Review(**parse_from_mongo(review)) for review in reviews]

@api_router.put("/reviews/{review_id}/approve")
async def approve_review(
    review_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Approve a review (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$set": {"is_approved": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return {"message": "Review approved"}

@api_router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete a review (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review deleted successfully"}

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None
    is_approved: Optional[bool] = None

@api_router.put("/reviews/{review_id}")
async def update_review(
    review_id: str,
    review_update: ReviewUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update a review (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    # Get current review
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Build update dict
    update_dict = {}
    if review_update.rating is not None:
        update_dict["rating"] = review_update.rating
    if review_update.comment is not None:
        update_dict["comment"] = review_update.comment
    if review_update.is_approved is not None:
        update_dict["is_approved"] = review_update.is_approved
    
    if update_dict:
        await db.reviews.update_one(
            {"id": review_id},
            {"$set": update_dict}
        )
        
        # Recalculate product rating if rating changed
        if "rating" in update_dict or "is_approved" in update_dict:
            product = await db.products.find_one({"id": review["product_id"]})
            if product:
                reviews = await db.reviews.find({"product_id": review["product_id"], "is_approved": True}).to_list(length=None)
                if reviews:
                    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
                    await db.products.update_one(
                        {"id": review["product_id"]},
                        {"$set": {"rating": round(avg_rating, 1), "review_count": len(reviews)}}
                    )
    
    updated_review = await db.reviews.find_one({"id": review_id})
    return Review(**parse_from_mongo(updated_review))

# ==================== THEME/SETTINGS MANAGEMENT ====================

class ThemeSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    theme_name: str
    primary_color: str = "#f97316"  # orange-500
    secondary_color: str = "#f59e0b"  # amber-500
    accent_color: str = "#ea580c"  # orange-600
    festival_mode: bool = False
    festival_theme: Optional[str] = None  # "diwali", "holi", "christmas" etc.
    hero_image_url: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ThemeSettingsCreate(BaseModel):
    theme_name: str
    primary_color: str = "#f97316"
    secondary_color: str = "#f59e0b"
    accent_color: str = "#ea580c"
    festival_mode: bool = False
    festival_theme: Optional[str] = None
    hero_image_url: Optional[str] = None
    logo_url: Optional[str] = None

@api_router.get("/settings/theme")
async def get_active_theme():
    """Get active theme settings"""
    theme = await db.theme_settings.find_one({"is_active": True})
    if not theme:
        # Return default theme
        default_theme = ThemeSettings(
            theme_name="Default",
            primary_color="#f97316",
            secondary_color="#f59e0b",
            accent_color="#ea580c"
        )
        return default_theme
    return ThemeSettings(**parse_from_mongo(theme))

@api_router.get("/settings/themes")
async def get_all_themes(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get all theme settings (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    themes = await db.theme_settings.find().to_list(length=None)
    return [ThemeSettings(**parse_from_mongo(theme)) for theme in themes]

@api_router.post("/settings/theme", response_model=ThemeSettings)
async def create_theme(
    theme: ThemeSettingsCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new theme (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    theme_obj = ThemeSettings(**theme.dict())
    await db.theme_settings.insert_one(prepare_for_mongo(theme_obj.dict()))
    return theme_obj

@api_router.put("/settings/theme/{theme_id}")
async def update_theme(
    theme_id: str,
    theme_update: ThemeSettingsCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update a theme (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    theme_dict = theme_update.dict()
    theme_dict["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.theme_settings.update_one(
        {"id": theme_id},
        {"$set": prepare_for_mongo(theme_dict)}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Theme not found")
    
    updated_theme = await db.theme_settings.find_one({"id": theme_id})
    return ThemeSettings(**parse_from_mongo(updated_theme))

@api_router.put("/settings/theme/{theme_id}/activate")
async def activate_theme(
    theme_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Activate a theme (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    # Deactivate all themes
    await db.theme_settings.update_many({}, {"$set": {"is_active": False}})
    
    # Activate selected theme
    result = await db.theme_settings.update_one(
        {"id": theme_id},
        {"$set": {"is_active": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Theme not found")
    
    return {"message": "Theme activated successfully"}

@api_router.delete("/settings/theme/{theme_id}")
async def delete_theme(
    theme_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete a theme (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    result = await db.theme_settings.delete_one({"id": theme_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Theme not found")
    return {"message": "Theme deleted successfully"}

# ==================== CHATBOT ROUTES ====================

# Contact Form Model
class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    subject: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_read: bool = False

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

@api_router.post("/contact")
async def submit_contact_form(contact_data: ContactMessageCreate):
    """Submit contact form message"""
    try:
        contact_message = ContactMessage(**contact_data.dict())
        await db.contact_messages.insert_one(prepare_for_mongo(contact_message.dict()))
        
        return {
            "success": True,
            "message": "Thank you for contacting us! We will get back to you soon.",
            "id": contact_message.id
        }
    except Exception as e:
        logger.error(f"Contact form error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit contact form")

@api_router.get("/contact/messages")
async def get_contact_messages(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get all contact messages (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    messages = await db.contact_messages.find().sort("created_at", -1).to_list(length=None)
    return [ContactMessage(**parse_from_mongo(msg)) for msg in messages]

@api_router.put("/orders/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Cancel order (within 1 hour for users, anytime for admin)"""
    current_user = await get_current_user(credentials, db)
    
    # Get order
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check ownership or admin
    is_admin = current_user.get("role") == "admin"
    is_owner = order["user_id"] == current_user["id"]
    
    if not (is_admin or is_owner):
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")
    
    # Check if already cancelled or delivered
    if order["status"] in ["cancelled", "delivered"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status: {order['status']}")
    
    # Check 1-hour window for regular users
    if not is_admin:
        order_time = datetime.fromisoformat(order["created_at"]) if isinstance(order["created_at"], str) else order["created_at"]
        time_elapsed = datetime.now(timezone.utc) - order_time
        
        if time_elapsed > timedelta(hours=1):
            raise HTTPException(
                status_code=400,
                detail="Order can only be cancelled within 1 hour of placement. Please contact admin for assistance."
            )
    
    # Update order status
    update_data = {
        "status": OrderStatus.CANCELLED.value,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # If payment was completed, mark for refund
    if order.get("payment_status") == PaymentStatus.COMPLETED.value:
        update_data["payment_status"] = PaymentStatus.REFUNDED.value
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    return {
        "success": True,
        "message": "Order cancelled successfully" + (" and refund initiated" if order.get("payment_status") == PaymentStatus.COMPLETED.value else ""),
        "can_reorder": True
    }

@api_router.post("/chat")
async def chat_with_bot(chat_request: ChatRequest):
    try:
        # Get Gemini API key from environment
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if not gemini_api_key:
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
        # Configure Gemini
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
       
        # Check if user is asking about their orders
        order_context = ""
        if any(keyword in chat_request.message.lower() for keyword in ['my order', 'my orders', 'order status', 'track order', 'where is my order']):
            try:
                # Try to get recent orders for this session
                recent_orders = await db.orders.find().sort("created_at", -1).limit(5).to_list(length=5)
                if recent_orders:
                    order_context = "\n\nRecent Orders:\n"
                    for order in recent_orders:
                        order_context += f"- Order #{order['id'][:8]}: Status: {order['status']}, Amount: ₹{order.get('final_amount', order['total_amount'])}\n"
            except Exception as e:
                logger.error(f"Error fetching orders for chatbot: {str(e)}")
        
        # Create system message for Mithaas Delights context
        system_message = f"""You are a helpful customer support assistant for Mithaas Delights, a premium Indian sweets and snacks online store. 

About Mithaas Delights:
- We sell authentic Indian sweets (mithai), savory snacks (namkeen), laddus, Bengali sweets, dry fruit sweets, and festival specials
- We offer premium quality products made with traditional recipes and finest ingredients
- We provide free delivery and accept both Cash on Delivery and online payments
- Our Contact hours: Monday-Saturday 9:00 AM - 9:00 PM, Sunday 10:00 AM - 8:00 PM
- Contact: +91 8989549544, mithaasdelightsofficial@gmail.com
- Location: 64, Kaveri Nagar, Indore, Madhya Pradesh 452006, India

You should help customers with:
- Product information and recommendations
- Order placement guidance
- Delivery and payment information
- General FAQs about our products and services
- Order tracking assistance{order_context}

Always be friendly, helpful, and promote our premium quality products. If you don't know specific product details, suggest the customer browse our catalog or contact our support team."""
        
        # Get response
        response = model.generate_content([system_message, chat_request.message])
        answer = response.text if response else "Sorry, I couldn't generate a response."

        # Store chat in database
        chat_record = ChatMessage(
            session_id=chat_request.session_id,
            message=chat_request.message,
            response=answer
        )
        await db.chat_messages.insert_one(prepare_for_mongo(chat_record.dict()))
        
        return {
            "response": answer,
            "session_id": chat_request.session_id,
            "timestamp": chat_record.created_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        # Fallback response for errors
        fallback_responses = [
            "I'm sorry, I'm having trouble connecting right now. Please try again in a moment or contact our support team at +91 8989549544.",
            "Thank you for your interest in Mithaas Delights! I'm temporarily unavailable, but you can browse our products or call us at +91 8989549544 for immediate assistance.",
            "I apologize for the inconvenience. Please feel free to explore our premium collection of sweets and snacks, or reach out to our team directly."
        ]
        import random
        return {
            "response": random.choice(fallback_responses),
            "session_id": chat_request.session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error": "ai_service_unavailable"
        }

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    try:
        chat_history = await db.chat_messages.find(
            {"session_id": session_id}
        ).sort("created_at", 1).to_list(length=50)  # Last 50 messages
        
        return [
            {
                "message": chat["message"],
                "response": chat["response"],
                "timestamp": chat["created_at"]
            }
            for chat in chat_history
        ]
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        return []

# ==================== INITIALIZATION ROUTES ====================

@api_router.post("/init-admin")
async def init_admin():
    """Initialize admin user (use only once)"""
    # Check if admin already exists
    existing_admin = await db.users.find_one({"role": "admin"})
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user already exists"
        )
    
    # Create admin user
    admin_data = {
        "id": str(uuid.uuid4()),
        "name": "Admin",
        "email": "admin@mithaasdelights.com",
        "phone": "+91 8989549544",
        "hashed_password": get_password_hash("admin123"),
        "role": UserRole.ADMIN.value,
        "addresses": [],
        "wishlist": [],
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin_data)
    
    return {
        "message": "Admin user created successfully",
        "email": "admin@mithaasdelights.com",
        "password": "admin123",
        "warning": "Please change this password immediately!"
    }

@api_router.post("/init-sample-data")
async def init_sample_data():
    """Initialize sample products data"""
    # Sample products with variants
    sample_products = [
        {
            "name": "Kaju Katli",
            "description": "Premium cashew-based diamond-shaped sweet, rich and melt-in-mouth texture",
            "category": "mithai",
            "variants": [
                {"weight": "250g", "price": 599, "original_price": 699, "is_available": True},
                {"weight": "500g", "price": 1099, "original_price": 1299, "is_available": True},
                {"weight": "1kg", "price": 2099, "original_price": 2499, "is_available": True}
            ],
            "image_url": "https://recipes.net/wp-content/uploads/2022/07/kaju-katli.jpg",
            "media_gallery": [
                "https://recipes.net/wp-content/uploads/2022/07/kaju-katli.jpg"
            ],
            "ingredients": ["Cashews", "Sugar", "Ghee", "Silver Leaf"],
            "is_featured": True,
            "is_sold_out": False,
            "discount_percentage": 15
        },
        {
            "name": "Gulab Jamun",
            "description": "Soft, spongy milk-solid balls soaked in rose-flavored sugar syrup",
            "category": "mithai",
            "variants": [
                {"weight": "250g", "price": 199, "is_available": True},
                {"weight": "500g", "price": 349, "is_available": True},
                {"weight": "1kg", "price": 649, "is_available": True}
            ],
            "image_url": "https://tse3.mm.bing.net/th/id/OIP.B32bansRI7RS3yfbUSEBNwHaHa?rs=1&pid=ImgDetMain",
            "media_gallery": ["https://tse3.mm.bing.net/th/id/OIP.B32bansRI7RS3yfbUSEBNwHaHa?rs=1&pid=ImgDetMain"],
            "ingredients": ["Milk Powder", "Sugar", "Ghee", "Rose Water"],
            "is_featured": True,
            "is_sold_out": False
        },
        {
            "name": "Besan Laddu",
            "description": "Traditional gram flour balls sweetened with jaggery and enriched with ghee",
            "category": "laddu",
            "variants": [
                {"weight": "250g", "price": 299, "is_available": True},
                {"weight": "500g", "price": 549, "is_available": True},
                {"weight": "1kg", "price": 999, "is_available": True}
            ],
            "image_url": "https://th.bing.com/th/id/OIP.0ZB3XubESFclOtXe3qJYxwHaHa?w=179&h=180&c=7&r=0&o=7&pid=1.7",
            "media_gallery": ["https://th.bing.com/th/id/OIP.0ZB3XubESFclOtXe3qJYxwHaHa?w=179&h=180&c=7&r=0&o=7&pid=1.7"],
            "ingredients": ["Gram Flour", "Jaggery", "Ghee", "Cashews", "Raisins"],
            "is_featured": True,
            "is_sold_out": False
        },
        {
            "name": "Masala Mixture",
            "description": "Crispy blend of lentils, nuts, and spices - perfect tea-time snack",
            "category": "namkeen",
            "variants": [
                {"weight": "250g", "price": 149, "is_available": True},
                {"weight": "500g", "price": 279, "is_available": True},
                {"weight": "1kg", "price": 499, "is_available": True}
            ],
            "image_url": "https://th.bing.com/th/id/OIP.yPwaOp3hag9pVNe6rTkgfQHaHa?w=166&h=180&c=7&r=0&o=7&pid=1.7",
            "media_gallery": ["https://th.bing.com/th/id/OIP.yPwaOp3hag9pVNe6rTkgfQHaHa?w=166&h=180&c=7&r=0&o=7&pid=1.7"],
            "ingredients": ["Lentils", "Peanuts", "Spices", "Vegetable Oil"],
            "is_sold_out": False
        },
        {
            "name": "Rasgulla",
            "description": "Soft, spongy cottage cheese balls in light sugar syrup",
            "category": "bengali_sweets",
            "variants": [
                {"weight": "250g", "price": 199, "is_available": True},
                {"weight": "500g", "price": 349, "is_available": True}
            ],
            "image_url": "https://th.bing.com/th/id/OIP.ibmTOU1t-Zl1LKlZUOAewgHaHa?w=225&h=180&c=7&r=0&o=7&pid=1.7",
            "media_gallery": ["https://th.bing.com/th/id/OIP.ibmTOU1t-Zl1LKlZUOAewgHaHa?w=225&h=180&c=7&r=0&o=7&pid=1.7"],
            "ingredients": ["Cottage Cheese", "Sugar", "Cardamom"],
            "is_featured": True,
            "is_sold_out": False
        },
        {
            "name": "Dry Fruit Barfi",
            "description": "Rich and nutritious sweet made with assorted dry fruits and khoya",
            "category": "dry_fruit_sweets",
            "variants": [
                {"weight": "250g", "price": 699, "original_price": 799, "is_available": True},
                {"weight": "500g", "price": 1299, "original_price": 1499, "is_available": True}
            ],
            "image_url": "https://th.bing.com/th/id/OIP.gMb3Wu-UzCV_yv4u-yNenwAAAA?w=285&h=190&c=7&r=0&o=7&pid=1.7",
            "media_gallery": ["https://th.bing.com/th/id/OIP.gMb3Wu-UzCV_yv4u-yNenwAAAA?w=285&h=190&c=7&r=0&o=7&pid=1.7"],
            "ingredients": ["Almonds", "Cashews", "Pistachios", "Khoya", "Sugar"],
            "discount_percentage": 11,
            "is_sold_out": False
        }
    ]
    
    # Clear existing products
    await db.products.delete_many({})
    
    for product_data in sample_products:
        product_obj = Product(**product_data)
        await db.products.insert_one(prepare_for_mongo(product_obj.dict()))
    
    return {"message": "Sample data initialized successfully", "products_added": len(sample_products)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
