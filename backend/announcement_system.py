# announcement_system.py - Marquee/Announcement Management System
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

class AnnouncementType:
    MARQUEE = "marquee"
    POPUP = "popup"
    BANNER = "banner"
    TICKER = "ticker"

class Announcement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    announcement_type: str = AnnouncementType.MARQUEE
    color: str = "#f97316"  # Orange color by default
    background_color: str = "#fff7ed"  # Light orange background
    text_color: str = "#9a3412"  # Dark orange text
    font_size: str = "16px"
    font_weight: str = "600"
    animation_speed: int = 50  # Speed in pixels per second
    direction: str = "left"  # "left", "right", "up", "down"
    is_active: bool = True
    display_order: int = 0
    show_on_pages: List[str] = ["home"]  # Pages where announcement should show
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_displays: Optional[int] = None  # Maximum number of times to show
    display_count: int = 0
    click_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnnouncementCreate(BaseModel):
    title: str
    message: str
    announcement_type: str = AnnouncementType.MARQUEE
    color: str = "#f97316"
    background_color: str = "#fff7ed"
    text_color: str = "#9a3412"
    font_size: str = "16px"
    font_weight: str = "600"
    animation_speed: int = 50
    direction: str = "left"
    is_active: bool = True
    display_order: int = 0
    show_on_pages: List[str] = ["home"]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_displays: Optional[int] = None

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    announcement_type: Optional[str] = None
    color: Optional[str] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    font_size: Optional[str] = None
    font_weight: Optional[str] = None
    animation_speed: Optional[int] = None
    direction: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None
    show_on_pages: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_displays: Optional[int] = None

class AnnouncementManager:
    def __init__(self, db):
        self.db = db
        self.announcements = db.announcements
    
    async def create_announcement(self, announcement_data: AnnouncementCreate) -> Announcement:
        """Create a new announcement"""
        announcement = Announcement(**announcement_data.dict())
        await self.announcements.insert_one(
            self._prepare_for_mongo(announcement.dict())
        )
        return announcement
    
    async def get_active_announcements(
        self,
        page: Optional[str] = None,
        announcement_type: Optional[str] = None
    ) -> List[Announcement]:
        """Get active announcements for a specific page and type"""
        filter_query = {"is_active": True}
        
        # Check date range
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
        
        # Filter by page
        if page:
            filter_query["show_on_pages"] = {"$in": [page, "all"]}
        
        # Filter by announcement type
        if announcement_type:
            filter_query["announcement_type"] = announcement_type
        
        # Check max displays limit
        filter_query["$or"] = [
            {"max_displays": None},
            {"$expr": {"$lt": ["$display_count", "$max_displays"]}}
        ]
        
        announcements = await self.announcements.find(filter_query).sort("display_order", 1).to_list(length=None)
        return [Announcement(**self._parse_from_mongo(announcement)) for announcement in announcements]
    
    async def get_all_announcements(self, active_only: bool = False) -> List[Announcement]:
        """Get all announcements for admin panel"""
        filter_query = {}
        if active_only:
            filter_query["is_active"] = True
        
        announcements = await self.announcements.find(filter_query).sort([("display_order", 1), ("created_at", -1)]).to_list(length=None)
        return [Announcement(**self._parse_from_mongo(announcement)) for announcement in announcements]
    
    async def get_announcement_by_id(self, announcement_id: str) -> Optional[Announcement]:
        """Get announcement by ID"""
        announcement = await self.announcements.find_one({"id": announcement_id})
        if announcement:
            return Announcement(**self._parse_from_mongo(announcement))
        return None
    
    async def update_announcement(
        self,
        announcement_id: str,
        announcement_data: AnnouncementUpdate
    ) -> Announcement:
        """Update an announcement"""
        update_dict = {k: v for k, v in announcement_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        result = await self.announcements.update_one(
            {"id": announcement_id},
            {"$set": self._prepare_for_mongo(update_dict)}
        )
        
        if result.matched_count == 0:
            raise ValueError("Announcement not found")
        
        updated_announcement = await self.announcements.find_one({"id": announcement_id})
        return Announcement(**self._parse_from_mongo(updated_announcement))
    
    async def delete_announcement(self, announcement_id: str) -> bool:
        """Delete an announcement"""
        result = await self.announcements.delete_one({"id": announcement_id})
        return result.deleted_count > 0
    
    async def record_display(self, announcement_id: str) -> bool:
        """Record announcement display"""
        result = await self.announcements.update_one(
            {"id": announcement_id},
            {"$inc": {"display_count": 1}}
        )
        return result.modified_count > 0
    
    async def record_click(self, announcement_id: str) -> bool:
        """Record announcement click"""
        result = await self.announcements.update_one(
            {"id": announcement_id},
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