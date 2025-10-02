# theme_system.py - Multi-Theme Support System
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

# Theme Models
class ThemeColors(BaseModel):
    primary: str
    secondary: str
    accent: str
    background: str = "#ffffff"
    surface: str = "#f8fafc"
    text_primary: str = "#1f2937"
    text_secondary: str = "#6b7280"
    border: str = "#e5e7eb"
    success: str = "#10b981"
    warning: str = "#f59e0b"
    error: str = "#ef4444"
    info: str = "#3b82f6"

class ThemeConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    display_name: str
    description: Optional[str] = None
    colors: ThemeColors
    custom_css: Optional[str] = None
    festival_mode: bool = False
    festival_name: Optional[str] = None
    is_active: bool = False
    is_default: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ThemeCreateUpdate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    colors: ThemeColors
    custom_css: Optional[str] = None
    festival_mode: bool = False
    festival_name: Optional[str] = None

# Predefined Themes
DEFAULT_THEMES = {
    "orange_default": ThemeConfig(
        name="orange_default",
        display_name="Orange Default",
        description="Warm orange theme with traditional Indian sweet shop vibes",
        colors=ThemeColors(
            primary="#f97316",  # orange-500
            secondary="#f59e0b",  # amber-500
            accent="#ea580c",  # orange-600
            background="#ffffff",
            surface="#fff7ed",  # orange-50
            text_primary="#1f2937",
            text_secondary="#6b7280",
            border="#fed7aa"  # orange-200
        ),
        is_default=True
    ),
    
    "festival_diwali": ThemeConfig(
        name="festival_diwali",
        display_name="Diwali Festival",
        description="Rich red and gold theme for Diwali celebrations",
        colors=ThemeColors(
            primary="#dc2626",  # red-600
            secondary="#fbbf24",  # amber-400 (gold)
            accent="#b91c1c",  # red-700
            background="#ffffff",
            surface="#fef7f0",  # warm background
            text_primary="#1f2937",
            text_secondary="#6b7280",
            border="#fecaca"  # red-200
        ),
        festival_mode=True,
        festival_name="Diwali"
    ),
    
    "modern_blue": ThemeConfig(
        name="modern_blue",
        display_name="Modern Blue",
        description="Clean modern blue theme for contemporary look",
        colors=ThemeColors(
            primary="#3b82f6",  # blue-500
            secondary="#6366f1",  # indigo-500
            accent="#1d4ed8",  # blue-700
            background="#ffffff",
            surface="#f8fafc",  # slate-50
            text_primary="#0f172a",  # slate-900
            text_secondary="#475569",  # slate-600
            border="#cbd5e1"  # slate-300
        )
    ),
    
    "elegant_purple": ThemeConfig(
        name="elegant_purple",
        display_name="Elegant Purple",
        description="Sophisticated purple theme for premium feel",
        colors=ThemeColors(
            primary="#8b5cf6",  # violet-500
            secondary="#a855f7",  # purple-500
            accent="#7c3aed",  # violet-600
            background="#ffffff",
            surface="#faf5ff",  # purple-50
            text_primary="#1f2937",
            text_secondary="#6b7280",
            border="#c4b5fd"  # purple-300
        )
    ),
    
    "green_natural": ThemeConfig(
        name="green_natural",
        display_name="Natural Green",
        description="Fresh green theme inspired by nature",
        colors=ThemeColors(
            primary="#10b981",  # emerald-500
            secondary="#059669",  # emerald-600
            accent="#047857",  # emerald-700
            background="#ffffff",
            surface="#ecfdf5",  # emerald-50
            text_primary="#1f2937",
            text_secondary="#6b7280",
            border="#a7f3d0"  # emerald-200
        )
    )
}

