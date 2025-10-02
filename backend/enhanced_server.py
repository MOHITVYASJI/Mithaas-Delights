"""
Enhanced Server Integration for Mithaas Delights API
This file integrates all the enhanced systems with the main server
"""

from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
import logging

# Import all the enhanced systems
from notification_system import setup_notification_routes
from advertisement_system import setup_advertisement_routes
from media_system import setup_media_routes
from review_system import setup_review_routes
from cart_sync_system import setup_cart_sync_routes
from banner_system import setup_banner_routes
from bulk_order_system import setup_bulk_order_routes

# Import auth utilities
from auth_utils import get_current_user, get_current_admin_user

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_enhanced_routes(app: FastAPI, db: AsyncIOMotorDatabase):
    """Setup all enhanced routes with the main FastAPI app"""
    
    try:
        # Setup notification system
        notification_router = setup_notification_routes(db, get_current_user, get_current_admin_user)
        app.include_router(notification_router)
        logger.info("✅ Notification system routes added")
        
        # Setup advertisement system
        advertisement_router = setup_advertisement_routes(db, get_current_admin_user)
        app.include_router(advertisement_router)
        logger.info("✅ Advertisement system routes added")
        
        # Setup media system
        media_router = setup_media_routes(db, get_current_admin_user)
        app.include_router(media_router)
        logger.info("✅ Media system routes added")
        
        # Setup review system
        review_router = setup_review_routes(db, get_current_user, get_current_admin_user)
        app.include_router(review_router)
        logger.info("✅ Review system routes added")
        
        # Setup cart sync system
        cart_router = setup_cart_sync_routes(db, get_current_user)
        app.include_router(cart_router)
        logger.info("✅ Cart sync system routes added")
        
        # Setup banner system
        banner_router = setup_banner_routes(db, get_current_admin_user)
        app.include_router(banner_router)
        logger.info("✅ Banner system routes added")
        
        # Setup bulk order system
        bulk_order_router = setup_bulk_order_routes(db, get_current_admin_user)
        app.include_router(bulk_order_router)
        logger.info("✅ Bulk order system routes added")
        
        logger.info("🚀 All enhanced systems successfully integrated!")
        
    except Exception as e:
        logger.error(f"❌ Error setting up enhanced routes: {str(e)}")
        raise

def create_enhanced_app():
    """Create a standalone enhanced app for testing"""
    
    # Create FastAPI app
    app = FastAPI(
        title="Mithaas Delights Enhanced API",
        version="2.0.0",
        description="Enhanced API with notifications, advertisements, media gallery, and more"
    )
    
    # MongoDB connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'mithaas_delights')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Setup enhanced routes
    setup_enhanced_routes(app, db)
    
    # Add CORS middleware
    from starlette.middleware.cors import CORSMiddleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.get("/")
    async def root():
        return {
            "message": "Mithaas Delights Enhanced API",
            "version": "2.0.0",
            "features": [
                "Notification System",
                "Advertisement Management",
                "Media Gallery",
                "Enhanced Reviews",
                "Cart Synchronization",
                "Banner Management",
                "Bulk Order System"
            ]
        }
    
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "service": "Mithaas Delights Enhanced API"}
    
    @app.on_event("shutdown")
    async def shutdown_db_client():
        client.close()
    
    return app

# Create the enhanced app instance
enhanced_app = create_enhanced_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(enhanced_app, host="0.0.0.0", port=8001)