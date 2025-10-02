"""
Advertisement System for Mithaas Delights API
Handles banner ads, promotional content, and advertisement management
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
advertisement_router = APIRouter(prefix="/api", tags=["advertisements"])

# ==================== MODELS ====================

class Advertisement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    image_url: str
    video_url: Optional[str] = None
    cta_text: str = "Learn More"
    cta_link: Optional[str] = None
    position: str = "banner"  # banner, sidebar, popup, inline
    display_type: str = "rotating"  # static, rotating, carousel
    display_order: int = 0
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdvertisementCreate(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: str
    video_url: Optional[str] = None
    cta_text: str = "Learn More"
    cta_link: Optional[str] = None
    position: str = "banner"
    display_type: str = "rotating"
    display_order: int = 0
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class AdvertisementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    position: Optional[str] = None
    display_type: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
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

# ==================== ADVERTISEMENT ENDPOINTS ====================

def setup_advertisement_routes(db: AsyncIOMotorDatabase, get_current_admin_user):
    """Setup advertisement routes with database and auth dependencies"""
    
    @advertisement_router.post("/advertisements", response_model=Advertisement)
    async def create_advertisement(
        ad: AdvertisementCreate,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Create advertisement (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        ad_obj = Advertisement(**ad.dict())
        await db.advertisements.insert_one(prepare_for_mongo(ad_obj.dict()))
        
        logger.info(f"Advertisement created: {ad_obj.title}")
        return ad_obj

    @advertisement_router.get("/advertisements", response_model=List[Advertisement])
    async def get_advertisements(
        active_only: bool = True, 
        position: Optional[str] = None,
        limit: int = 50
    ):
        """Get advertisements"""
        filter_query = {}
        
        if active_only:
            filter_query["is_active"] = True
            now = datetime.now(timezone.utc).isoformat()
            
            # Check if ad is within date range
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
        
        if position:
            filter_query["position"] = position
        
        ads = await db.advertisements.find(filter_query).sort("display_order", 1).limit(limit).to_list(length=limit)
        return [Advertisement(**parse_from_mongo(ad)) for ad in ads]

    @advertisement_router.get("/advertisements/{ad_id}", response_model=Advertisement)
    async def get_advertisement(ad_id: str):
        """Get single advertisement by ID"""
        ad = await db.advertisements.find_one({"id": ad_id})
        if not ad:
            raise HTTPException(status_code=404, detail="Advertisement not found")
        return Advertisement(**parse_from_mongo(ad))

    @advertisement_router.put("/advertisements/{ad_id}", response_model=Advertisement)
    async def update_advertisement(
        ad_id: str,
        ad_update: AdvertisementUpdate,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Update advertisement (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        # Build update dict with only provided fields
        update_dict = {k: v for k, v in ad_update.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        result = await db.advertisements.update_one(
            {"id": ad_id},
            {"$set": prepare_for_mongo(update_dict)}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Advertisement not found")
        
        updated_ad = await db.advertisements.find_one({"id": ad_id})
        logger.info(f"Advertisement updated: {ad_id}")
        return Advertisement(**parse_from_mongo(updated_ad))

    @advertisement_router.delete("/advertisements/{ad_id}")
    async def delete_advertisement(
        ad_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Delete advertisement (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        result = await db.advertisements.delete_one({"id": ad_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Advertisement not found")
        
        logger.info(f"Advertisement deleted: {ad_id}")
        return {"message": "Advertisement deleted successfully"}

    @advertisement_router.put("/advertisements/{ad_id}/toggle")
    async def toggle_advertisement(
        ad_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Toggle advertisement active status (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        # Get current status
        ad = await db.advertisements.find_one({"id": ad_id})
        if not ad:
            raise HTTPException(status_code=404, detail="Advertisement not found")
        
        new_status = not ad.get("is_active", True)
        
        result = await db.advertisements.update_one(
            {"id": ad_id},
            {"$set": {
                "is_active": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Advertisement {ad_id} status changed to: {new_status}")
        return {"message": f"Advertisement {'activated' if new_status else 'deactivated'} successfully"}

    @advertisement_router.get("/advertisements/position/{position}", response_model=List[Advertisement])
    async def get_advertisements_by_position(position: str, active_only: bool = True):
        """Get advertisements by position (banner, sidebar, popup, inline)"""
        return await get_advertisements(active_only=active_only, position=position)

    @advertisement_router.post("/advertisements/bulk-update")
    async def bulk_update_advertisements(
        ad_ids: List[str],
        update_data: AdvertisementUpdate,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Bulk update multiple advertisements (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        result = await db.advertisements.update_many(
            {"id": {"$in": ad_ids}},
            {"$set": prepare_for_mongo(update_dict)}
        )
        
        logger.info(f"Bulk updated {result.modified_count} advertisements")
        return {"message": f"Updated {result.modified_count} advertisements successfully"}

    return advertisement_router