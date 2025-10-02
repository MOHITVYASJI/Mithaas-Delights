"""
Integration script to add enhanced features to the main server.py
Run this to integrate all enhanced systems with the existing server
"""

import sys
import os

# Add the backend directory to Python path
sys.path.append('/app/backend')

def integrate_enhanced_features():
    """Integrate enhanced features with main server"""
    
    try:
        # Import the main server
        import server
        from enhanced_server import setup_enhanced_routes
        
        # Setup enhanced routes with the existing app and database
        setup_enhanced_routes(server.app, server.db)
        
        print("✅ Enhanced features successfully integrated with main server!")
        print("🚀 Available new endpoints:")
        print("   - /api/notifications/* - Notification system")
        print("   - /api/advertisements/* - Advertisement management")
        print("   - /api/media-gallery/* - Media gallery")
        print("   - /api/reviews/enhanced - Enhanced reviews")
        print("   - /api/cart/sync - Cart synchronization")
        print("   - /api/banners/enhanced - Enhanced banners")
        print("   - /api/bulk-orders/* - Bulk order management")
        
        return True
        
    except Exception as e:
        print(f"❌ Error integrating enhanced features: {str(e)}")
        return False

if __name__ == "__main__":
    success = integrate_enhanced_features()
    if success:
        print("\n🎉 Integration completed successfully!")
        print("You can now start the server with: uvicorn server:app --reload")
    else:
        print("\n💥 Integration failed. Please check the error messages above.")
        sys.exit(1)