# advertisement_system.py - Advertisement and Banner Management System
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

# Advertisement Models
class AdType:
    BANNER = "banner"
    POPUP = "popup"
    INLINE = "inline"
    CAROUSEL = "carousel"
    VIDEO = "video"

class AdPlacement:
    HERO_SECTION = "hero_section"
    PRODUCT_GRID = "product_grid"
    SIDEBAR = "sidebar"
    FOOTER = "footer"
    HEADER = "header"
    BETWEEN_PRODUCTS = "between_products"
    CHECKOUT = "checkout"

class Advertisement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    ad_type: str = AdType.BANNER
    placement: str = AdPlacement.HERO_SECTION
    media_url: str  # Image, video, or carousel images
    media_type: str = "image"  # "image", "video", "carousel"
    click_url: Optional[str] = None
    cta_text: Optional[str] = "Shop Now"
    target_audience: str = "all"  # "all", "new_users", "returning_users"
    display_order: int = 0
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    click_count: int = 0
    impression_count: int = 0
    budget_limit: Optional[float] = None
    cost_per_click: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdvertisementCreate(BaseModel):
    title: str
    description: Optional[str] = None
    ad_type: str = AdType.BANNER
    placement: str = AdPlacement.HERO_SECTION
    media_url: str
    media_type: str = "image"
    click_url: Optional[str] = None
    cta_text: Optional[str] = "Shop Now"
    target_audience: str = "all"
    display_order: int = 0
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget_limit: Optional[float] = None
    cost_per_click: Optional[float] = None

class AdvertisementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    ad_type: Optional[str] = None
    placement: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    click_url: Optional[str] = None
    cta_text: Optional[str] = None
    target_audience: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget_limit: Optional[float] = None
    cost_per_click: Optional[float] = None

