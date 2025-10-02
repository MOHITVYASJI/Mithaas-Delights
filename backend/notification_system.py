"""
Notification System for Mithaas Delights API
Handles user notifications, broadcasts, and admin notification management
"""

from fastapi import APIRouter, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum
import uuid
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

# Setup logging
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Create router
notification_router = APIRouter(prefix="/api", tags=["notifications"])

# ==================== MODELS ====================

class NotificationType(str, Enum):
    OFFER = "offer"
    FESTIVAL = "festival"
    ORDER_UPDATE = "order_update"
    NEW_PRODUCT = "new_product"
    GENERAL = "general"

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    type: NotificationType = NotificationType.GENERAL
    target_users: List[str] = []  # Empty means all users
    is_broadcast: bool = False
    link: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    is_active: bool = True

class NotificationCreate(BaseModel):
    title: str
    message: str
    type: NotificationType = NotificationType.GENERAL
    is_broadcast: bool = False
    target_users: List[str] = []
    link: Optional[str] = None
    image_url: Optional[str] = None
    expires_at: Optional[datetime] = None

class UserNotification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    notification_id: str
    is_read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== HELPER FUNCTIONS ====================

def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('updated_at'), datetime):
        data['updated_at'] = data['updated_at'].isoformat()
    if isinstance(data.get('expires_at'), datetime):
        data['expires_at'] = data['expires_at'].isoformat()
    if isinstance(data.get('read_at'), datetime):
        data['read_at'] = data['read_at'].isoformat()
    return data

def parse_from_mongo(item):
    """Parse MongoDB document back to Python objects"""
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    if isinstance(item.get('expires_at'), str):
        item['expires_at'] = datetime.fromisoformat(item['expires_at'])
    if isinstance(item.get('read_at'), str):
        item['read_at'] = datetime.fromisoformat(item['read_at'])
    return item

# ==================== NOTIFICATION ENDPOINTS ====================

def setup_notification_routes(db: AsyncIOMotorDatabase, get_current_user, get_current_admin_user):
    """Setup notification routes with database and auth dependencies"""
    
    @notification_router.post("/notifications")
    async def create_notification(
        notification: NotificationCreate,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Create and send notification (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        notif_obj = Notification(**notification.dict())
        await db.notifications.insert_one(prepare_for_mongo(notif_obj.dict()))
        
        # Create user notifications
        if notification.is_broadcast or not notification.target_users:
            # Send to all active users
            users = await db.users.find({"is_active": True}).to_list(length=None)
            for user in users:
                user_notif = UserNotification(
                    user_id=user["id"],
                    notification_id=notif_obj.id
                )
                await db.user_notifications.insert_one(prepare_for_mongo(user_notif.dict()))
        else:
            # Send to specific users
            for user_id in notification.target_users:
                user_notif = UserNotification(
                    user_id=user_id,
                    notification_id=notif_obj.id
                )
                await db.user_notifications.insert_one(prepare_for_mongo(user_notif.dict()))
        
        logger.info(f"Notification created and sent: {notif_obj.title}")
        return {"message": "Notification sent successfully", "notification_id": notif_obj.id}

    @notification_router.get("/notifications/my")
    async def get_my_notifications(
        credentials: HTTPAuthorizationCredentials = Security(security),
        unread_only: bool = False
    ):
        """Get current user's notifications"""
        current_user = await get_current_user(credentials, db)
        
        filter_query = {"user_id": current_user["id"]}
        if unread_only:
            filter_query["is_read"] = False
        
        user_notifs = await db.user_notifications.find(filter_query).sort("created_at", -1).to_list(length=50)
        
        # Fetch full notification details
        result = []
        for user_notif in user_notifs:
            notif = await db.notifications.find_one({"id": user_notif["notification_id"]})
            if notif and notif.get("is_active", True):
                result.append({
                    **parse_from_mongo(notif),
                    "is_read": user_notif["is_read"],
                    "user_notification_id": user_notif["id"]
                })
        
        return result

    @notification_router.put("/notifications/{user_notif_id}/read")
    async def mark_notification_read(
        user_notif_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Mark notification as read"""
        current_user = await get_current_user(credentials, db)
        
        result = await db.user_notifications.update_one(
            {"id": user_notif_id, "user_id": current_user["id"]},
            {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"message": "Notification marked as read"}

    @notification_router.get("/notifications/unread-count")
    async def get_unread_count(credentials: HTTPAuthorizationCredentials = Security(security)):
        """Get count of unread notifications"""
        current_user = await get_current_user(credentials, db)
        
        count = await db.user_notifications.count_documents({
            "user_id": current_user["id"],
            "is_read": False
        })
        
        return {"unread_count": count}

    @notification_router.get("/notifications/admin/all")
    async def get_all_notifications_admin(
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Get all notifications (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        notifications = await db.notifications.find().sort("created_at", -1).to_list(length=None)
        return [Notification(**parse_from_mongo(notif)) for notif in notifications]

    @notification_router.delete("/notifications/{notification_id}")
    async def delete_notification(
        notification_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Delete notification (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        result = await db.notifications.delete_one({"id": notification_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Also delete user notifications
        await db.user_notifications.delete_many({"notification_id": notification_id})
        
        return {"message": "Notification deleted successfully"}

    @notification_router.put("/notifications/{notification_id}")
    async def update_notification(
        notification_id: str,
        notification_update: NotificationCreate,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Update notification (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        update_dict = notification_update.dict()
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        result = await db.notifications.update_one(
            {"id": notification_id},
            {"$set": prepare_for_mongo(update_dict)}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        updated_notif = await db.notifications.find_one({"id": notification_id})
        return Notification(**parse_from_mongo(updated_notif))

    return notification_router