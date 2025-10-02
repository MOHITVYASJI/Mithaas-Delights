"""
Enhanced Banner System for Mithaas Delights API
Handles festival banners, promotional banners with file upload support
"""

from fastapi import APIRouter, HTTPException, Security, UploadFile, File
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import logging
import base64
import os
from motor.motor_asyncio import AsyncIOMotorDatabase

# Setup logging
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Create router
banner_router = APIRouter(prefix="/api", tags=["banners"])

# ==================== MODELS ====================

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
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

class BannerForm(BaseModel):
    title: str
    image_url: Optional[str] = None
    festival_name: str
    description: Optional[str] = None
    cta_text: Optional[str] = "Shop Now"
    cta_link: Optional[str] = None
    is_active: bool = True
    display_order: int = 0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    base64_image: Optional[str] = None

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    festival_name: Optional[str] = None
    description: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

# ==================== HELPER FUNCTIONS ====================

def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('updated_at'), datetime):
        data['updated_at'] = data['updated_at'].isoformat()
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
    if isinstance(item.get('start_date'), str):
        item['start_date'] = datetime.fromisoformat(item['start_date'])
    if isinstance(item.get('end_date'), str):
        item['end_date'] = datetime.fromisoformat(item['end_date'])
    return item

def save_base64_image(base64_data: str, folder: str = "banners") -> Optional[str]:
    """Save base64 encoded image to file system"""
    try:
        # Create uploads directory if it doesn't exist
        upload_dir = f"/app/uploads/{folder}"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Decode base64 data
        if "," in base64_data:
            header, data = base64_data.split(",", 1)
            # Extract file extension from header
            if "jpeg" in header or "jpg" in header:
                ext = "jpg"
            elif "png" in header:
                ext = "png"
            elif "gif" in header:
                ext = "gif"
            elif "webp" in header:
                ext = "webp"
            else:
                ext = "jpg"  # default
        else:
            data = base64_data
            ext = "jpg"  # default
        
        # Generate unique filename
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(upload_dir, filename)
        
        # Save file
        with open(filepath, "wb") as f:
            f.write(base64.b64decode(data))
        
        # Return URL path
        return f"/uploads/{folder}/{filename}"
        
    except Exception as e:
        logger.error(f"Failed to save base64 image: {str(e)}")
        return None

# ==================== BANNER ENDPOINTS ====================

