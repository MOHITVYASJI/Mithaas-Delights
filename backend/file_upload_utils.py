# file_upload_utils.py - File Upload Utilities
import os
import uuid
import base64
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Create uploads directory
UPLOAD_DIR = Path("/Mithaas Delights/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Create subdirectories
(UPLOAD_DIR / "media").mkdir(exist_ok=True)
(UPLOAD_DIR / "reviews").mkdir(exist_ok=True)
(UPLOAD_DIR / "products").mkdir(exist_ok=True)

def save_base64_image(base64_data: str, category: str = "media") -> Optional[str]:
    """
    Save base64 encoded image to disk
    Returns: URL path to the saved image or None if failed
    """
    try:
        # Remove data:image/...;base64, prefix if present
        if "base64," in base64_data:
            base64_data = base64_data.split("base64,")[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_data)
        
        # Generate unique filename
        filename = f"{uuid.uuid4().hex}.png"
        file_path = UPLOAD_DIR / category / filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(image_data)
        
        # Return relative URL path
        return f"/uploads/{category}/{filename}"
        
    except Exception as e:
        logger.error(f"Error saving base64 image: {str(e)}")
        return None

def save_uploaded_file(file_data: bytes, filename: str, category: str = "media") -> Optional[str]:
    """
    Save uploaded file to disk
    Returns: URL path to the saved file or None if failed
    """
    try:
        # Generate unique filename preserving extension
        ext = Path(filename).suffix
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = UPLOAD_DIR / category / unique_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_data)
        
        # Return relative URL path
        return f"/uploads/{category}/{unique_filename}"
        
    except Exception as e:
        logger.error(f"Error saving uploaded file: {str(e)}")
        return None

def delete_file(file_url: str) -> bool:
    """Delete file from disk given its URL path"""
    try:
        if file_url.startswith("/uploads/"):
            file_path = UPLOAD_DIR / file_url.replace("/uploads/", "")
            if file_path.exists():
                file_path.unlink()
                return True
        return False
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        return False

def get_file_size(file_url: str) -> Optional[int]:
    """Get file size in bytes"""
    try:
        if file_url.startswith("/uploads/"):
            file_path = UPLOAD_DIR / file_url.replace("/uploads/", "")
            if file_path.exists():
                return file_path.stat().st_size
        return None
    except Exception as e:
        logger.error(f"Error getting file size: {str(e)}")
        return None
