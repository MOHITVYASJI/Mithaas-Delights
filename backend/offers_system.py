# offers_system.py - Advanced Offers and Promotions System
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

class OfferType:
    """Offer types for advanced promotions"""
    PERCENTAGE = "percentage"
    FLAT_DISCOUNT = "flat_discount"
    BUY_X_GET_Y = "buy_x_get_y"  # Buy X get Y free
    BUY_X_GET_Y_DISCOUNT = "buy_x_get_y_discount"  # Buy X get Y at discount
    FREE_SHIPPING = "free_shipping"
    BUNDLE = "bundle"  # Buy multiple products as bundle
    TIERED = "tiered"  # Different discounts based on quantity/amount
    COMBO = "combo"  # Buy 2 X get 1 Y free

class Offer(BaseModel):
    """Advanced offer model supporting multiple offer types"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    offer_type: str = OfferType.PERCENTAGE
    
    # Basic discount fields
    discount_percentage: Optional[int] = Field(None, ge=1, le=100)
    discount_amount: Optional[float] = None
    max_discount: Optional[float] = None
    
    # Buy X Get Y fields
    buy_quantity: Optional[int] = None  # Buy X items
    get_quantity: Optional[int] = None  # Get Y items
    get_discount_percentage: Optional[int] = None  # Discount on Y items
    
    # Product targeting
    applicable_product_ids: List[str] = []  # Products this offer applies to
    get_product_ids: List[str] = []  # For Buy X Get Y (empty = same as buy products)
    category_names: List[str] = []  # Category-wide offers
    
    # Conditions
    min_purchase_amount: float = 0
    min_quantity: int = 1
    
    # Validity
    is_active: bool = True
    start_date: datetime
    end_date: datetime
    
    # Usage limits
    usage_limit: Optional[int] = None
    per_user_limit: Optional[int] = 1
    used_count: int = 0
    
    # Additional settings
    stackable: bool = True  # Can be combined with other offers
    auto_apply: bool = True  # Automatically apply if conditions met
    badge_text: Optional[str] = None  # Display badge on product card
    badge_color: Optional[str] = "#f97316"  # Badge background color
    priority: int = 0  # Higher priority offers are applied first
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OfferCreate(BaseModel):
    """Create offer model"""
    name: str
    description: str
    offer_type: str = OfferType.PERCENTAGE
    discount_percentage: Optional[int] = None
    discount_amount: Optional[float] = None
    max_discount: Optional[float] = None
    buy_quantity: Optional[int] = None
    get_quantity: Optional[int] = None
    get_discount_percentage: Optional[int] = None
    applicable_product_ids: List[str] = []
    get_product_ids: List[str] = []
    category_names: List[str] = []
    min_purchase_amount: float = 0
    min_quantity: int = 1
    is_active: bool = True
    start_date: datetime
    end_date: datetime
    usage_limit: Optional[int] = None
    per_user_limit: Optional[int] = 1
    stackable: bool = True
    auto_apply: bool = True
    badge_text: Optional[str] = None
    badge_color: Optional[str] = "#f97316"
    priority: int = 0

class OfferUpdate(BaseModel):
    """Update offer model"""
    name: Optional[str] = None
    description: Optional[str] = None
    discount_percentage: Optional[int] = None
    discount_amount: Optional[float] = None
    max_discount: Optional[float] = None
    buy_quantity: Optional[int] = None
    get_quantity: Optional[int] = None
    get_discount_percentage: Optional[int] = None
    applicable_product_ids: Optional[List[str]] = None
    get_product_ids: Optional[List[str]] = None
    category_names: Optional[List[str]] = None
    min_purchase_amount: Optional[float] = None
    min_quantity: Optional[int] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    usage_limit: Optional[int] = None
    per_user_limit: Optional[int] = None
    stackable: Optional[bool] = None
    auto_apply: Optional[bool] = None
    badge_text: Optional[str] = None
    badge_color: Optional[str] = None
    priority: Optional[int] = None

class OfferManager:
    """Manager class for handling offer operations"""
    
    def __init__(self, db):
        self.db = db
        self.offers = db.offers
        self.offer_usage = db.offer_usage
    
    async def create_offer(self, offer_data: OfferCreate) -> Offer:
        """Create a new offer"""
        offer = Offer(**offer_data.dict())
        await self.offers.insert_one(self._prepare_for_mongo(offer.dict()))
        return offer
    
    async def get_active_offers(
        self, 
        product_id: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[Offer]:
        """Get all active offers, optionally filtered by product or category"""
        filter_query = {
            "is_active": True,
            "start_date": {"$lte": datetime.now(timezone.utc).isoformat()},
            "end_date": {"$gte": datetime.now(timezone.utc).isoformat()}
        }
        
        # Filter by product or category
        if product_id or category:
            or_conditions = []
            # Include global offers (empty arrays for both product and category targeting)
            or_conditions.append({
                "$and": [
                    {"applicable_product_ids": {"$size": 0}},
                    {"category_names": {"$size": 0}}
                ]
            })
            
            if product_id:
                or_conditions.append({"applicable_product_ids": product_id})
            if category:
                or_conditions.append({"category_names": category})
            
            if or_conditions:
                filter_query["$or"] = or_conditions
        
        offers = await self.offers.find(filter_query).sort("priority", -1).to_list(length=None)
        return [Offer(**self._parse_from_mongo(offer)) for offer in offers]
    
    async def get_all_offers(self, active_only: bool = False) -> List[Offer]:
        """Get all offers"""
        filter_query = {}
        if active_only:
            now = datetime.now(timezone.utc).isoformat()
            filter_query = {
                "is_active": True,
                "start_date": {"$lte": now},
                "end_date": {"$gte": now}
            }
        
        offers = await self.offers.find(filter_query).sort([("priority", -1), ("created_at", -1)]).to_list(length=None)
        return [Offer(**self._parse_from_mongo(offer)) for offer in offers]
    
    async def get_offer_by_id(self, offer_id: str) -> Optional[Offer]:
        """Get offer by ID"""
        offer = await self.offers.find_one({"id": offer_id})
        if offer:
            return Offer(**self._parse_from_mongo(offer))
        return None
    
    async def update_offer(self, offer_id: str, offer_data: OfferUpdate) -> Offer:
        """Update an offer"""
        update_dict = {k: v for k, v in offer_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        result = await self.offers.update_one(
            {"id": offer_id},
            {"$set": self._prepare_for_mongo(update_dict)}
        )
        
        if result.matched_count == 0:
            raise ValueError("Offer not found")
        
        updated_offer = await self.offers.find_one({"id": offer_id})
        return Offer(**self._parse_from_mongo(updated_offer))
    
    async def delete_offer(self, offer_id: str) -> bool:
        """Delete an offer"""
        result = await self.offers.delete_one({"id": offer_id})
        return result.deleted_count > 0
    
    async def apply_offers_to_cart(
        self, 
        cart_items: List[Dict[str, Any]], 
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Apply all eligible offers to cart items
        Returns: {
            'items': [...],  # cart items with applied offers
            'total_discount': float,
            'applied_offers': [...]  # list of applied offer details
        }
        """
        # Get all active offers
        offers = await self.get_all_offers(active_only=True)
        
        applied_offers = []
        total_discount = 0
        items_with_offers = []
        
        for item in cart_items:
            item_discount = 0
            item_offers = []
            
            # Find applicable offers for this item
            for offer in offers:
                # Check if offer is applicable to this product
                is_applicable = False
                
                if item.get("id") in offer.applicable_product_ids:
                    is_applicable = True
                elif item.get("category") in offer.category_names:
                    is_applicable = True
                elif not offer.applicable_product_ids and not offer.category_names:
                    # Global offer
                    is_applicable = True
                
                if not is_applicable:
                    continue
                
                # Check if offer is stackable
                if not offer.stackable and item_offers:
                    continue
                
                # Calculate discount based on offer type
                discount = await self._calculate_offer_discount(offer, item)
                
                if discount > 0:
                    item_discount += discount
                    item_offers.append({
                        "offer_id": offer.id,
                        "offer_name": offer.name,
                        "discount": discount,
                        "badge_text": offer.badge_text
                    })
                    
                    if offer.id not in [o["offer_id"] for o in applied_offers]:
                        applied_offers.append({
                            "offer_id": offer.id,
                            "offer_name": offer.name,
                            "offer_type": offer.offer_type
                        })
            
            # Add item with calculated discounts
            item_copy = item.copy()
            item_copy["offer_discount"] = item_discount
            item_copy["applied_offers"] = item_offers
            item_copy["final_price"] = max(0, item.get("price", 0) - item_discount)
            items_with_offers.append(item_copy)
            
            total_discount += item_discount
        
        return {
            "items": items_with_offers,
            "total_discount": total_discount,
            "applied_offers": applied_offers
        }
    
    async def _calculate_offer_discount(
        self, 
        offer: Offer, 
        cart_item: Dict[str, Any]
    ) -> float:
        """Calculate discount for a single cart item based on offer"""
        item_price = cart_item.get("price", 0)
        item_quantity = cart_item.get("quantity", 1)
        
        if offer.offer_type == OfferType.PERCENTAGE:
            discount = (item_price * offer.discount_percentage / 100) * item_quantity
            if offer.max_discount:
                discount = min(discount, offer.max_discount)
            return discount
        
        elif offer.offer_type == OfferType.FLAT_DISCOUNT:
            discount = offer.discount_amount * item_quantity
            return min(discount, item_price * item_quantity)
        
        elif offer.offer_type == OfferType.BUY_X_GET_Y:
            # Buy X get Y free logic
            if item_quantity >= offer.buy_quantity:
                free_items = (item_quantity // offer.buy_quantity) * offer.get_quantity
                return min(free_items * item_price, item_price * item_quantity)
        
        return 0
    
    async def record_offer_usage(self, offer_id: str, user_id: Optional[str] = None):
        """Record offer usage"""
        # Increment offer usage count
        await self.offers.update_one(
            {"id": offer_id},
            {"$inc": {"used_count": 1}}
        )
        
        # Record user-specific usage if user_id provided
        if user_id:
            usage_record = {
                "id": str(uuid.uuid4()),
                "offer_id": offer_id,
                "user_id": user_id,
                "used_at": datetime.now(timezone.utc).isoformat()
            }
            await self.offer_usage.insert_one(usage_record)
    
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
