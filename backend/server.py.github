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
from datetime import datetime, timezone
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

# Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    original_price: Optional[float] = None
    category: ProductCategory
    image_url: str
    weight: str  # e.g., "250g", "1kg"
    ingredients: List[str] = []
    is_available: bool = True
    is_featured: bool = False
    discount_percentage: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    original_price: Optional[float] = None
    category: ProductCategory
    image_url: str
    weight: str
    ingredients: List[str] = []
    is_available: bool = True
    is_featured: bool = False
    discount_percentage: Optional[int] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem]
    total_amount: float
    status: OrderStatus = OrderStatus.PENDING
    delivery_address: str
    phone_number: str
    email: str
    payment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    user_id: str
    items: List[CartItem]
    total_amount: float
    delivery_address: str
    phone_number: str
    email: str

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
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_name: str
    rating: int = Field(ge=1, le=5)
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    product_id: str
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
    return data

def parse_from_mongo(item):
    """Parse MongoDB document back to Python objects"""
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    return item

# Routes
@api_router.get("/")
async def root():
    return {"message": "Welcome to Mithaas Delights API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Mithaas Delights"}

# Product Routes
@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[ProductCategory] = None):
    filter_query = {}
    if category:
        filter_query["category"] = category
    
    products = await db.products.find(filter_query).to_list(length=None)
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

# Order Routes
@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    order_dict = order.dict()
    order_obj = Order(**order_dict)
    await db.orders.insert_one(prepare_for_mongo(order_obj.dict()))
    return order_obj

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**parse_from_mongo(order))

@api_router.get("/orders", response_model=List[Order])
async def get_orders(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get all orders (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    orders = await db.orders.find().to_list(length=None)
    return [Order(**parse_from_mongo(order)) for order in orders]

@api_router.get("/orders/user/my-orders", response_model=List[Order])
async def get_my_orders(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Get current user's orders"""
    current_user = await get_current_user(credentials, db)
    
    orders = await db.orders.find({"user_id": current_user["id"]}).to_list(length=None)
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

# Authentication Routes
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
        created_at=datetime.fromisoformat(user_dict["created_at"])
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user and return JWT token"""
    # Find user by email
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
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
        created_at=datetime.fromisoformat(updated_user["created_at"]) if isinstance(updated_user["created_at"], str) else updated_user["created_at"]
    )

# User Routes (Protected)
@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Get user by ID (protected route)"""
    current_user = await get_current_user(credentials, db)
    
    # Users can only see their own profile, admins can see any
    if current_user["id"] != user_id and current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this profile"
        )
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        phone=user.get("phone"),
        role=UserRole(user["role"]),
        addresses=user.get("addresses", []),
        wishlist=user.get("wishlist", []),
        created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
    )

# Review Routes
@api_router.post("/reviews", response_model=Review)
async def create_review(review: ReviewCreate):
    review_dict = review.dict()
    review_obj = Review(**review_dict)
    await db.reviews.insert_one(prepare_for_mongo(review_obj.dict()))
    return review_obj

@api_router.get("/reviews/{product_id}", response_model=List[Review])
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}).to_list(length=None)
    return [Review(**parse_from_mongo(review)) for review in reviews]

# Chatbot Routes
@api_router.post("/chat")
async def chat_with_bot(chat_request: ChatRequest):
    try:
        # Get Gemini API key from environment
        gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if not gemini_api_key:
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
        # Configure Gemini
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
       
        # Create system message for Mithaas Delights context
        system_message = """You are a helpful customer support assistant for Mithaas Delights, a premium Indian sweets and snacks online store. 

About Mithaas Delights:
- We sell authentic Indian sweets (mithai), savory snacks (namkeen), laddus, Bengali sweets, dry fruit sweets, and festival specials
- We offer premium quality products made with traditional recipes and finest ingredients
- We provide free delivery and accept both Cash on Delivery and online payments and advance
- Our Contact hours: Monday-Sunday 9:00 AM - 9:00 PM, Sunday 10:00 AM - 8:00 PM
- Contact: +91 8989549544, mithaasdelightsofficial@gmail.com
- Location: 64, Kaveri Nagar, Indore, Madhya Pradesh 452006, India

You should help customers with:
- Product information and recommendations
- Order placement guidance
- Delivery and payment information
- General FAQs about our products and services
- Order tracking assistance

Always be friendly, helpful, and promote our premium quality products. If you don't know specific product details, suggest the customer browse our catalog or contact our support team."""
        
        # # Initialize LLM chat with Gemini
        # chat = LlmChat(
        #     api_key=gemini_api_key,
        #     session_id=chat_request.session_id,
        #     system_message=system_message
        # ).with_model("gemini", "gemini-2.0-flash")
        
        # # Create user message
        # user_message = UserMessage(text=chat_request.message)
        
        # # Get response from Gemini
        # response = await chat.send_message(user_message)
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
            "I'm sorry, I'm having trouble connecting right now. Please try again in a moment or contact our support team at +91 98765 43210.",
            "Thank you for your interest in Mithaas Delights! I'm temporarily unavailable, but you can browse our products or call us at +91 98765 43210 for immediate assistance.",
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