def setup_banner_routes(db: AsyncIOMotorDatabase, get_current_admin_user):
    """Setup banner routes with database and auth dependencies"""
    
    @banner_router.post("/banners", response_model=Banner)
    async def create_banner(
        banner: BannerCreate,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Create a new banner (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        banner_obj = Banner(**banner.dict())
        await db.banners.insert_one(prepare_for_mongo(banner_obj.dict()))
        
        logger.info(f"Banner created: {banner_obj.title}")
        return banner_obj

    @banner_router.post("/banners/enhanced", response_model=Banner)
    async def create_banner_enhanced(
        banner: BannerForm,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Create banner with file upload support (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        image_url = banner.image_url
        
        # If base64 provided, save it
        if banner.base64_image:
            saved_url = save_base64_image(banner.base64_image, "banners")
            if saved_url:
                image_url = saved_url
        
        if not image_url:
            raise HTTPException(status_code=400, detail="Either image_url or base64_image required")
        
        banner_obj = Banner(
            title=banner.title,
            image_url=image_url,
            festival_name=banner.festival_name,
            description=banner.description,
            cta_text=banner.cta_text,
            cta_link=banner.cta_link,
            is_active=banner.is_active,
            display_order=banner.display_order,
            start_date=banner.start_date,
            end_date=banner.end_date
        )
        
        await db.banners.insert_one(prepare_for_mongo(banner_obj.dict()))
        logger.info(f"Enhanced banner created: {banner_obj.title}")
        return banner_obj

    @banner_router.post("/banners/upload")
    async def upload_banner_image(
        file: UploadFile = File(...),
        title: str = "New Banner",
        festival_name: str = "General",
        description: Optional[str] = None,
        cta_text: str = "Shop Now",
        cta_link: Optional[str] = None,
        display_order: int = 0,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Upload banner image directly (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Create upload directory
        upload_dir = "/app/uploads/banners"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{uuid.uuid4().hex}.{file_ext}"
        filepath = os.path.join(upload_dir, filename)
        
        # Save file
        try:
            with open(filepath, "wb") as f:
                content = await file.read()
                f.write(content)
            
            image_url = f"/uploads/banners/{filename}"
            
            # Create banner
            banner_obj = Banner(
                title=title,
                image_url=image_url,
                festival_name=festival_name,
                description=description,
                cta_text=cta_text,
                cta_link=cta_link,
                display_order=display_order
            )
            
            await db.banners.insert_one(prepare_for_mongo(banner_obj.dict()))
            logger.info(f"Banner uploaded: {filename}")
            return banner_obj
            
        except Exception as e:
            logger.error(f"Failed to upload banner: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to upload banner")

    @banner_router.get("/banners", response_model=List[Banner])
    async def get_banners(
        active_only: bool = True,
        festival: Optional[str] = None,
        limit: int = 50
    ):
        """Get all banners"""
        filter_query = {}
        
        if active_only:
            filter_query["is_active"] = True
            # Also check date range
            now = datetime.now(timezone.utc).isoformat()
            date_filter = {
                "$and": [
                    {
                        "$or": [
                            {"start_date": None},
                            {"start_date": {"$lte": now}}
                        ]
                    },
                    {
                        "$or": [
                            {"end_date": None},
                            {"end_date": {"$gte": now}}
                        ]
                    }
                ]
            }
            filter_query.update(date_filter)
        
        if festival:
            filter_query["festival_name"] = festival
        
        banners = await db.banners.find(filter_query).sort("display_order", 1).limit(limit).to_list(length=limit)
        return [Banner(**parse_from_mongo(banner)) for banner in banners]

    @banner_router.get("/banners/{banner_id}", response_model=Banner)
    async def get_banner(banner_id: str):
        """Get single banner by ID"""
        banner = await db.banners.find_one({"id": banner_id})
        if not banner:
            raise HTTPException(status_code=404, detail="Banner not found")
        return Banner(**parse_from_mongo(banner))

    @banner_router.put("/banners/{banner_id}", response_model=Banner)
    async def update_banner(
        banner_id: str,
        banner_update: BannerUpdate,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Update a banner (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        update_dict = {k: v for k, v in banner_update.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        result = await db.banners.update_one(
            {"id": banner_id},
            {"$set": prepare_for_mongo(update_dict)}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Banner not found")
        
        updated_banner = await db.banners.find_one({"id": banner_id})
        logger.info(f"Banner updated: {banner_id}")
        return Banner(**parse_from_mongo(updated_banner))

    @banner_router.delete("/banners/{banner_id}")
    async def delete_banner(
        banner_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Delete a banner (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        # Get banner to delete image file if it's local
        banner = await db.banners.find_one({"id": banner_id})
        if banner and banner.get("image_url", "").startswith("/uploads/"):
            try:
                file_path = f"/app{banner['image_url']}"
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Deleted banner file: {file_path}")
            except Exception as e:
                logger.warning(f"Could not delete banner file: {str(e)}")
        
        result = await db.banners.delete_one({"id": banner_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Banner not found")
        
        logger.info(f"Banner deleted: {banner_id}")
        return {"message": "Banner deleted successfully"}

    @banner_router.put("/banners/{banner_id}/toggle")
    async def toggle_banner(
        banner_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Toggle banner active status (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        # Get current status
        banner = await db.banners.find_one({"id": banner_id})
        if not banner:
            raise HTTPException(status_code=404, detail="Banner not found")
        
        new_status = not banner.get("is_active", True)
        
        result = await db.banners.update_one(
            {"id": banner_id},
            {"$set": {
                "is_active": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Banner {banner_id} status changed to: {new_status}")
        return {"message": f"Banner {'activated' if new_status else 'deactivated'} successfully"}

    @banner_router.get("/banners/festival/{festival_name}", response_model=List[Banner])
    async def get_banners_by_festival(festival_name: str, active_only: bool = True):
        """Get banners by festival name"""
        return await get_banners(active_only=active_only, festival=festival_name)

    @banner_router.post("/banners/bulk-update")
    async def bulk_update_banners(
        banner_ids: List[str],
        update_data: BannerUpdate,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Bulk update multiple banners (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        result = await db.banners.update_many(
            {"id": {"$in": banner_ids}},
            {"$set": prepare_for_mongo(update_dict)}
        )
        
        logger.info(f"Bulk updated {result.modified_count} banners")
        return {"message": f"Updated {result.modified_count} banners successfully"}

    return banner_router