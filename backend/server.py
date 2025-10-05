from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Security, File, UploadFile, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
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
try:
    import google.generativeai as genai
except ImportError:
    genai = None
from auth_utils import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin_user
)
from delivery_utils import calculate_delivery_charge, geocode_address
from razorpay_utils import create_razorpay_order, verify_razorpay_signature, create_refund
from file_upload_utils import save_base64_image, save_uploaded_file, get_file_size
# Import notification, theme, and offers system classes
from notification_system import NotificationManager, NotificationStatus, NotificationCreate
from theme_system import ThemeManager, ThemeConfig, ThemeCreateUpdate, DEFAULT_THEMES
from offers_system import OfferManager, Offer, OfferCreate, OfferUpdate, OfferType
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# Helper function to convert MongoDB ObjectId to string for JSON serialization
def serialize_mongo_document(doc):
    """Convert MongoDB document to JSON-serializable dict by converting ObjectId to string"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_mongo_document(item) for item in doc]
    if isinstance(doc, dict):
        serialized = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                serialized[key] = str(value)
            elif isinstance(value, dict):
                serialized[key] = serialize_mongo_document(value)
            elif isinstance(value, list):
                serialized[key] = serialize_mongo_document(value)
            else:
                serialized[key] = value
        return serialized
    return doc

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize Notification, Theme, and Offer Managers
notification_manager = NotificationManager(db)
theme_manager = ThemeManager(db)
offer_manager = OfferManager(db)

# Create the main app without a prefix
app = FastAPI(title="Mithaas Delights API", version="1.0.0")

# CORS Configuration
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins[0] != '*' else ['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))  # Unique variant ID
    weight: str  # e.g., "250g", "500g", "1kg"
    price: float
    original_price: Optional[float] = None
    sku: Optional[str] = None  # Stock keeping unit
    stock: int = 100  # Available stock
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

# Enhanced Coupon Model with advanced features
class CouponType(str, Enum):
    PERCENTAGE = "percentage"
    FLAT = "flat"
    BUY_X_GET_Y = "buy_x_get_y"
    FREE_SHIPPING = "free_shipping"
    CATEGORY_DISCOUNT = "category_discount"

class Coupon(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_type: CouponType = CouponType.PERCENTAGE
    
    # Standard discount fields
    discount_percentage: Optional[int] = Field(None, ge=1, le=100)
    discount_amount: Optional[float] = None  # For flat discounts
    max_discount_amount: Optional[float] = None
    min_order_amount: float = 0
    
    # Product/Category targeting
    product_ids: List[str] = []  # Specific product IDs
    category_names: List[str] = []  # Category names for category-wide discounts
    
    # Buy X Get Y offer fields
    buy_quantity: Optional[int] = None  # Buy X items
    get_quantity: Optional[int] = None  # Get Y items free
    buy_product_ids: List[str] = []  # Products that qualify for buy condition
    get_product_ids: List[str] = []  # Products that are free (empty = same as buy products)
    
    # Usage and validity
    expiry_date: datetime
    is_active: bool = True
    usage_limit: Optional[int] = None  # Total usage limit
    per_user_limit: Optional[int] = None  # Per user usage limit
    used_count: int = 0
    
    # Additional settings
    stackable: bool = False  # Can be combined with other coupons
    auto_apply: bool = False  # Automatically apply if conditions met
    description: Optional[str] = None  # Human readable description
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CouponCreate(BaseModel):
    code: str
    discount_type: CouponType = CouponType.PERCENTAGE
    
    # Standard discount fields
    discount_percentage: Optional[int] = Field(None, ge=1, le=100)
    discount_amount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    min_order_amount: float = 0
    
    # Product/Category targeting
    product_ids: List[str] = []
    category_names: List[str] = []
    
    # Buy X Get Y offer fields
    buy_quantity: Optional[int] = None
    get_quantity: Optional[int] = None
    buy_product_ids: List[str] = []
    get_product_ids: List[str] = []
    
    # Usage and validity
    expiry_date: datetime
    usage_limit: Optional[int] = None
    per_user_limit: Optional[int] = None
    
    # Additional settings
    stackable: bool = False
    auto_apply: bool = False
    description: Optional[str] = None

class CouponApply(BaseModel):
    code: str
    order_amount: float
    cart_items: List['CartItem'] = []  # For product-specific validation
    user_id: Optional[str] = None  # For per-user limit validation

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

# Review Model with Photos and Approval
class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_id: str
    user_name: str
    rating: int = Field(ge=1, le=5)
    comment: str
    images: List[str] = []  # Photo URLs
    is_approved: bool = False  # Admin approval required
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str
    images: List[str] = []

# Media Gallery Models
class MediaItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    media_url: str
    media_type: str  # "image" or "video"
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MediaItemCreate(BaseModel):
    title: str
    media_url: str
    media_type: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    display_order: int = 0

# Bulk Order Models
class BulkOrderStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    QUOTED = "quoted"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"

class BulkOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    contact_person: str
    email: EmailStr
    phone: str
    product_details: str  # Description of products needed
    quantity: str  # e.g., "50 boxes", "100 kg"
    preferred_date: Optional[datetime] = None
    delivery_address: str
    status: BulkOrderStatus = BulkOrderStatus.PENDING
    admin_notes: Optional[str] = None
    quoted_amount: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BulkOrderCreate(BaseModel):
    company_name: str
    contact_person: str
    email: EmailStr
    phone: str
    product_details: str
    quantity: str
    preferred_date: Optional[datetime] = None
    delivery_address: str

class BulkOrderUpdate(BaseModel):
    status: Optional[BulkOrderStatus] = None
    admin_notes: Optional[str] = None
    quoted_amount: Optional[float] = None

# Order Status History Model
class OrderStatusHistory(BaseModel):
    status: OrderStatus
    timestamp: datetime
    note: Optional[str] = None

# Enhanced Order Model with Status History and Delivery Info
class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem]
    total_amount: float
    discount_amount: float = 0
    delivery_charge: float = 0
    tax_amount: float = 0
    final_amount: float
    coupon_code: Optional[str] = None
    status: OrderStatus = OrderStatus.PENDING
    status_history: List[OrderStatusHistory] = []
    payment_status: PaymentStatus = PaymentStatus.PENDING
    payment_method: str = "cod"
    delivery_address: str
    delivery_type: str = "delivery"  # "delivery" or "pickup"
    delivery_distance_km: Optional[float] = None
    customer_lat: Optional[float] = None
    customer_lon: Optional[float] = None
    phone_number: str
    email: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    whatsapp_link: Optional[str] = None
    advance_required: bool = False
    advance_amount: Optional[float] = None
    advance_paid: bool = False
    cancelled_at: Optional[datetime] = None
    refund_status: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    user_id: str
    items: List[CartItem]
    total_amount: float
    discount_amount: float = 0
    delivery_charge: float = 0
    tax_amount: float = 0
    final_amount: float
    coupon_code: Optional[str] = None
    delivery_address: str
    delivery_type: str = "delivery"
    customer_lat: Optional[float] = None
    customer_lon: Optional[float] = None
    phone_number: str
    email: str
    payment_method: str = "cod"
    advance_required: bool = False
    advance_amount: Optional[float] = None

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
    """Parse MongoDB document back to Python objects and serialize ObjectId"""
    # First serialize ObjectId fields to strings
    item = serialize_mongo_document(item)
    
    # Then parse datetime strings back to datetime objects
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
    """Create a new product (Admin only) - FIXED: Prevents duplicates"""
    await get_current_admin_user(credentials, db)
    
    # Check if product with same name already exists
    existing_product = await db.products.find_one({"name": product.name})
    if existing_product:
        raise HTTPException(status_code=400, detail="Product with this name already exists")
    
    product_dict = product.dict()
    product_obj = Product(**product_dict)
    
    try:
        # Insert with unique constraint check
        await db.products.insert_one(prepare_for_mongo(product_obj.dict()))
        logger.info(f"Product created successfully: {product_obj.id} - {product_obj.name}")
        return product_obj
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create product")

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_update: ProductCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update a product (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    # Get old product to check for removed variants
    old_product = await db.products.find_one({"id": product_id})
    if not old_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Prepare update
    product_dict = product_update.dict()
    product_dict["id"] = product_id
    product_dict["updated_at"] = datetime.now(timezone.utc)
    
    # Update product
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": prepare_for_mongo(product_dict)}
    )
    
    # Check for removed variants and clean them from carts
    old_variant_weights = {v["weight"] for v in old_product.get("variants", [])}
    new_variant_weights = {v.weight for v in product_update.variants}
    removed_variants = old_variant_weights - new_variant_weights
    
    if removed_variants:
        # Remove cart items with deleted variants
        for removed_weight in removed_variants:
            await db.carts.update_many(
                {"items.product_id": product_id, "items.variant_weight": removed_weight},
                {"$pull": {"items": {"product_id": product_id, "variant_weight": removed_weight}}}
            )
        logger.info(f"Removed variants {removed_variants} from carts for product {product_id}")
    
    updated_product = await db.products.find_one({"id": product_id})
    return Product(**parse_from_mongo(updated_product))

@api_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete a product (Admin only) - Also removes from all user carts"""
    await get_current_admin_user(credentials, db)
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # STEP D: Remove product from all user carts
    await db.carts.update_many(
        {"items.product_id": product_id},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    
    logger.info(f"Product {product_id} deleted and removed from all carts")
    return {"message": "Product deleted successfully and removed from carts"}

# ==================== CATEGORY MANAGEMENT ROUTES ====================

# Dynamic Category Model
class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    display_order: int = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

@api_router.get("/categories", response_model=List[Category])
async def get_categories(active_only: bool = True):
    """Get all categories"""
    filter_query = {}
    if active_only:
        filter_query["is_active"] = True
    
    categories = await db.categories.find(filter_query).sort("display_order", 1).to_list(length=None)
    return [Category(**parse_from_mongo(cat)) for cat in categories]

@api_router.post("/categories", response_model=Category)
async def create_category(
    category: CategoryCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new category (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    # Check if category name already exists
    existing = await db.categories.find_one({"name": {"$regex": f"^{category.name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    category_dict = category.dict()
    category_obj = Category(**category_dict)
    await db.categories.insert_one(prepare_for_mongo(category_obj.dict()))
    return category_obj

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(
    category_id: str,
    category_update: CategoryUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update a category (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    # Check if category exists
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if new name conflicts (if name is being updated)
    if category_update.name and category_update.name != category["name"]:
        existing = await db.categories.find_one({
            "name": {"$regex": f"^{category_update.name}$", "$options": "i"},
            "id": {"$ne": category_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Category name already exists")
    
    # Prepare update
    update_data = {k: v for k, v in category_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Update category
    await db.categories.update_one(
        {"id": category_id},
        {"$set": prepare_for_mongo(update_data)}
    )
    
    updated_category = await db.categories.find_one({"id": category_id})
    return Category(**parse_from_mongo(updated_category))

@api_router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete a category (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    # Check if category exists
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category is being used by products
    products_using_category = await db.products.count_documents({"category": category["name"]})
    if products_using_category > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete category. {products_using_category} products are using this category."
        )
    
    # Delete category
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted successfully"}

@api_router.post("/categories/init-default")
async def init_default_categories(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Initialize default categories from enum (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    # Check if categories already exist
    existing_count = await db.categories.count_documents({})
    if existing_count > 0:
        raise HTTPException(status_code=400, detail="Categories already initialized")
    
    # Create default categories from ProductCategory enum
    default_categories = [
        {"name": "mithai", "description": "Traditional Indian sweets", "display_order": 1},
        {"name": "namkeen", "description": "Savory snacks and treats", "display_order": 2},
        {"name": "farsan", "description": "Gujarati farsan specialties", "display_order": 3},
        {"name": "bengali_sweets", "description": "Bengali sweet delicacies", "display_order": 4},
        {"name": "dry_fruit_sweets", "description": "Premium dry fruit sweets", "display_order": 5},
        {"name": "laddu", "description": "Various types of laddus", "display_order": 6},
        {"name": "festival_special", "description": "Special festival items", "display_order": 7}
    ]
    
    categories_to_insert = []
    for cat_data in default_categories:
        category = Category(**cat_data)
        categories_to_insert.append(prepare_for_mongo(category.dict()))
    
    await db.categories.insert_many(categories_to_insert)
    
    return {"message": f"Initialized {len(categories_to_insert)} default categories"}

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

@api_router.post("/cart/merge")
async def merge_cart(
    guest_cart_items: List[CartItemModel],
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Merge guest cart with user cart on login"""
    current_user = await get_current_user(credentials, db)
    
    # Get or create user cart
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        cart = Cart(user_id=current_user["id"])
        cart_dict = prepare_for_mongo(cart.dict())
        await db.carts.insert_one(cart_dict)
        cart = cart_dict
    
    cart_items = cart.get("items", [])
    
    # Merge guest cart items
    for guest_item in guest_cart_items:
        # Check if item already exists (by product_id AND variant_weight)
        item_exists = False
        for cart_item in cart_items:
            if (cart_item["product_id"] == guest_item.product_id and 
                cart_item["variant_weight"] == guest_item.variant_weight):
                # Update quantity
                cart_item["quantity"] += guest_item.quantity
                item_exists = True
                break
        
        if not item_exists:
            # Add new item
            cart_items.append(guest_item.dict())
    
    # Update cart
    await db.carts.update_one(
        {"user_id": current_user["id"]},
        {"$set": {
            "items": cart_items,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Cart merged successfully", "cart_items": len(cart_items)}

@api_router.post("/cart/validate")
async def validate_cart(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Validate cart and remove invalid items (deleted products/variants)"""
    current_user = await get_current_user(credentials, db)
    
    cart = await db.carts.find_one({"user_id": current_user["id"]})
    if not cart:
        return {"message": "Cart is empty", "removed_items": []}
    
    cart_items = cart.get("items", [])
    valid_items = []
    removed_items = []
    
    for item in cart_items:
        # Check if product exists
        product = await db.products.find_one({"id": item["product_id"]})
        if not product:
            removed_items.append(item)
            continue
        
        # Check if variant exists
        product_obj = Product(**parse_from_mongo(product))
        variant_exists = any(v.weight == item["variant_weight"] for v in product_obj.variants)
        
        if variant_exists:
            valid_items.append(item)
        else:
            removed_items.append(item)
    
    # Update cart with valid items only
    await db.carts.update_one(
        {"user_id": current_user["id"]},
        {"$set": {
            "items": valid_items,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": f"Cart validated. Removed {len(removed_items)} invalid items.",
        "removed_items": removed_items,
        "valid_items_count": len(valid_items)
    }

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
    """Enhanced coupon application with support for multiple coupon types"""
    coupon = await db.coupons.find_one({"code": coupon_apply.code.upper()})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    coupon_obj = Coupon(**parse_from_mongo(coupon))
    
    # Basic coupon validation
    if not coupon_obj.is_active:
        raise HTTPException(status_code=400, detail="Coupon is inactive")
    
    if coupon_obj.expiry_date < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Coupon has expired")
    
    if coupon_obj.usage_limit and coupon_obj.used_count >= coupon_obj.usage_limit:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    # Per-user limit validation
    if coupon_obj.per_user_limit and coupon_apply.user_id:
        user_usage_count = await db.orders.count_documents({
            "user_id": coupon_apply.user_id,
            "coupon_code": coupon_obj.code
        })
        if user_usage_count >= coupon_obj.per_user_limit:
            raise HTTPException(
                status_code=400,
                detail=f"You have already used this coupon {coupon_obj.per_user_limit} times"
            )
    
    # Get product details for cart items if needed
    cart_products = {}
    if coupon_apply.cart_items:
        product_ids = [item.product_id for item in coupon_apply.cart_items]
        products = await db.products.find({"id": {"$in": product_ids}}).to_list(length=None)
        cart_products = {p["id"]: p for p in products}
    
    # Handle different coupon types
    if coupon_obj.discount_type == CouponType.BUY_X_GET_Y:
        return await apply_buy_x_get_y_coupon(coupon_obj, coupon_apply, cart_products)
    elif coupon_obj.discount_type == CouponType.CATEGORY_DISCOUNT:
        return await apply_category_coupon(coupon_obj, coupon_apply, cart_products)
    elif coupon_obj.discount_type == CouponType.FREE_SHIPPING:
        return apply_free_shipping_coupon(coupon_obj, coupon_apply)
    else:
        return await apply_standard_coupon(coupon_obj, coupon_apply, cart_products)

async def apply_buy_x_get_y_coupon(coupon_obj: Coupon, coupon_apply: CouponApply, cart_products: dict):
    """Apply Buy X Get Y coupon logic"""
    if not coupon_obj.buy_quantity or not coupon_obj.get_quantity:
        raise HTTPException(status_code=400, detail="Invalid Buy X Get Y coupon configuration")
    
    if not coupon_apply.cart_items:
        raise HTTPException(status_code=400, detail="Cart items required for Buy X Get Y coupons")
    
    # Find eligible products in cart
    buy_products = coupon_obj.buy_product_ids if coupon_obj.buy_product_ids else list(cart_products.keys())
    eligible_items = [item for item in coupon_apply.cart_items if item.product_id in buy_products]
    
    if not eligible_items:
        raise HTTPException(status_code=400, detail="No eligible products found for this offer")
    
    # Calculate total quantity of eligible items
    total_eligible_qty = sum(item.quantity for item in eligible_items)
    
    if total_eligible_qty < coupon_obj.buy_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Buy at least {coupon_obj.buy_quantity} eligible items to get {coupon_obj.get_quantity} free"
        )
    
    # Calculate how many free items they get
    sets_qualified = total_eligible_qty // coupon_obj.buy_quantity
    free_items_count = sets_qualified * coupon_obj.get_quantity
    
    # Calculate discount (price of cheapest free items)
    eligible_items_sorted = sorted(eligible_items, key=lambda x: x.price)
    discount = 0
    remaining_free = free_items_count
    
    for item in eligible_items_sorted:
        if remaining_free <= 0:
            break
        free_qty = min(remaining_free, item.quantity)
        discount += item.price * free_qty
        remaining_free -= free_qty
    
    return {
        "valid": True,
        "discount_type": "buy_x_get_y",
        "discount_amount": round(discount, 2),
        "final_amount": round(coupon_apply.order_amount - discount, 2),
        "buy_quantity": coupon_obj.buy_quantity,
        "get_quantity": coupon_obj.get_quantity,
        "free_items_count": free_items_count,
        "message": f"Buy {coupon_obj.buy_quantity} get {coupon_obj.get_quantity} free applied!"
    }

async def apply_category_coupon(coupon_obj: Coupon, coupon_apply: CouponApply, cart_products: dict):
    """Apply category-specific coupon"""
    if not coupon_obj.category_names:
        raise HTTPException(status_code=400, detail="No categories specified for this coupon")
    
    if not coupon_apply.cart_items:
        raise HTTPException(status_code=400, detail="Cart items required for category coupons")
    
    # Find items in eligible categories
    eligible_items = []
    for item in coupon_apply.cart_items:
        product = cart_products.get(item.product_id)
        if product and product.get("category") in coupon_obj.category_names:
            eligible_items.append(item)
    
    if not eligible_items:
        raise HTTPException(
            status_code=400,
            detail=f"No items found in eligible categories: {', '.join(coupon_obj.category_names)}"
        )
    
    # Calculate discount on eligible items
    eligible_amount = sum(item.price * item.quantity for item in eligible_items)
    
    if eligible_amount < coupon_obj.min_order_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order amount of ₹{coupon_obj.min_order_amount} required for eligible categories"
        )
    
    discount = (eligible_amount * coupon_obj.discount_percentage) / 100
    
    if coupon_obj.max_discount_amount:
        discount = min(discount, coupon_obj.max_discount_amount)
    
    return {
        "valid": True,
        "discount_type": "category_discount",
        "discount_percentage": coupon_obj.discount_percentage,
        "discount_amount": round(discount, 2),
        "final_amount": round(coupon_apply.order_amount - discount, 2),
        "eligible_categories": coupon_obj.category_names,
        "eligible_amount": round(eligible_amount, 2)
    }

def apply_free_shipping_coupon(coupon_obj: Coupon, coupon_apply: CouponApply):
    """Apply free shipping coupon"""
    if coupon_apply.order_amount < coupon_obj.min_order_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order amount of ₹{coupon_obj.min_order_amount} required for free shipping"
        )
    
    # Assuming standard delivery charge (this should come from delivery calculation)
    delivery_discount = 50  # Default delivery charge
    
    return {
        "valid": True,
        "discount_type": "free_shipping",
        "discount_amount": delivery_discount,
        "final_amount": coupon_apply.order_amount,  # No change to product amount
        "delivery_discount": delivery_discount,
        "message": "Free shipping applied!"
    }

async def apply_standard_coupon(coupon_obj: Coupon, coupon_apply: CouponApply, cart_products: dict):
    """Apply standard percentage or flat discount coupon"""
    # Product-specific coupon validation
    if coupon_obj.product_ids:
        if not coupon_apply.cart_items:
            raise HTTPException(status_code=400, detail="Cart items required for product-specific coupons")
        
        eligible_items = [
            item for item in coupon_apply.cart_items 
            if item.product_id in coupon_obj.product_ids
        ]
        
        if not eligible_items:
            raise HTTPException(
                status_code=400,
                detail="This coupon is not applicable to any items in your cart"
            )
        
        discount_base_amount = sum(item.price * item.quantity for item in eligible_items)
        
        if discount_base_amount < coupon_obj.min_order_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum order amount of ₹{coupon_obj.min_order_amount} required for eligible products"
            )
    else:
        # Global coupon - applies to entire order
        if coupon_apply.order_amount < coupon_obj.min_order_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum order amount of ₹{coupon_obj.min_order_amount} required"
            )
        
        discount_base_amount = coupon_apply.order_amount
    
    # Calculate discount based on type
    if coupon_obj.discount_type == CouponType.FLAT and coupon_obj.discount_amount:
        discount = coupon_obj.discount_amount
    else:
        discount = (discount_base_amount * coupon_obj.discount_percentage) / 100
    
    # Apply maximum discount limit
    if coupon_obj.max_discount_amount:
        discount = min(discount, coupon_obj.max_discount_amount)
    
    return {
        "valid": True,
        "discount_type": coupon_obj.discount_type.value,
        "discount_percentage": coupon_obj.discount_percentage if coupon_obj.discount_type == CouponType.PERCENTAGE else None,
        "discount_amount": round(discount, 2),
        "final_amount": round(coupon_apply.order_amount - discount, 2),
        "applicable_to": "specific_products" if coupon_obj.product_ids else "all_products",
        "eligible_product_ids": coupon_obj.product_ids if coupon_obj.product_ids else None
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

# ==================== ADVANCED OFFERS ROUTES ====================

@api_router.post("/offers", response_model=Offer)
async def create_offer(
    offer: OfferCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new offer (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        offer_obj = await offer_manager.create_offer(offer)
        return offer_obj
    except Exception as e:
        logger.error(f"Error creating offer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/offers", response_model=List[Offer])
async def get_offers(active_only: bool = False):
    """Get all offers"""
    try:
        offers = await offer_manager.get_all_offers(active_only=active_only)
        return offers
    except Exception as e:
        logger.error(f"Error fetching offers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/offers/active")
async def get_active_offers_for_product(
    product_id: Optional[str] = None,
    category: Optional[str] = None
):
    """Get active offers for a specific product or category"""
    try:
        offers = await offer_manager.get_active_offers(
            product_id=product_id, 
            category=category
        )
        return serialize_mongo_document([offer.dict() for offer in offers])
    except Exception as e:
        logger.error(f"Error fetching active offers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/offers/{offer_id}", response_model=Offer)
async def get_offer(offer_id: str):
    """Get offer by ID"""
    offer = await offer_manager.get_offer_by_id(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer

@api_router.put("/offers/{offer_id}", response_model=Offer)
async def update_offer(
    offer_id: str,
    offer_update: OfferUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update an offer (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        updated_offer = await offer_manager.update_offer(offer_id, offer_update)
        return updated_offer
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating offer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/offers/{offer_id}")
async def delete_offer(
    offer_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete an offer (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        success = await offer_manager.delete_offer(offer_id)
        if not success:
            raise HTTPException(status_code=404, detail="Offer not found")
        return {"message": "Offer deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting offer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/offers/apply-to-cart")
async def apply_offers_to_cart(
    cart_data: dict,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Apply all eligible offers to cart items"""
    current_user = await get_current_user(credentials, db)
    
    try:
        result = await offer_manager.apply_offers_to_cart(
            cart_items=cart_data.get("items", []),
            user_id=current_user["id"]
        )
        return result
    except Exception as e:
        logger.error(f"Error applying offers to cart: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

@api_router.put("/banners/{banner_id}/toggle")
async def toggle_banner(
    banner_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Toggle banner active status (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    banner = await db.banners.find_one({"id": banner_id})
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    new_status = not banner.get("is_active", True)
    
    result = await db.banners.update_one(
        {"id": banner_id},
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": f"Banner {'activated' if new_status else 'deactivated'}", "is_active": new_status}

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

# ==================== DELIVERY ROUTES ====================

class DeliveryCalculateRequest(BaseModel):
    pincode: str
    address: Optional[str] = None
    order_amount: float
    delivery_type: str = "delivery"

@api_router.post("/delivery/calculate")
async def calculate_delivery(delivery_req: DeliveryCalculateRequest):
    """Calculate delivery charge based on address/pincode and order amount"""
    try:
        # Geocode the address
        coords = await geocode_address(pincode=delivery_req.pincode, address=delivery_req.address)
        
        if not coords:
            raise HTTPException(
                status_code=400,
                detail="Unable to geocode address. Please check pincode and try again."
            )
        
        customer_lat, customer_lon = coords
        
        # Calculate delivery charge
        delivery_info = calculate_delivery_charge(
            customer_lat=customer_lat,
            customer_lon=customer_lon,
            order_amount=delivery_req.order_amount,
            delivery_type=delivery_req.delivery_type
        )
        
        # Add coordinates to response
        delivery_info["customer_lat"] = customer_lat
        delivery_info["customer_lon"] = customer_lon
        delivery_info["pincode"] = delivery_req.pincode
        
        return delivery_info
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Delivery calculation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error calculating delivery charge. Please try again."
        )

# ==================== ORDER ROUTES ====================

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    """Create a new order with delivery calculation and status history"""
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
    
    # Calculate delivery charge if coordinates provided
    if order.customer_lat and order.customer_lon:
        delivery_info = calculate_delivery_charge(
            customer_lat=order.customer_lat,
            customer_lon=order.customer_lon,
            order_amount=order.total_amount,
            delivery_type=order.delivery_type
        )
        order_obj.delivery_charge = delivery_info['delivery_charge']
        order_obj.delivery_distance_km = delivery_info['distance_km']
        # Recalculate final amount with delivery
        order_obj.final_amount = order.total_amount - order.discount_amount + delivery_info['delivery_charge']
    
    # Generate WhatsApp link
    order_obj.whatsapp_link = generate_whatsapp_link(order_obj)
    
    # Set payment status
    if order.payment_method == "cod":
        order_obj.payment_status = PaymentStatus.PENDING
    
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
    
    logger.info(f"Order created: {order_obj.id} for user {order.user_id}")
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

# ==================== PHASE 1 FIX: Payment Status Update ====================

class OrderPaymentUpdate(BaseModel):
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None

@api_router.put("/orders/{order_id}/update-payment")
async def update_order_payment(
    order_id: str,
    update_data: OrderPaymentUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update order payment method and/or status (Admin only) - FIXED"""
    await get_current_admin_user(credentials, db)
    
    # Get current order
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if update_data.payment_method:
        update_fields["payment_method"] = update_data.payment_method
    
    if update_data.payment_status:
        # Validate payment status
        valid_statuses = ["pending", "completed", "failed", "refunded"]
        if update_data.payment_status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid payment status. Must be one of: {valid_statuses}")
        update_fields["payment_status"] = update_data.payment_status
    
    # Update order
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": update_fields}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    logger.info(f"Order {order_id} payment updated: method={update_data.payment_method}, status={update_data.payment_status}")
    return {
        "message": "Order payment updated successfully",
        "success": True,
        "payment_method": update_data.payment_method,
        "payment_status": update_data.payment_status
    }

# ==================== RAZORPAY ROUTES ====================

@api_router.post("/razorpay/create-order")
async def create_razorpay_order_api(order_data: RazorpayOrderCreate):
    """Create Razorpay order for payment"""
    try:
        # Create Razorpay order using utility function
        razorpay_order = create_razorpay_order(
            amount=order_data.amount,
            receipt=f"order_{int(order_data.amount)}"
        )
        
        return {
            "razorpay_order_id": razorpay_order['id'],
            "amount": razorpay_order['amount'],
            "currency": razorpay_order['currency'],
            "key_id": os.environ.get('RAZORPAY_KEY_ID')
        }
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {str(e)}")
        # Fallback to mock for test mode
        razorpay_order_id = f"order_test_{uuid.uuid4().hex[:10]}"
        return {
            "razorpay_order_id": razorpay_order_id,
            "amount": int(order_data.amount * 100),
            "currency": "INR",
            "key_id": os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_1234567890')
        }

@api_router.post("/razorpay/verify-payment")
async def verify_razorpay_payment_api(payment_data: RazorpayPaymentVerify):
    """Verify Razorpay payment signature"""
    try:
        # Verify signature
        is_valid = verify_razorpay_signature(
            razorpay_order_id=payment_data.razorpay_order_id,
            razorpay_payment_id=payment_data.razorpay_payment_id,
            razorpay_signature=payment_data.razorpay_signature
        )
        
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Get order and update status history
        order = await db.orders.find_one({"id": payment_data.order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        status_history = order.get("status_history", [])
        status_history.append({
            "status": OrderStatus.CONFIRMED.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": "Payment completed via Razorpay"
        })
        
        # Update order with payment details
        result = await db.orders.update_one(
            {"id": payment_data.order_id},
            {"$set": {
                "razorpay_order_id": payment_data.razorpay_order_id,
                "razorpay_payment_id": payment_data.razorpay_payment_id,
                "razorpay_signature": payment_data.razorpay_signature,
                "payment_status": PaymentStatus.COMPLETED.value,
                "status": OrderStatus.CONFIRMED.value,
                "status_history": status_history,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Payment verified for order {payment_data.order_id}")
        return {"success": True, "message": "Payment verified successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment verification failed: {str(e)}")
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

# ==================== PHASE 1 FIX: REVIEW ROUTES ====================

@api_router.post("/reviews", response_model=Review)
async def create_review(
    review: ReviewCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a review (requires authentication) - User must be logged in"""
    current_user = await get_current_user(credentials, db)
    
    # Verify product exists
    product = await db.products.find_one({"id": review.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create review object with user info
    review_dict = review.dict()
    review_dict["user_id"] = current_user["id"]
    review_dict["user_name"] = current_user["name"]
    review_obj = Review(**review_dict)
    
    # Insert review
    await db.reviews.insert_one(prepare_for_mongo(review_obj.dict()))
    
    logger.info(f"Review created for product {review.product_id} by user {current_user['id']}")
    return review_obj

@api_router.get("/reviews/{product_id}", response_model=List[Review])
async def get_product_reviews(product_id: str, include_pending: bool = False):
    """Get reviews for a product - FIXED: Only approved reviews visible to users"""
    filter_query = {"product_id": product_id}
    
    # Only show approved reviews to regular users (include_pending used by admin)
    if not include_pending:
        filter_query["is_approved"] = True
    
    reviews = await db.reviews.find(filter_query).sort("created_at", -1).to_list(length=None)
    
    logger.info(f"Fetching reviews for product {product_id}, found {len(reviews)} approved reviews")
    return [Review(**parse_from_mongo(review)) for review in reviews]

@api_router.get("/reviews", response_model=List[Review])
async def get_all_reviews(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get all reviews (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    reviews = await db.reviews.find().sort("created_at", -1).to_list(length=None)
    return [Review(**parse_from_mongo(review)) for review in reviews]

@api_router.get("/reviews/pending/all", response_model=List[Review])
async def get_pending_reviews(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get pending reviews for approval (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    reviews = await db.reviews.find({"is_approved": False}).sort("created_at", -1).to_list(length=None)
    return [Review(**parse_from_mongo(review)) for review in reviews]

@api_router.put("/reviews/{review_id}/approve")
async def approve_review(
    review_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Approve a review (Admin only) - FIXED: Ensures review is marked as approved"""
    await get_current_admin_user(credentials, db)
    
    # Check if review exists
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Update review to approved
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$set": {
            "is_approved": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Update product review count and rating
    product_id = review["product_id"]
    all_approved_reviews = await db.reviews.find({
        "product_id": product_id,
        "is_approved": True
    }).to_list(length=None)
    
    if all_approved_reviews:
        avg_rating = sum(r["rating"] for r in all_approved_reviews) / len(all_approved_reviews)
        await db.products.update_one(
            {"id": product_id},
            {"$set": {
                "rating": round(avg_rating, 1),
                "review_count": len(all_approved_reviews)
            }}
        )
    
    logger.info(f"Review {review_id} approved successfully for product {product_id}")
    return {"message": "Review approved successfully", "success": True}

@api_router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete a review (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Update product review count
    product_id = review["product_id"]
    all_approved_reviews = await db.reviews.find({
        "product_id": product_id,
        "is_approved": True
    }).to_list(length=None)
    
    if all_approved_reviews:
        avg_rating = sum(r["rating"] for r in all_approved_reviews) / len(all_approved_reviews)
        await db.products.update_one(
            {"id": product_id},
            {"$set": {
                "rating": round(avg_rating, 1),
                "review_count": len(all_approved_reviews)
            }}
        )
    else:
        await db.products.update_one(
            {"id": product_id},
            {"$set": {
                "rating": 4.5,
                "review_count": 0
            }}
        )
    
    return {"message": "Review deleted successfully"}

@api_router.put("/reviews/{review_id}")
async def update_review(
    review_id: str,
    review_data: dict,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update a review (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    update_data = {k: v for k, v in review_data.items() if k in ['comment', 'rating', 'is_approved']}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.reviews.update_one(
        {"id": review_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    
    return {"message": "Review updated successfully"}

# ==================== WISHLIST ROUTES ====================

@api_router.post("/wishlist/add/{product_id}")
async def add_to_wishlist(
    product_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Add product to wishlist"""
    current_user = await get_current_user(credentials, db)
    
    # Verify product exists
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Add to wishlist
    result = await db.users.update_one(
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
    
    result = await db.users.update_one(
        {"id": current_user["id"]},
        {"$pull": {"wishlist": product_id}}
    )
    
    return {"message": "Product removed from wishlist"}

@api_router.get("/wishlist", response_model=List[Product])
async def get_wishlist(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get user's wishlist products"""
    current_user = await get_current_user(credentials, db)
    
    wishlist = current_user.get("wishlist", [])
    if not wishlist:
        return []
    
    products = await db.products.find({"id": {"$in": wishlist}}).to_list(length=None)
    return [Product(**parse_from_mongo(product)) for product in products]

# ==================== BULK ORDER ROUTES ====================

@api_router.post("/bulk-orders", response_model=BulkOrder)
async def create_bulk_order(bulk_order: BulkOrderCreate):
    """Create a bulk order request"""
    bulk_order_dict = bulk_order.dict()
    bulk_order_obj = BulkOrder(**bulk_order_dict)
    await db.bulk_orders.insert_one(prepare_for_mongo(bulk_order_obj.dict()))
    logger.info(f"Bulk order created: {bulk_order_obj.id}")
    return bulk_order_obj

@api_router.get("/bulk-orders", response_model=List[BulkOrder])
async def get_bulk_orders(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get all bulk orders (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    bulk_orders = await db.bulk_orders.find().sort("created_at", -1).to_list(length=None)
    return [BulkOrder(**parse_from_mongo(order)) for order in bulk_orders]

@api_router.get("/bulk-orders/{order_id}", response_model=BulkOrder)
async def get_bulk_order(order_id: str):
    """Get bulk order by ID"""
    bulk_order = await db.bulk_orders.find_one({"id": order_id})
    if not bulk_order:
        raise HTTPException(status_code=404, detail="Bulk order not found")
    return BulkOrder(**parse_from_mongo(bulk_order))

@api_router.put("/bulk-orders/{order_id}", response_model=BulkOrder)
async def update_bulk_order(
    order_id: str,
    update_data: BulkOrderUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update bulk order (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.bulk_orders.update_one(
        {"id": order_id},
        {"$set": prepare_for_mongo(update_dict)}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bulk order not found")
    
    updated_order = await db.bulk_orders.find_one({"id": order_id})
    return BulkOrder(**parse_from_mongo(updated_order))

# ==================== MEDIA GALLERY ROUTES ====================

@api_router.post("/media", response_model=MediaItem)
async def create_media_item(
    media: MediaItemCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a media item (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    media_obj = MediaItem(**media.dict())
    await db.media.insert_one(prepare_for_mongo(media_obj.dict()))
    return media_obj

@api_router.get("/media", response_model=List[MediaItem])
async def get_media_items(active_only: bool = True):
    """Get all media items"""
    filter_query = {}
    if active_only:
        filter_query["is_active"] = True
    
    media_items = await db.media.find(filter_query).sort("display_order", 1).to_list(length=None)
    return [MediaItem(**parse_from_mongo(item)) for item in media_items]

@api_router.put("/media/{media_id}", response_model=MediaItem)
async def update_media_item(
    media_id: str,
    media_update: MediaItemCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update a media item (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    media_dict = media_update.dict()
    media_dict["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.media.update_one(
        {"id": media_id},
        {"$set": prepare_for_mongo(media_dict)}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Media item not found")
    
    updated_media = await db.media.find_one({"id": media_id})
    return MediaItem(**parse_from_mongo(updated_media))

@api_router.delete("/media/{media_id}")
async def delete_media_item(
    media_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete a media item (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    result = await db.media.delete_one({"id": media_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Media item not found")
    return {"message": "Media item deleted successfully"}

# ==================== CHATBOT ROUTES ====================

@api_router.post("/chatbot")
async def chat_with_bot(chat_request: ChatRequest):
    """Chat with Gemini AI bot"""
    if not genai:
        raise HTTPException(
            status_code=503,
            detail="Chatbot service unavailable. Google Generative AI not installed."
        )
    
    try:
        # Configure Gemini API
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if not gemini_api_key:
            raise HTTPException(
                status_code=503,
                detail="Chatbot service not configured. Missing GEMINI_API_KEY."
            )
        
        genai.configure(api_key=gemini_api_key)
        
        # Create model
        model = genai.GenerativeModel('gemini-pro')
        
        # Generate response
        prompt = f"""You are a helpful customer service assistant for Mithaas Delights, 
        a premium Indian sweets and snacks shop. Answer questions about:
        - Product information (sweets, namkeen, traditional Indian sweets)
        - Order placement and delivery
        - Store location and hours
        - Ingredients and allergens
        
        User question: {chat_request.message}"""
        
        response = model.generate_content(prompt)
        
        # Store chat message
        chat_message = ChatMessage(
            session_id=chat_request.session_id,
            message=chat_request.message,
            response=response.text
        )
        await db.chat_messages.insert_one(prepare_for_mongo(chat_message.dict()))
        
        return {
            "response": response.text,
            "session_id": chat_request.session_id
        }
    
    except Exception as e:
        logger.error(f"Chatbot error: {str(e)}")
        return {
            "response": "I apologize, but I'm having trouble processing your request right now. Please try again later or contact our support team.",
            "session_id": chat_request.session_id,
            "error": str(e)
        }

# ==================== NOTIFICATION ROUTES ====================

@api_router.post("/notifications", response_model=dict)
async def create_notification(
    notification_data: NotificationCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new notification (Admin only)"""
    admin_user = await get_current_admin_user(credentials, db)
    
    try:
        notification = await notification_manager.create_notification(
            notification_data, 
            admin_user["id"]
        )
        
        # Auto-broadcast if it's not user-specific
        if notification.target_audience in ["all", "users"]:
            broadcast_result = await notification_manager.broadcast_notification(notification.id)
            return {
                "message": "Notification created and broadcasted successfully",
                "notification_id": notification.id,
                "broadcast_result": broadcast_result
            }
        else:
            return {
                "message": "Notification created successfully",
                "notification_id": notification.id
            }
    except Exception as e:
        logger.error(f"Error creating notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/notifications/my-notifications")
async def get_user_notifications(
    limit: int = 50,
    unread_only: bool = False,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Get notifications for current user"""
    current_user = await get_current_user(credentials, db)
    
    try:
        notifications = await notification_manager.get_user_notifications(
            current_user["id"], 
            unread_only=unread_only,
            limit=limit
        )
        return notifications
    except Exception as e:
        logger.error(f"Error fetching user notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/notifications/{notification_id}/mark-read")
async def mark_notification_read(
    notification_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Mark notification as read"""
    current_user = await get_current_user(credentials, db)
    
    try:
        success = await notification_manager.mark_notification_read(
            notification_id, 
            current_user["id"]
        )
        if success:
            return {"message": "Notification marked as read"}
        else:
            raise HTTPException(status_code=404, detail="Notification not found")
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/notifications/mark-all-read")
async def mark_all_notifications_read(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Mark all notifications as read for current user"""
    current_user = await get_current_user(credentials, db)
    
    try:
        # Get all unread notifications for user
        notifications = await notification_manager.get_user_notifications(
            current_user["id"], 
            unread_only=True
        )
        
        # Mark each as read
        for notification in notifications:
            await notification_manager.mark_notification_read(
                notification["id"], 
                current_user["id"]
            )
        
        return {"message": f"Marked {len(notifications)} notifications as read"}
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Dismiss/delete notification for current user"""
    current_user = await get_current_user(credentials, db)
    
    try:
        success = await notification_manager.dismiss_notification(
            notification_id, 
            current_user["id"]
        )
        if success:
            return {"message": "Notification dismissed"}
        else:
            raise HTTPException(status_code=404, detail="Notification not found")
    except Exception as e:
        logger.error(f"Error dismissing notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/notifications/unread-count")
async def get_unread_notifications_count(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Get count of unread notifications"""
    current_user = await get_current_user(credentials, db)
    
    try:
        count = await notification_manager.get_unread_count(current_user["id"])
        return {"unread_count": count}
    except Exception as e:
        logger.error(f"Error getting unread count: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/notifications/admin/all")
async def get_all_notifications_admin(
    limit: int = 100,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Get all notifications for admin panel"""
    await get_current_admin_user(credentials, db)
    
    try:
        # Get all notifications from database
        notifications_cursor = db.notifications.find().sort("created_at", -1).limit(limit)
        notifications = []
        
        async for notification in notifications_cursor:
            # First serialize MongoDB ObjectId fields
            notification = serialize_mongo_document(notification)
            # Then parse datetime strings
            notification_dict = notification_manager._parse_from_mongo(notification)
            notifications.append(notification_dict)
        
        return notifications
    except Exception as e:
        logger.error(f"Error getting all notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/notifications/admin/{notification_id}")
async def delete_notification_admin(
    notification_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete notification permanently (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        # Delete from database
        result = await db.notifications.delete_one({"id": notification_id})
        
        if result.deleted_count > 0:
            return {"message": "Notification deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Notification not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== THEME ROUTES ====================

@api_router.get("/themes/active")
async def get_active_theme():
    """Get currently active theme"""
    try:
        theme = await theme_manager.get_active_theme()
        return theme
    except Exception as e:
        logger.error(f"Error getting active theme: {str(e)}")
        # Return default theme if error
        return DEFAULT_THEMES["orange_default"]

@api_router.get("/themes")
async def get_all_themes():
    """Get all available themes"""
    try:
        themes = await theme_manager.get_all_themes()
        return themes
    except Exception as e:
        logger.error(f"Error getting themes: {str(e)}")
        # Return default themes if error
        return list(DEFAULT_THEMES.values())

@api_router.post("/themes", response_model=ThemeConfig)
async def create_theme(
    theme_data: ThemeCreateUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new custom theme (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        theme = await theme_manager.create_theme(theme_data)
        return theme
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating theme: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/themes/{theme_id}", response_model=ThemeConfig)
async def update_theme(
    theme_id: str,
    theme_data: ThemeCreateUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update a theme (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        theme = await theme_manager.update_theme(theme_id, theme_data)
        return theme
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating theme: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/themes/{theme_id}/activate")
async def activate_theme(
    theme_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Activate a theme (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        success = await theme_manager.activate_theme(theme_id)
        if success:
            return {"message": "Theme activated successfully"}
        else:
            raise HTTPException(status_code=404, detail="Theme not found")
    except Exception as e:
        logger.error(f"Error activating theme: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/themes/{theme_id}")
async def delete_theme(
    theme_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete a custom theme (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        success = await theme_manager.delete_theme(theme_id)
        if success:
            return {"message": "Theme deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Theme not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting theme: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/themes/{theme_id}/css")
async def get_theme_css(theme_id: str):
    """Get CSS for a specific theme"""
    try:
        # Get theme from database
        theme_data = await db.themes.find_one({"id": theme_id})
        if not theme_data:
            raise HTTPException(status_code=404, detail="Theme not found")
        
        theme = ThemeConfig(**theme_manager._parse_from_mongo(theme_data))
        css = theme_manager.generate_css_variables(theme)
        
        return {"css": css}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating theme CSS: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/themes/initialize-defaults")
async def initialize_default_themes(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Initialize default themes (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        success = await theme_manager.initialize_default_themes()
        if success:
            return {"message": "Default themes initialized successfully"}
        else:
            return {"message": "Failed to initialize default themes"}
    except Exception as e:
        logger.error(f"Error initializing default themes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== USER THEME PREFERENCES ====================

@api_router.get("/user/theme-preference")
async def get_user_theme_preference(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Get current user's theme preference (dark/light mode)"""
    current_user = await get_current_user(credentials, db)
    
    # Get user preference from database
    user_data = await db.users.find_one({"id": current_user["id"]})
    theme_mode = user_data.get("theme_mode", "light")  # default to light
    
    return {
        "theme_mode": theme_mode,
        "available_modes": ["light", "dark"]
    }

@api_router.put("/user/theme-preference")
async def update_user_theme_preference(
    preference: dict,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update current user's theme preference (dark/light mode)"""
    current_user = await get_current_user(credentials, db)
    
    theme_mode = preference.get("theme_mode", "light")
    if theme_mode not in ["light", "dark"]:
        raise HTTPException(status_code=400, detail="Invalid theme mode. Must be 'light' or 'dark'")
    
    # Update user preference
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"theme_mode": theme_mode}}
    )
    
    return {
        "message": "Theme preference updated successfully",
        "theme_mode": theme_mode
    }

# ==================== UTILITY ROUTES ====================

@api_router.post("/init-sample-data")
async def init_sample_data():
    """Initialize sample products for testing"""
    # Check if products already exist
    existing_count = await db.products.count_documents({})
    if existing_count > 0:
        return {"message": "Sample data already exists", "count": existing_count}
    
    sample_products = [
        {
            "name": "Kaju Katli",
            "description": "Premium cashew fudge made with finest cashews and pure ghee",
            "category": "mithai",
            "image_url": "https://via.placeholder.com/400x300/ff9800/ffffff?text=Kaju+Katli",
            "variants": [
                {"weight": "250g", "price": 450, "is_available": True},
                {"weight": "500g", "price": 850, "is_available": True},
                {"weight": "1kg", "price": 1600, "is_available": True}
            ],
            "is_featured": True,
            "rating": 4.8,
            "review_count": 124
        },
        {
            "name": "Motichoor Laddu",
            "description": "Traditional round sweet balls made with gram flour and sugar",
            "category": "laddu",
            "image_url": "https://via.placeholder.com/400x300/ff6f00/ffffff?text=Motichoor+Laddu",
            "variants": [
                {"weight": "250g", "price": 180, "is_available": True},
                {"weight": "500g", "price": 340, "is_available": True},
                {"weight": "1kg", "price": 650, "is_available": True}
            ],
            "is_featured": True,
            "rating": 4.6,
            "review_count": 89
        }
    ]
    
    for prod_data in sample_products:
        product = Product(**prod_data)
        await db.products.insert_one(prepare_for_mongo(product.dict()))
    
    return {"message": f"Created {len(sample_products)} sample products"}

@api_router.post("/init-admin")
async def init_admin():
    """Initialize default admin user"""
    admin_email = "admin@mithaasdelights.com"
    
    # Check if admin exists
    existing_admin = await db.users.find_one({"email": admin_email})
    if existing_admin:
        return {"message": "Admin user already exists"}
    
    # Create admin user
    admin_data = {
        "id": str(uuid.uuid4()),
        "name": "Admin",
        "email": admin_email,
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
        "email": admin_email,
        "password": "admin123"
    }
# ==================== ADVERTISEMENT ROUTES ====================
# Import advertisement manager
from advertisement_system import AdvertisementManager, AdvertisementCreate, AdvertisementUpdate

# Initialize Advertisement Manager
advertisement_manager = AdvertisementManager(db)

@api_router.get("/advertisements")
async def get_advertisements(
    active_only: bool = True,
    placement: Optional[str] = None
):
    """Get advertisements"""
    try:
        ads = await advertisement_manager.get_advertisements(
            placement=placement,
            active_only=active_only
        )
        # Serialize before returning
        return [serialize_mongo_document(ad.dict()) for ad in ads]
    except Exception as e:
        logger.error(f"Error fetching advertisements: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/advertisements")
async def create_advertisement(
    ad_data: AdvertisementCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create advertisement (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        ad = await advertisement_manager.create_advertisement(ad_data)
        return serialize_mongo_document(ad.dict())
    except Exception as e:
        logger.error(f"Error creating advertisement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/advertisements/{ad_id}")
async def update_advertisement(
    ad_id: str,
    ad_data: AdvertisementUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update advertisement (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        ad = await advertisement_manager.update_advertisement(ad_id, ad_data)
        return serialize_mongo_document(ad.dict())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating advertisement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/advertisements/{ad_id}")
async def delete_advertisement(
    ad_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete advertisement (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        success = await advertisement_manager.delete_advertisement(ad_id)
        if success:
            return {"message": "Advertisement deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Advertisement not found")
    except Exception as e:
        logger.error(f"Error deleting advertisement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/advertisements/{ad_id}/impression")
async def record_ad_impression(ad_id: str):
    """Record advertisement impression"""
    try:
        await advertisement_manager.record_impression(ad_id)
        return {"message": "Impression recorded"}
    except Exception as e:
        logger.error(f"Error recording impression: {str(e)}")
        return {"message": "Failed to record impression"}

@api_router.post("/advertisements/{ad_id}/click")
async def record_ad_click(ad_id: str):
    """Record advertisement click"""
    try:
        await advertisement_manager.record_click(ad_id)
        return {"message": "Click recorded"}
    except Exception as e:
        logger.error(f"Error recording click: {str(e)}")
        return {"message": "Failed to record click"}

# ==================== NOTIFICATION BROADCAST ROUTE ====================

@api_router.post("/notifications/{notification_id}/broadcast")
async def broadcast_notification(
    notification_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Broadcast notification to target audience (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        result = await notification_manager.broadcast_notification(notification_id)
        return {
            "message": "Notification broadcasted successfully",
            "result": result
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error broadcasting notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Mount the API router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)