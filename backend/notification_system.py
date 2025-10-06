# notification_system.py - Comprehensive Notification System
import os
import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
import logging

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

# Notification Models
class NotificationType:
    GENERAL = "general"
    OFFER = "offer"
    FESTIVAL = "festival"
    ORDER_UPDATE = "order_update"
    SYSTEM = "system"

class NotificationStatus:
    PENDING = "pending"
    SENT = "sent"
    READ = "read"
    DISMISSED = "dismissed"

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    notification_type: str = NotificationType.GENERAL
    target_audience: str = "all"  # "all", "users", "specific_user_id"
    target_user_id: Optional[str] = None
    image_url: Optional[str] = None
    action_url: Optional[str] = None
    action_text: Optional[str] = None
    status: str = NotificationStatus.PENDING
    is_push_notification: bool = True
    is_in_app_notification: bool = True
    priority: str = "normal"  # "low", "normal", "high", "urgent"
    expires_at: Optional[datetime] = None
    created_by: str  # admin user id
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None

class NotificationCreate(BaseModel):
    title: str
    message: str
    notification_type: str = NotificationType.GENERAL
    target_audience: str = "all"
    target_user_id: Optional[str] = None
    image_url: Optional[str] = None
    action_url: Optional[str] = None
    action_text: Optional[str] = None
    is_push_notification: bool = True
    is_in_app_notification: bool = True
    priority: str = "normal"
    expires_at: Optional[datetime] = None

