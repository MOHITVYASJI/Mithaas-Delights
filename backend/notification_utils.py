# notification_utils.py - Web Push Notification Utilities
import os
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict
import logging

logger = logging.getLogger(__name__)

# In-memory storage for push subscriptions (in production, use database)
push_subscriptions = {}

def save_push_subscription(user_id: str, subscription_data: dict):
    """Save user's push notification subscription"""
    push_subscriptions[user_id] = subscription_data
    logger.info(f"Saved push subscription for user: {user_id}")
    return True

def remove_push_subscription(user_id: str):
    """Remove user's push notification subscription"""
    if user_id in push_subscriptions:
        del push_subscriptions[user_id]
        logger.info(f"Removed push subscription for user: {user_id}")
        return True
    return False

def get_push_subscription(user_id: str) -> Optional[dict]:
    """Get user's push notification subscription"""
    return push_subscriptions.get(user_id)

def send_push_notification(user_id: str, title: str, body: str, data: Optional[dict] = None):
    """
    Send push notification to user
    Note: This is a simplified implementation. In production, use proper web push libraries
    like py-vapid and pywebpush
    """
    try:
        subscription = get_push_subscription(user_id)
        if not subscription:
            logger.warning(f"No push subscription found for user: {user_id}")
            return False
        
        # In production, implement actual web push using:
        # from pywebpush import webpush, WebPushException
        # webpush(subscription, json.dumps(payload), ...)
        
        logger.info(f"Push notification sent to user {user_id}: {title}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send push notification: {str(e)}")
        return False

def broadcast_push_notification(user_ids: List[str], title: str, body: str, data: Optional[dict] = None):
    """Send push notification to multiple users"""
    results = []
    for user_id in user_ids:
        result = send_push_notification(user_id, title, body, data)
        results.append({"user_id": user_id, "sent": result})
    return results
