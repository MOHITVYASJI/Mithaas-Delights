from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum
import google.generativeai as genai

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

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    addresses: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None

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
async def create_product(product: ProductCreate):
    product_dict = product.dict()
    product_obj = Product(**product_dict)
    await db.products.insert_one(prepare_for_mongo(product_obj.dict()))
    return product_obj

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductCreate):
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
async def delete_product(product_id: str):
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
async def get_orders():
    orders = await db.orders.find().to_list(length=None)
    return [Order(**parse_from_mongo(order)) for order in orders]

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: OrderStatus):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated successfully"}

# User Routes
@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    user_dict = user.dict()
    user_obj = User(**user_dict)
    await db.users.insert_one(prepare_for_mongo(user_obj.dict()))
    return user_obj

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**parse_from_mongo(user))

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
        model = genai.GenerativeModel("gemini-1.5-flash")
       
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
            "image_url": "https://images.unsplash.com/photo-1606471191009-63b7dcf9e22f?w=400&h=400&fit=crop",
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
            "image_url": "https://images.unsplash.com/photo-1571119743851-7c6eb63b5da6?w=400&h=400&fit=crop",
            "weight": "500g",
            "ingredients": ["Milk Powder", "Sugar", "Ghee", "Rose Water"],
            "is_featured": True
        },
        {
            "name": "Besan Laddu",
            "description": "Traditional gram flour balls sweetened with jaggery and enriched with ghee",
            "price": 399,
            "category": "laddu",
            "image_url": "https://images.unsplash.com/photo-1599599810094-c06e16c3315f?w=400&h=400&fit=crop",
            "weight": "400g",
            "ingredients": ["Gram Flour", "Jaggery", "Ghee", "Cashews", "Raisins"],
            "is_featured": True
        },
        {
            "name": "Masala Mixture",
            "description": "Crispy blend of lentils, nuts, and spices - perfect tea-time snack",
            "price": 199,
            "category": "namkeen",
            "image_url": "https://images.unsplash.com/photo-1599599795865-8aa1e33fa8a7?w=400&h=400&fit=crop",
            "weight": "300g",
            "ingredients": ["Lentils", "Peanuts", "Spices", "Vegetable Oil"]
        },
        {
            "name": "Rasgulla",
            "description": "Soft, spongy cottage cheese balls in light sugar syrup",
            "price": 249,
            "category": "bengali_sweets",
            "image_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
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
            "image_url": "https://images.unsplash.com/photo-1571119743851-7c6eb63b5da6?w=400&h=400&fit=crop",
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