class ThemeManager:
    def __init__(self, db):
        self.db = db
        self.themes_collection = db.themes
    
    async def initialize_default_themes(self) -> bool:
        """Initialize default themes in database"""
        try:
            for theme_key, theme_config in DEFAULT_THEMES.items():
                existing = await self.themes_collection.find_one({"name": theme_config.name})
                if not existing:
                    await self.themes_collection.insert_one(
                        self._prepare_for_mongo(theme_config.dict())
                    )
                    logger.info(f"Initialized theme: {theme_config.display_name}")
            
            # Ensure at least one theme is active
            active_theme = await self.themes_collection.find_one({"is_active": True})
            if not active_theme:
                await self.themes_collection.update_one(
                    {"name": "orange_default"},
                    {"$set": {"is_active": True}}
                )
            
            return True
        except Exception as e:
            logger.error(f"Error initializing default themes: {str(e)}")
            return False
    
    async def get_active_theme(self) -> ThemeConfig:
        """Get currently active theme"""
        theme = await self.themes_collection.find_one({"is_active": True})
        if not theme:
            # Return default theme
            return DEFAULT_THEMES["orange_default"]
        return ThemeConfig(**self._parse_from_mongo(theme))
    
    async def get_all_themes(self) -> List[ThemeConfig]:
        """Get all available themes"""
        themes = await self.themes_collection.find().to_list(length=None)
        return [ThemeConfig(**self._parse_from_mongo(theme)) for theme in themes]
    
    async def create_theme(self, theme_data: ThemeCreateUpdate) -> ThemeConfig:
        """Create a new custom theme"""
        # Check if theme name already exists
        existing = await self.themes_collection.find_one({"name": theme_data.name})
        if existing:
            raise ValueError(f"Theme with name '{theme_data.name}' already exists")
        
        theme = ThemeConfig(**theme_data.dict())
        await self.themes_collection.insert_one(
            self._prepare_for_mongo(theme.dict())
        )
        return theme
    
    async def update_theme(self, theme_id: str, theme_data: ThemeCreateUpdate) -> ThemeConfig:
        """Update an existing theme"""
        theme_dict = theme_data.dict()
        theme_dict["updated_at"] = datetime.now(timezone.utc)
        
        result = await self.themes_collection.update_one(
            {"id": theme_id},
            {"$set": self._prepare_for_mongo(theme_dict)}
        )
        
        if result.matched_count == 0:
            raise ValueError("Theme not found")
        
        updated_theme = await self.themes_collection.find_one({"id": theme_id})
        return ThemeConfig(**self._parse_from_mongo(updated_theme))
    
    async def activate_theme(self, theme_id: str) -> bool:
        """Activate a theme (deactivate all others)"""
        try:
            # Deactivate all themes
            await self.themes_collection.update_many(
                {},
                {"$set": {"is_active": False}}
            )
            
            # Activate selected theme
            result = await self.themes_collection.update_one(
                {"id": theme_id},
                {"$set": {"is_active": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            return result.matched_count > 0
        except Exception as e:
            logger.error(f"Error activating theme: {str(e)}")
            return False
    
    async def delete_theme(self, theme_id: str) -> bool:
        """Delete a custom theme (cannot delete default themes)"""
        theme = await self.themes_collection.find_one({"id": theme_id})
        if not theme:
            return False
        
        # Prevent deletion of default themes
        if theme.get("is_default", False):
            raise ValueError("Cannot delete default theme")
        
        # If deleting active theme, activate default
        if theme.get("is_active", False):
            await self.themes_collection.update_one(
                {"name": "orange_default"},
                {"$set": {"is_active": True}}
            )
        
        result = await self.themes_collection.delete_one({"id": theme_id})
        return result.deleted_count > 0
    
    def generate_css_variables(self, theme: ThemeConfig) -> str:
        """Generate CSS custom properties for theme"""
        css_vars = []
        colors = theme.colors.dict()
        
        for color_name, color_value in colors.items():
            css_var_name = f"--theme-{color_name.replace('_', '-')}"
            css_vars.append(f"{css_var_name}: {color_value};")
        
        css = ":root {\n  " + "\n  ".join(css_vars) + "\n}"
        
        # Add custom CSS if provided
        if theme.custom_css:
            css += "\n\n" + theme.custom_css
        
        return css
    
    def _prepare_for_mongo(self, data: dict) -> dict:
        """Prepare data for MongoDB storage"""
        if isinstance(data.get('created_at'), datetime):
            data['created_at'] = data['created_at'].isoformat()
        if isinstance(data.get('updated_at'), datetime):
            data['updated_at'] = data['updated_at'].isoformat()
        return data
    
    def _parse_from_mongo(self, item: dict) -> dict:
        """Parse MongoDB document back to Python objects"""
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if isinstance(item.get('updated_at'), str):
            item['updated_at'] = datetime.fromisoformat(item['updated_at'])
        return item
