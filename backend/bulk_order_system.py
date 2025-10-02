"""
Bulk Order Management System for Mithaas Delights API
Handles bulk order requests, quotations, and B2B order management
"""

from fastapi import APIRouter, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, EmailStr
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
bulk_order_router = APIRouter(prefix="/api", tags=["bulk-orders"])

# ==================== MODELS ====================

class BulkOrderStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    QUOTED = "quoted"
    CONFIRMED = "confirmed"
    IN_PRODUCTION = "in_production"
    READY_FOR_DELIVERY = "ready_for_delivery"
    DELIVERED = "delivered"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class BulkOrderPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class BulkOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    contact_person: str
    email: EmailStr
    phone: str
    product_details: str  # Description of products needed
    quantity: str  # e.g., "50 boxes", "100 kg"
    preferred_date: Optional[datetime] = None
    delivery_address: str
    status: BulkOrderStatus = BulkOrderStatus.PENDING
    priority: BulkOrderPriority = BulkOrderPriority.MEDIUM
    admin_notes: Optional[str] = None
    quoted_amount: Optional[float] = None
    discount_percentage: Optional[float] = None
    final_amount: Optional[float] = None
    payment_terms: Optional[str] = None
    delivery_timeline: Optional[str] = None
    special_requirements: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BulkOrderCreate(BaseModel):
    company_name: str
    contact_person: str
    email: EmailStr
    phone: str
    product_details: str
    quantity: str
    preferred_date: Optional[datetime] = None
    delivery_address: str
    special_requirements: Optional[str] = None

class BulkOrderUpdate(BaseModel):
    status: Optional[BulkOrderStatus] = None
    priority: Optional[BulkOrderPriority] = None
    admin_notes: Optional[str] = None
    quoted_amount: Optional[float] = None
    discount_percentage: Optional[float] = None
    final_amount: Optional[float] = None
    payment_terms: Optional[str] = None
    delivery_timeline: Optional[str] = None

class BulkOrderQuote(BaseModel):
    quoted_amount: float
    discount_percentage: Optional[float] = None
    payment_terms: str = "Net 30"
    delivery_timeline: str = "7-10 business days"
    admin_notes: Optional[str] = None

class BulkOrderResponse(BaseModel):
    id: str
    company_name: str
    contact_person: str
    email: str
    phone: str
    product_details: str
    quantity: str
    preferred_date: Optional[datetime]
    delivery_address: str
    status: BulkOrderStatus
    priority: BulkOrderPriority
    admin_notes: Optional[str]
    quoted_amount: Optional[float]
    discount_percentage: Optional[float]
    final_amount: Optional[float]
    payment_terms: Optional[str]
    delivery_timeline: Optional[str]
    special_requirements: Optional[str]
    created_at: datetime
    updated_at: datetime

# ==================== HELPER FUNCTIONS ====================

def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('updated_at'), datetime):
        data['updated_at'] = data['updated_at'].isoformat()
    if isinstance(data.get('preferred_date'), datetime):
        data['preferred_date'] = data['preferred_date'].isoformat()
    return data

def parse_from_mongo(item):
    """Parse MongoDB document back to Python objects"""
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    if isinstance(item.get('preferred_date'), str):
        item['preferred_date'] = datetime.fromisoformat(item['preferred_date'])
    return item

def calculate_final_amount(quoted_amount: float, discount_percentage: Optional[float] = None) -> float:
    """Calculate final amount after discount"""
    if discount_percentage and discount_percentage > 0:
        discount_amount = (quoted_amount * discount_percentage) / 100
        return quoted_amount - discount_amount
    return quoted_amount

# ==================== BULK ORDER ENDPOINTS ====================