# Admin initialization
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
        "hashed_password": get_password_hash("admin123"),  # Change this password!
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

# Initialize sample data
@api_router.post("/init-sample-data")
async def init_sample_data():
    # Sample products data
    sample_products = [
        {
            "name": "Kaju Katli",
            "description": "Premium cashew-based diamond-shaped sweet, rich and melt-in-mouth texture",
            "price": 599,
            "original_price": 699,
            "category": "mithai",
            "image_url": "https://recipes.net/wp-content/uploads/2022/07/kaju-katli.jpg",
            "weight": "250g",
            "ingredients": ["Cashews", "Sugar", "Ghee", "Silver Leaf"],
            "is_featured": True,
            "discount_percentage": 15
        },
        {
            "name": "Gulab Jamun",
            "description": "Soft, spongy milk-solid balls soaked in rose-flavored sugar syrup",
            "price": 299,
            "category": "mithai",
            "image_url": "https://tse3.mm.bing.net/th/id/OIP.B32bansRI7RS3yfbUSEBNwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
            "weight": "500g",
            "ingredients": ["Milk Powder", "Sugar", "Ghee", "Rose Water"],
            "is_featured": True
        },
        {
            "name": "Besan Laddu",
            "description": "Traditional gram flour balls sweetened with jaggery and enriched with ghee",
            "price": 399,
            "category": "laddu",
            "image_url": "https://th.bing.com/th/id/OIP.0ZB3XubESFclOtXe3qJYxwHaHa?w=179&h=180&c=7&r=0&o=7&pid=1.7&rm=3",
            "weight": "400g",
            "ingredients": ["Gram Flour", "Jaggery", "Ghee", "Cashews", "Raisins"],
            "is_featured": True
        },
        {
            "name": "Masala Mixture",
            "description": "Crispy blend of lentils, nuts, and spices - perfect tea-time snack",
            "price": 199,
            "category": "namkeen",
            "image_url": "https://th.bing.com/th/id/OIP.yPwaOp3hag9pVNe6rTkgfQHaHa?w=166&h=180&c=7&r=0&o=7&pid=1.7&rm=3",
            "weight": "300g",
            "ingredients": ["Lentils", "Peanuts", "Spices", "Vegetable Oil"]
        },
        {
            "name": "Rasgulla",
            "description": "Soft, spongy cottage cheese balls in light sugar syrup",
            "price": 249,
            "category": "bengali_sweets",
            "image_url": "https://th.bing.com/th/id/OIP.ibmTOU1t-Zl1LKlZUOAewgHaHa?w=225&h=180&c=7&r=0&o=7&pid=1.7&rm=3",
            "weight": "400g",
            "ingredients": ["Cottage Cheese", "Sugar", "Cardamom"],
            "is_featured": True
        },
        {
            "name": "Dry Fruit Barfi",
            "description": "Rich and nutritious sweet made with assorted dry fruits and khoya",
            "price": 799,
            "original_price": 899,
            "category": "dry_fruit_sweets",
            "image_url": "https://th.bing.com/th/id/OIP.gMb3Wu-UzCV_yv4u-yNenwAAAA?w=285&h=190&c=7&r=0&o=7&pid=1.7&rm=3",
            "weight": "300g",
            "ingredients": ["Almonds", "Cashews", "Pistachios", "Khoya", "Sugar"],
            "discount_percentage": 11
        }
    ]
    
    # Clear existing products and add sample data
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