class UserNotificationStatus(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    notification_id: str
    user_id: str
    status: str = NotificationStatus.SENT
    read_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationManager:
    def __init__(self, db):
        self.db = db
        self.notifications: AsyncIOMotorCollection = db.notifications
        self.user_notification_status: AsyncIOMotorCollection = db.user_notification_status
    
    async def create_notification(
        self, 
        notification_data: NotificationCreate, 
        created_by: str
    ) -> Notification:
        """Create a new notification"""
        notification = Notification(
            **notification_data.dict(),
            created_by=created_by
        )
        
        # Insert into database
        await self.notifications.insert_one(self._prepare_for_mongo(notification.dict()))
        
        # If targeting specific user, create user notification status
        if notification.target_audience == "specific" and notification.target_user_id:
            await self._create_user_notification_status(
                notification.id, 
                notification.target_user_id
            )
        
        return notification
    
    async def broadcast_notification(
        self, 
        notification_id: str
    ) -> Dict[str, Any]:
        """Broadcast notification to target audience"""
        notification = await self.notifications.find_one({"id": notification_id})
        if not notification:
            raise ValueError("Notification not found")
        
        notification_obj = Notification(**self._parse_from_mongo(notification))
        
        # Get target users
        target_users = await self._get_target_users(notification_obj)
        
        # Create user notification status for each target user
        user_statuses = []
        for user_id in target_users:
            status = await self._create_user_notification_status(
                notification_id, 
                user_id
            )
            user_statuses.append(status)
        
        # Update notification status to sent
        await self.notifications.update_one(
            {"id": notification_id},
            {
                "$set": {
                    "status": NotificationStatus.SENT,
                    "sent_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            "notification_id": notification_id,
            "target_user_count": len(target_users),
            "broadcast_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_user_notifications(
        self, 
        user_id: str, 
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get notifications for a specific user"""
        # Get user notification statuses
        status_filter = {"user_id": user_id}
        if unread_only:
            status_filter["read_at"] = None
        
        user_statuses = await self.user_notification_status.find(
            status_filter
        ).sort("created_at", -1).limit(limit).to_list(length=limit)
        
        # Get corresponding notifications
        notification_ids = [status["notification_id"] for status in user_statuses]
        notifications = await self.notifications.find(
            {"id": {"$in": notification_ids}}
        ).to_list(length=len(notification_ids))
        
        # Combine notification with user status
        result = []
        for status in user_statuses:
            notification = next(
                (n for n in notifications if n["id"] == status["notification_id"]), 
                None
            )
            if notification:
                # First serialize ObjectId fields, then parse dates
                notification_serialized = serialize_mongo_document(notification)
                status_serialized = serialize_mongo_document(status)
                
                notification_data = self._parse_from_mongo(notification_serialized)
                notification_data["user_status"] = self._parse_from_mongo(status_serialized)
                result.append(notification_data)
        
        return result
    
    async def mark_notification_read(
        self, 
        notification_id: str, 
        user_id: str
    ) -> bool:
        """Mark notification as read for a user"""
        result = await self.user_notification_status.update_one(
            {
                "notification_id": notification_id,
                "user_id": user_id
            },
            {
                "$set": {
                    "status": NotificationStatus.READ,
                    "read_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        return result.modified_count > 0
    
    async def dismiss_notification(
        self, 
        notification_id: str, 
        user_id: str
    ) -> bool:
        """Dismiss notification for a user"""
        result = await self.user_notification_status.update_one(
            {
                "notification_id": notification_id,
                "user_id": user_id
            },
            {
                "$set": {
                    "status": NotificationStatus.DISMISSED,
                    "dismissed_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        return result.modified_count > 0
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user"""
        count = await self.user_notification_status.count_documents({
            "user_id": user_id,
            "read_at": None,
            "status": {"$ne": NotificationStatus.DISMISSED}
        })
        return count
    
    async def _create_user_notification_status(
        self, 
        notification_id: str, 
        user_id: str
    ) -> UserNotificationStatus:
        """Create user notification status entry"""
        status = UserNotificationStatus(
            notification_id=notification_id,
            user_id=user_id
        )
        
        await self.user_notification_status.insert_one(
            self._prepare_for_mongo(status.dict())
        )
        
        return status
    
    async def _get_target_users(self, notification: Notification) -> List[str]:
        """Get list of user IDs to target for notification"""
        if notification.target_audience == "specific" and notification.target_user_id:
            return [notification.target_user_id]
        elif notification.target_audience == "all":
            # Get all active users
            users = await self.db.users.find(
                {"is_active": True},
                {"id": 1}
            ).to_list(length=None)
            return [user["id"] for user in users]
        elif notification.target_audience == "users":
            # Get all non-admin active users
            users = await self.db.users.find(
                {"is_active": True, "role": "user"},
                {"id": 1}
            ).to_list(length=None)
            return [user["id"] for user in users]
        else:
            return []
    
    def _prepare_for_mongo(self, data: dict) -> dict:
        """Prepare data for MongoDB storage"""
        if isinstance(data.get('created_at'), datetime):
            data['created_at'] = data['created_at'].isoformat()
        if isinstance(data.get('sent_at'), datetime):
            data['sent_at'] = data['sent_at'].isoformat()
        if isinstance(data.get('read_at'), datetime):
            data['read_at'] = data['read_at'].isoformat()
        if isinstance(data.get('dismissed_at'), datetime):
            data['dismissed_at'] = data['dismissed_at'].isoformat()
        if isinstance(data.get('expires_at'), datetime):
            data['expires_at'] = data['expires_at'].isoformat()
        return data
    
    def _parse_from_mongo(self, item: dict) -> dict:
        """Parse MongoDB document back to Python objects"""
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if isinstance(item.get('sent_at'), str):
            item['sent_at'] = datetime.fromisoformat(item['sent_at'])
        if isinstance(item.get('read_at'), str):
            item['read_at'] = datetime.fromisoformat(item['read_at'])
        if isinstance(item.get('dismissed_at'), str):
            item['dismissed_at'] = datetime.fromisoformat(item['dismissed_at'])
        if isinstance(item.get('expires_at'), str):
            item['expires_at'] = datetime.fromisoformat(item['expires_at'])
        return item

# Web Push Notification Support
class WebPushManager:
    def __init__(self):
        self.vapid_private_key = os.environ.get('VAPID_PRIVATE_KEY')
        self.vapid_public_key = os.environ.get('VAPID_PUBLIC_KEY')
        self.vapid_email = os.environ.get('VAPID_EMAIL', 'mithaasdelightsofficial@gmail.com')
    
    async def send_push_notification(
        self, 
        subscription_info: dict, 
        notification_data: dict
    ) -> bool:
        """Send web push notification to user's device"""
        try:
            # This is a placeholder for web push implementation
            # In production, you would use pywebpush library
            logger.info(f"Would send push notification: {notification_data}")
            return True
        except Exception as e:
            logger.error(f"Error sending push notification: {str(e)}")
            return False
    
    def get_vapid_public_key(self) -> str:
        """Get VAPID public key for frontend registration"""
        # Generate a dummy key for now - in production use real VAPID keys
        return "BKxlOhP6uVRl7jzZNUCdU7o4L_2_Tv3K4h8VQ9vFJ1C3m2_JB8NZ5X6R9zQ4M_8fG"