def setup_bulk_order_routes(db: AsyncIOMotorDatabase, get_current_admin_user):
    """Setup bulk order routes with database and auth dependencies"""
    
    @bulk_order_router.post("/bulk-orders", response_model=BulkOrder)
    async def create_bulk_order(bulk_order: BulkOrderCreate):
        """Submit bulk order request"""
        order_obj = BulkOrder(**bulk_order.dict())
        await db.bulk_orders.insert_one(prepare_for_mongo(order_obj.dict()))
        
        logger.info(f"Bulk order created: {order_obj.id} from {order_obj.company_name}")
        return order_obj

    @bulk_order_router.get("/bulk-orders", response_model=List[BulkOrderResponse])
    async def get_bulk_orders(
        credentials: HTTPAuthorizationCredentials = Security(security),
        status: Optional[BulkOrderStatus] = None,
        priority: Optional[BulkOrderPriority] = None,
        limit: int = 100
    ):
        """Get all bulk orders (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        filter_query = {}
        if status:
            filter_query["status"] = status.value
        if priority:
            filter_query["priority"] = priority.value
        
        bulk_orders = await db.bulk_orders.find(filter_query).sort("created_at", -1).limit(limit).to_list(length=limit)
        return [BulkOrderResponse(**parse_from_mongo(order)) for order in bulk_orders]

    @bulk_order_router.get("/bulk-orders/{order_id}", response_model=BulkOrderResponse)
    async def get_bulk_order(
        order_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Get single bulk order by ID (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        order = await db.bulk_orders.find_one({"id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Bulk order not found")
        return BulkOrderResponse(**parse_from_mongo(order))

    @bulk_order_router.put("/bulk-orders/{order_id}", response_model=BulkOrderResponse)
    async def update_bulk_order(
        order_id: str,
        order_update: BulkOrderUpdate,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Update bulk order (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        update_dict = {k: v for k, v in order_update.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        # Calculate final amount if quoted amount or discount changed
        if "quoted_amount" in update_dict or "discount_percentage" in update_dict:
            current_order = await db.bulk_orders.find_one({"id": order_id})
            if current_order:
                quoted_amount = update_dict.get("quoted_amount", current_order.get("quoted_amount", 0))
                discount_percentage = update_dict.get("discount_percentage", current_order.get("discount_percentage"))
                update_dict["final_amount"] = calculate_final_amount(quoted_amount, discount_percentage)
        
        result = await db.bulk_orders.update_one(
            {"id": order_id},
            {"$set": prepare_for_mongo(update_dict)}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bulk order not found")
        
        updated_order = await db.bulk_orders.find_one({"id": order_id})
        logger.info(f"Bulk order updated: {order_id}")
        return BulkOrderResponse(**parse_from_mongo(updated_order))

    @bulk_order_router.put("/bulk-orders/{order_id}/quote")
    async def quote_bulk_order(
        order_id: str,
        quote: BulkOrderQuote,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Provide quote for bulk order (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        final_amount = calculate_final_amount(quote.quoted_amount, quote.discount_percentage)
        
        update_dict = {
            "status": BulkOrderStatus.QUOTED.value,
            "quoted_amount": quote.quoted_amount,
            "discount_percentage": quote.discount_percentage,
            "final_amount": final_amount,
            "payment_terms": quote.payment_terms,
            "delivery_timeline": quote.delivery_timeline,
            "admin_notes": quote.admin_notes,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = await db.bulk_orders.update_one(
            {"id": order_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bulk order not found")
        
        logger.info(f"Bulk order quoted: {order_id} - Amount: {final_amount}")
        return {"message": "Quote provided successfully", "final_amount": final_amount}

    @bulk_order_router.put("/bulk-orders/{order_id}/status")
    async def update_bulk_order_status(
        order_id: str,
        status: BulkOrderStatus,
        notes: Optional[str] = None,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Update bulk order status (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        update_dict = {
            "status": status.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if notes:
            update_dict["admin_notes"] = notes
        
        result = await db.bulk_orders.update_one(
            {"id": order_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bulk order not found")
        
        logger.info(f"Bulk order status updated: {order_id} -> {status.value}")
        return {"message": "Status updated successfully", "new_status": status.value}

    @bulk_order_router.put("/bulk-orders/{order_id}/priority")
    async def update_bulk_order_priority(
        order_id: str,
        priority: BulkOrderPriority,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Update bulk order priority (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        result = await db.bulk_orders.update_one(
            {"id": order_id},
            {"$set": {
                "priority": priority.value,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bulk order not found")
        
        logger.info(f"Bulk order priority updated: {order_id} -> {priority.value}")
        return {"message": "Priority updated successfully", "new_priority": priority.value}

    @bulk_order_router.delete("/bulk-orders/{order_id}")
    async def delete_bulk_order(
        order_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Delete bulk order (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        result = await db.bulk_orders.delete_one({"id": order_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Bulk order not found")
        
        logger.info(f"Bulk order deleted: {order_id}")
        return {"message": "Bulk order deleted successfully"}

    @bulk_order_router.get("/bulk-orders/stats/summary")
    async def get_bulk_order_stats(credentials: HTTPAuthorizationCredentials = Security(security)):
        """Get bulk order statistics (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        # Count by status
        pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        status_counts = await db.bulk_orders.aggregate(pipeline).to_list(length=None)
        
        # Count by priority
        priority_pipeline = [
            {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        priority_counts = await db.bulk_orders.aggregate(priority_pipeline).to_list(length=None)
        
        # Total quoted amount
        amount_pipeline = [
            {"$match": {"quoted_amount": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": None, "total_quoted": {"$sum": "$quoted_amount"}, "avg_quoted": {"$avg": "$quoted_amount"}}}
        ]
        amount_stats = await db.bulk_orders.aggregate(amount_pipeline).to_list(length=1)
        
        # Recent orders (last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_count = await db.bulk_orders.count_documents({
            "created_at": {"$gte": thirty_days_ago.isoformat()}
        })
        
        return {
            "status_breakdown": {item["_id"]: item["count"] for item in status_counts},
            "priority_breakdown": {item["_id"]: item["count"] for item in priority_counts},
            "total_quoted_amount": amount_stats[0]["total_quoted"] if amount_stats else 0,
            "average_quoted_amount": amount_stats[0]["avg_quoted"] if amount_stats else 0,
            "recent_orders_30_days": recent_count
        }

    @bulk_order_router.get("/bulk-orders/export/csv")
    async def export_bulk_orders_csv(
        credentials: HTTPAuthorizationCredentials = Security(security),
        status: Optional[BulkOrderStatus] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ):
        """Export bulk orders to CSV (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        filter_query = {}
        if status:
            filter_query["status"] = status.value
        if start_date:
            filter_query["created_at"] = {"$gte": start_date.isoformat()}
        if end_date:
            if "created_at" in filter_query:
                filter_query["created_at"]["$lte"] = end_date.isoformat()
            else:
                filter_query["created_at"] = {"$lte": end_date.isoformat()}
        
        orders = await db.bulk_orders.find(filter_query).sort("created_at", -1).to_list(length=None)
        
        # Convert to CSV format (simplified - in production, use proper CSV library)
        csv_data = "ID,Company,Contact,Email,Phone,Status,Priority,Quoted Amount,Final Amount,Created At\n"
        for order in orders:
            csv_data += f"{order['id']},{order['company_name']},{order['contact_person']},{order['email']},{order['phone']},{order['status']},{order.get('priority', 'medium')},{order.get('quoted_amount', '')},{order.get('final_amount', '')},{order['created_at']}\n"
        
        return {"csv_data": csv_data, "total_records": len(orders)}

    return bulk_order_router