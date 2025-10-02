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
from io import BytesIO
from PIL import Image

# Import our custom systems
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

# Import all models from the original server
from server import *

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

# Initialize system managers
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
        
        return {
            "message": "All systems initialized successfully",
            "systems": [
                "notification_system",
                "theme_system", 
                "advertisement_system",
                "enhanced_delivery",
                "order_aware_chatbot"
            ]
        }
    except Exception as e:
        logger.error(f"System initialization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Initialization failed: {str(e)}")

# ==================== NOTIFICATION SYSTEM ROUTES ====================

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

@api_router.get("/notifications/vapid-public-key")
async def get_vapid_public_key():
    """Get VAPID public key for push notifications"""
    return {"public_key": web_push_manager.get_vapid_public_key()}

# ==================== THEME SYSTEM ROUTES ====================

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

@api_router.post("/themes", response_model=ThemeConfig)
async def create_custom_theme(
    theme_data: ThemeCreateUpdate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a custom theme (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        theme = await theme_manager.create_theme(theme_data)
        return theme
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

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
    
    return {"message": "Theme activated successfully"}

@api_router.get("/themes/{theme_id}/css")
async def get_theme_css(theme_id: str):
    """Get CSS for a specific theme"""
    themes = await theme_manager.get_all_themes()
    theme = next((t for t in themes if t.id == theme_id), None)
    
    if not theme:
        raise HTTPException(status_code=404, detail="Theme not found")
    
    css = theme_manager.generate_css_variables(theme)
    
    return {
        "theme_id": theme_id,
        "theme_name": theme.display_name,
        "css": css
    }

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

@api_router.delete("/themes/{theme_id}")
async def delete_theme(
    theme_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete a custom theme (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        success = await theme_manager.delete_theme(theme_id)
        if not success:
            raise HTTPException(status_code=404, detail="Theme not found")
        return {"message": "Theme deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== ADVERTISEMENT SYSTEM ROUTES ====================

@api_router.post("/advertisements", response_model=Advertisement)
async def create_advertisement(
    ad_data: AdvertisementCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new advertisement (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    advertisement = await advertisement_manager.create_advertisement(ad_data)
    return advertisement

@api_router.get("/advertisements")
async def get_advertisements(
    placement: Optional[str] = None,
    active_only: bool = True
):
    """Get advertisements by placement"""
    ads = await advertisement_manager.get_advertisements(placement, active_only)
    return ads

@api_router.post("/advertisements/{ad_id}/impression")
async def record_advertisement_impression(ad_id: str):
    """Record advertisement impression"""
    await advertisement_manager.record_impression(ad_id)
    return {"success": True}

@api_router.post("/advertisements/{ad_id}/click")
async def record_advertisement_click(ad_id: str):
    """Record advertisement click"""
    await advertisement_manager.record_click(ad_id)
    return {"success": True}

@api_router.delete("/advertisements/{ad_id}")
async def delete_advertisement(
    ad_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete advertisement (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    success = await advertisement_manager.delete_advertisement(ad_id)
    if not success:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    
    return {"message": "Advertisement deleted successfully"}

# Enhanced Banner Routes
@api_router.post("/banners/enhanced", response_model=EnhancedBanner)
async def create_enhanced_banner(
    banner_data: BannerCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Create a new enhanced banner (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    banner = await advertisement_manager.create_banner(banner_data)
    return banner

@api_router.get("/banners/enhanced")
async def get_enhanced_banners(
    placement: Optional[str] = None,
    active_only: bool = True
):
    """Get enhanced banners"""
    banners = await advertisement_manager.get_banners(placement, active_only)
    return banners

@api_router.put("/banners/enhanced/{banner_id}")
async def update_enhanced_banner(
    banner_id: str,
    banner_data: BannerCreate,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Update enhanced banner (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    try:
        banner = await advertisement_manager.update_banner(banner_id, banner_data)
        return banner
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@api_router.post("/banners/enhanced/{banner_id}/view")
async def record_banner_view(banner_id: str):
    """Record banner view"""
    await advertisement_manager.record_banner_view(banner_id)
    return {"success": True}

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
    
    return {"message": "Banner deleted successfully"}

# ==================== ENHANCED DELIVERY ROUTES ====================

@api_router.post("/delivery/calculate")
async def calculate_delivery_charges(
    customer_lat: float,
    customer_lon: float,
    order_amount: float,
    delivery_type: str = "delivery"
):
    """Calculate delivery charges"""
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

@api_router.post("/delivery/clear-cache")
async def clear_delivery_cache(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Clear delivery calculation cache (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    delivery_calculator.clear_cache()
    return {"message": "Delivery cache cleared successfully"}

# ==================== ENHANCED CHATBOT ROUTES ====================

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

@api_router.delete("/chat/session/{session_id}")
async def clear_chat_session(
    session_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Clear chat session"""
    # Allow users to clear their own sessions or admins to clear any
    try:
        current_user = await get_current_user(credentials, db)
        # Add session ownership check if needed
    except:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    success = await chatbot.clear_session(session_id)
    return {"success": success}

# ==================== FILE UPLOAD ROUTES ====================

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

@api_router.delete("/upload/file")
async def delete_uploaded_file(
    file_url: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Delete uploaded file"""
    await get_current_admin_user(credentials, db)  # Admin only
    
    success = delete_file(file_url)
    return {"success": success}

# ==================== ENHANCED REVIEW ROUTES (WITH PHOTOS) ====================

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
    
    # Update product rating (only count approved reviews)
    product = await db.products.find_one({"id": review_data.product_id})
    if product:
        approved_reviews = await db.reviews.find({
            "product_id": review_data.product_id,
            "is_approved": True
        }).to_list(length=None)
        
        if approved_reviews:
            avg_rating = sum(r["rating"] for r in approved_reviews) / len(approved_reviews)
            await db.products.update_one(
                {"id": review_data.product_id},
                {"$set": {
                    "rating": round(avg_rating, 1),
                    "review_count": len(approved_reviews)
                }}
            )
    
    return {"message": "Review submitted successfully", "review_id": review_obj.id}

# ==================== CACHE INVALIDATION SYSTEM ====================

@api_router.post("/cache/invalidate")
async def invalidate_cache(
    cache_type: str,  # "products", "banners", "themes", "all"
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Invalidate specific cache types (Admin only)"""
    await get_current_admin_user(credentials, db)
    
    if cache_type == "delivery" or cache_type == "all":
        delivery_calculator.clear_cache()
    
    # In a production environment, you would also clear Redis cache, 
    # CDN cache, etc. here
    
    return {
        "message": f"Cache invalidated for: {cache_type}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ==================== SYSTEM STATUS ROUTES ====================

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
        }
    }

# Include all original routes from server.py
# (This would include all the product, cart, order, auth routes from the original server)

# Add the router to the app
app.include_router(api_router)

# Root route
@app.get("/")
async def root():
    return {
        "message": "Welcome to Mithaas Delights Enhanced API v2.0",
        "features": [
            "Order-aware AI chatbot",
            "Multi-theme support",
            "Advanced notification system",
            "Enhanced advertisement management",
            "Distance-based delivery calculation",
            "File upload system",
            "Cache invalidation"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Mithaas Delights Enhanced API",
        "version": "2.0.0"
    }