# Enhanced Banner Model (extending existing)
class EnhancedBanner(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: Optional[str] = None
    image_url: str
    mobile_image_url: Optional[str] = None  # Separate image for mobile
    video_url: Optional[str] = None
    festival_name: Optional[str] = None
    description: Optional[str] = None
    cta_text: str = "Shop Now"
    cta_link: Optional[str] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    overlay_opacity: float = 0.3
    animation_type: Optional[str] = None  # "fade", "slide", "zoom"
    is_active: bool = True
    display_order: int = 0
    placement: str = "hero"
    target_page: Optional[str] = None  # "home", "products", "category"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    view_count: int = 0
    click_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image_url: str
    mobile_image_url: Optional[str] = None
    video_url: Optional[str] = None
    festival_name: Optional[str] = None
    description: Optional[str] = None
    cta_text: str = "Shop Now"
    cta_link: Optional[str] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    overlay_opacity: float = 0.3
    animation_type: Optional[str] = None
    is_active: bool = True
    display_order: int = 0
    placement: str = "hero"
    target_page: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class AdvertisementManager:
    def __init__(self, db):
        self.db = db
        self.advertisements = db.advertisements
        self.banners = db.enhanced_banners
        self.ad_analytics = db.ad_analytics
    
    async def create_advertisement(self, ad_data: AdvertisementCreate) -> Advertisement:
        """Create a new advertisement"""
        advertisement = Advertisement(**ad_data.dict())
        await self.advertisements.insert_one(
            self._prepare_for_mongo(advertisement.dict())
        )
        return advertisement
    
    async def get_advertisements(
        self, 
        placement: Optional[str] = None,
        active_only: bool = True
    ) -> List[Advertisement]:
        """Get advertisements by placement and status"""
        filter_query = {}
        
        if placement:
            filter_query["placement"] = placement
        
        if active_only:
            filter_query["is_active"] = True
            # Check date range - either no dates set or within valid date range
            now = datetime.now(timezone.utc).isoformat()
            filter_query["$and"] = [
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
        
        ads = await self.advertisements.find(filter_query).sort("display_order", 1).to_list(length=None)
        return [Advertisement(**self._parse_from_mongo(ad)) for ad in ads]
    
    async def update_advertisement(
        self, 
        ad_id: str, 
        ad_data: AdvertisementUpdate
    ) -> Advertisement:
        """Update advertisement"""
        update_dict = {k: v for k, v in ad_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        result = await self.advertisements.update_one(
            {"id": ad_id},
            {"$set": self._prepare_for_mongo(update_dict)}
        )
        
        if result.matched_count == 0:
            raise ValueError("Advertisement not found")
        
        updated_ad = await self.advertisements.find_one({"id": ad_id})
        return Advertisement(**self._parse_from_mongo(updated_ad))
    
    async def delete_advertisement(self, ad_id: str) -> bool:
        """Delete advertisement"""
        result = await self.advertisements.delete_one({"id": ad_id})
        return result.deleted_count > 0
    
    async def record_impression(self, ad_id: str) -> bool:
        """Record advertisement impression"""
        result = await self.advertisements.update_one(
            {"id": ad_id},
            {"$inc": {"impression_count": 1}}
        )
        return result.modified_count > 0
    
    async def record_click(self, ad_id: str) -> bool:
        """Record advertisement click"""
        result = await self.advertisements.update_one(
            {"id": ad_id},
            {"$inc": {"click_count": 1}}
        )
        return result.modified_count > 0
    
    # Enhanced Banner Methods
    async def create_banner(self, banner_data: BannerCreate) -> EnhancedBanner:
        """Create a new enhanced banner"""
        banner = EnhancedBanner(**banner_data.dict())
        await self.banners.insert_one(
            self._prepare_for_mongo(banner.dict())
        )
        return banner
    
    async def get_banners(
        self, 
        placement: Optional[str] = None,
        active_only: bool = True
    ) -> List[EnhancedBanner]:
        """Get banners by placement and status"""
        filter_query = {}
        
        if placement:
            filter_query["placement"] = placement
        
        if active_only:
            filter_query["is_active"] = True
            # Check date range
            now = datetime.now(timezone.utc).isoformat()
            filter_query["$or"] = [
                {"start_date": None, "end_date": None},
                {"start_date": {"$lte": now}, "end_date": None},
                {"start_date": None, "end_date": {"$gte": now}},
                {"start_date": {"$lte": now}, "end_date": {"$gte": now}}
            ]
        
        banners = await self.banners.find(filter_query).sort("display_order", 1).to_list(length=None)
        return [EnhancedBanner(**self._parse_from_mongo(banner)) for banner in banners]
    
    async def update_banner(
        self, 
        banner_id: str, 
        banner_data: BannerCreate
    ) -> EnhancedBanner:
        """Update banner"""
        update_dict = banner_data.dict()
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        result = await self.banners.update_one(
            {"id": banner_id},
            {"$set": self._prepare_for_mongo(update_dict)}
        )
        
        if result.matched_count == 0:
            raise ValueError("Banner not found")
        
        updated_banner = await self.banners.find_one({"id": banner_id})
        return EnhancedBanner(**self._parse_from_mongo(updated_banner))
    
    async def delete_banner(self, banner_id: str) -> bool:
        """Delete banner"""
        result = await self.banners.delete_one({"id": banner_id})
        return result.deleted_count > 0
    
    async def record_banner_view(self, banner_id: str) -> bool:
        """Record banner view"""
        result = await self.banners.update_one(
            {"id": banner_id},
            {"$inc": {"view_count": 1}}
        )
        return result.modified_count > 0
    
    async def record_banner_click(self, banner_id: str) -> bool:
        """Record banner click"""
        result = await self.banners.update_one(
            {"id": banner_id},
            {"$inc": {"click_count": 1}}
        )
        return result.modified_count > 0
    
    def _prepare_for_mongo(self, data: dict) -> dict:
        """Prepare data for MongoDB storage"""
        if isinstance(data.get('created_at'), datetime):
            data['created_at'] = data['created_at'].isoformat()
        if isinstance(data.get('updated_at'), datetime):
            data['updated_at'] = data['updated_at'].isoformat()
        if isinstance(data.get('start_date'), datetime):
            data['start_date'] = data['start_date'].isoformat()
        if isinstance(data.get('end_date'), datetime):
            data['end_date'] = data['end_date'].isoformat()
        return data
    
    def _parse_from_mongo(self, item: dict) -> dict:
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
