"""
Enhanced Review System for Mithaas Delights API
Handles reviews with photo uploads, approval workflow, and rating management
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
review_router = APIRouter(prefix="/api", tags=["reviews"])

# ==================== MODELS ====================

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_id: str
    user_name: str
    rating: int = Field(ge=1, le=5)
    comment: str
    images: List[str] = []  # Photo URLs
    is_approved: bool = False  # Admin approval required
    is_featured: bool = False  # Featured review
    helpful_count: int = 0  # Number of users who found it helpful
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    product_id: str
    user_id: str
    user_name: str
    rating: int = Field(ge=1, le=5)
    comment: str
    images: List[str] = []  # Photo URLs

class ReviewCreateEnhanced(BaseModel):
    product_id: str
    user_id: str
    user_name: str
    rating: int = Field(ge=1, le=5)
    comment: str
    images: List[str] = []  # Photo URLs
    base64_images: List[str] = []  # Base64 encoded images

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None
    is_approved: Optional[bool] = None
    is_featured: Optional[bool] = None

class ReviewResponse(BaseModel):
    id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    images: List[str]
    is_approved: bool
    is_featured: bool
    helpful_count: int
    created_at: datetime
    updated_at: datetime

# ==================== HELPER FUNCTIONS ====================

def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('updated_at'), datetime):
        data['updated_at'] = data['updated_at'].isoformat()
    return data

def parse_from_mongo(item):
    """Parse MongoDB document back to Python objects"""
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    return item

def save_base64_image(base64_data: str, folder: str = "reviews") -> Optional[str]:
    """Save base64 encoded image to file system"""
    try:
        import base64
        import os
        
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

# ==================== REVIEW ENDPOINTS ====================

def setup_review_routes(db: AsyncIOMotorDatabase, get_current_user, get_current_admin_user):
    """Setup review routes with database and auth dependencies"""
    
    @review_router.post("/reviews", response_model=Review)
    async def create_review(
        review: ReviewCreate,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Create a new review"""
        current_user = await get_current_user(credentials, db)
        
        # Verify product exists
        product = await db.products.find_one({"id": review.product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if user already reviewed this product
        existing_review = await db.reviews.find_one({
            "product_id": review.product_id,
            "user_id": current_user["id"]
        })
        if existing_review:
            raise HTTPException(status_code=400, detail="You have already reviewed this product")
        
        review_dict = review.dict()
        review_dict["user_id"] = current_user["id"]
        review_obj = Review(**review_dict)
        await db.reviews.insert_one(prepare_for_mongo(review_obj.dict()))
        
        # Update product rating
        await update_product_rating(db, review.product_id)
        
        logger.info(f"Review created for product {review.product_id} by user {current_user['id']}")
        return review_obj

    @review_router.post("/reviews/enhanced", response_model=Review)
    async def create_review_with_photos(
        review: ReviewCreateEnhanced,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Create review with photo attachments"""
        current_user = await get_current_user(credentials, db)
        
        # Verify product exists
        product = await db.products.find_one({"id": review.product_id})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check if user already reviewed this product
        existing_review = await db.reviews.find_one({
            "product_id": review.product_id,
            "user_id": current_user["id"]
        })
        if existing_review:
            raise HTTPException(status_code=400, detail="You have already reviewed this product")
        
        # Process base64 images
        image_urls = list(review.images)
        if review.base64_images:
            for base64_data in review.base64_images:
                saved_url = save_base64_image(base64_data, "reviews")
                if saved_url:
                    image_urls.append(saved_url)
        
        review_dict = review.dict(exclude={"base64_images"})
        review_dict["user_id"] = current_user["id"]
        review_dict["images"] = image_urls
        review_obj = Review(**review_dict)
        await db.reviews.insert_one(prepare_for_mongo(review_obj.dict()))
        
        # Update product rating
        await update_product_rating(db, review.product_id)
        
        logger.info(f"Enhanced review created for product {review.product_id} by user {current_user['id']}")
        return review_obj

    @review_router.get("/reviews/{product_id}", response_model=List[ReviewResponse])
    async def get_product_reviews(
        product_id: str, 
        include_pending: bool = False,
        featured_only: bool = False,
        limit: int = 50
    ):
        """Get reviews for a product"""
        filter_query = {"product_id": product_id}
        
        # Only show approved reviews to regular users
        if not include_pending:
            filter_query["is_approved"] = True
        
        if featured_only:
            filter_query["is_featured"] = True
        
        reviews = await db.reviews.find(filter_query).sort("created_at", -1).limit(limit).to_list(length=limit)
        return [ReviewResponse(**parse_from_mongo(review)) for review in reviews]

    @review_router.get("/reviews", response_model=List[ReviewResponse])
    async def get_all_reviews(
        credentials: HTTPAuthorizationCredentials = Security(security),
        approved_only: bool = False,
        limit: int = 100
    ):
        """Get all reviews (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        filter_query = {}
        if approved_only:
            filter_query["is_approved"] = True
        
        reviews = await db.reviews.find(filter_query).sort("created_at", -1).limit(limit).to_list(length=limit)
        return [ReviewResponse(**parse_from_mongo(review)) for review in reviews]

    @review_router.put("/reviews/{review_id}/approve")
    async def approve_review(
        review_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Approve a review (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        result = await db.reviews.update_one(
            {"id": review_id},
            {"$set": {
                "is_approved": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Review not found")
        
        # Update product rating after approval
        review = await db.reviews.find_one({"id": review_id})
        if review:
            await update_product_rating(db, review["product_id"])
        
        logger.info(f"Review approved: {review_id}")
        return {"message": "Review approved"}

    @review_router.put("/reviews/{review_id}/feature")
    async def feature_review(
        review_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Feature/unfeature a review (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        # Get current status
        review = await db.reviews.find_one({"id": review_id})
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        new_featured_status = not review.get("is_featured", False)
        
        result = await db.reviews.update_one(
            {"id": review_id},
            {"$set": {
                "is_featured": new_featured_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Review {review_id} featured status changed to: {new_featured_status}")
        return {"message": f"Review {'featured' if new_featured_status else 'unfeatured'} successfully"}

    @review_router.put("/reviews/{review_id}")
    async def update_review(
        review_id: str,
        review_update: ReviewUpdate,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Update a review (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        # Get current review
        review = await db.reviews.find_one({"id": review_id})
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        # Build update dict
        update_dict = {k: v for k, v in review_update.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.now(timezone.utc)
        
        if update_dict:
            await db.reviews.update_one(
                {"id": review_id},
                {"$set": prepare_for_mongo(update_dict)}
            )
            
            # Recalculate product rating if rating changed or approval status changed
            if "rating" in update_dict or "is_approved" in update_dict:
                await update_product_rating(db, review["product_id"])
        
        updated_review = await db.reviews.find_one({"id": review_id})
        logger.info(f"Review updated: {review_id}")
        return ReviewResponse(**parse_from_mongo(updated_review))

    @review_router.delete("/reviews/{review_id}")
    async def delete_review(
        review_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Delete a review (Admin only)"""
        await get_current_admin_user(credentials, db)
        
        # Get review to update product rating after deletion
        review = await db.reviews.find_one({"id": review_id})
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        result = await db.reviews.delete_one({"id": review_id})
        
        # Update product rating after deletion
        await update_product_rating(db, review["product_id"])
        
        logger.info(f"Review deleted: {review_id}")
        return {"message": "Review deleted successfully"}

    @review_router.put("/reviews/{review_id}/helpful")
    async def mark_review_helpful(
        review_id: str,
        credentials: HTTPAuthorizationCredentials = Security(security)
    ):
        """Mark review as helpful"""
        current_user = await get_current_user(credentials, db)
        
        # Check if user already marked this review as helpful
        helpful_record = await db.review_helpful.find_one({
            "review_id": review_id,
            "user_id": current_user["id"]
        })
        
        if helpful_record:
            raise HTTPException(status_code=400, detail="You have already marked this review as helpful")
        
        # Add helpful record
        await db.review_helpful.insert_one({
            "id": str(uuid.uuid4()),
            "review_id": review_id,
            "user_id": current_user["id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Increment helpful count
        result = await db.reviews.update_one(
            {"id": review_id},
            {"$inc": {"helpful_count": 1}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Review not found")
        
        return {"message": "Review marked as helpful"}

    @review_router.get("/reviews/user/my-reviews", response_model=List[ReviewResponse])
    async def get_my_reviews(credentials: HTTPAuthorizationCredentials = Security(security)):
        """Get current user's reviews"""
        current_user = await get_current_user(credentials, db)
        
        reviews = await db.reviews.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(length=None)
        return [ReviewResponse(**parse_from_mongo(review)) for review in reviews]

    async def update_product_rating(db: AsyncIOMotorDatabase, product_id: str):
        """Update product rating based on approved reviews"""
        reviews = await db.reviews.find({"product_id": product_id, "is_approved": True}).to_list(length=None)
        if reviews:
            avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
            await db.products.update_one(
                {"id": product_id},
                {"$set": {"rating": round(avg_rating, 1), "review_count": len(reviews)}}
            )
        else:
            await db.products.update_one(
                {"id": product_id},
                {"$set": {"rating": 0, "review_count": 0}}
            )

    return review_router