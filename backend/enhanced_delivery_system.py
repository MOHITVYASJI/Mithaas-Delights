# enhanced_delivery_system.py - Enhanced Delivery Calculation with Distance-based Logic
import math
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Shop location coordinates (Indore, MP)
SHOP_LATITUDE = 22.738152
SHOP_LONGITUDE = 75.831858

# Delivery configuration
class DeliveryConfig:
    FREE_DELIVERY_THRESHOLD = 1500.0  # Free delivery for orders >= ₹1500
    FREE_DELIVERY_DISTANCE_KM = 10.0  # Free delivery within 10km for qualifying orders
    BASE_DELIVERY_CHARGE = 50.0  # Base charge for nearby delivery
    DISTANCE_MULTIPLIER = 5.0  # Additional charge per km beyond base distance
    MAX_DELIVERY_DISTANCE_KM = 50.0  # Maximum delivery distance
    BASE_DISTANCE_KM = 5.0  # Base distance included in base charge

def calculate_distance_haversine(
    lat1: float, lon1: float, 
    lat2: float, lon2: float
) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in kilometers
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r

def calculate_delivery_charge(
    customer_lat: float,
    customer_lon: float,
    order_amount: float,
    delivery_type: str = "delivery"
) -> Dict[str, any]:
    """
    Calculate delivery charge based on distance and order amount
    
    Returns:
        dict: {
            'delivery_charge': float,
            'distance_km': float,
            'is_free_delivery': bool,
            'delivery_time_estimate': str,
            'delivery_zones': str
        }
    """
    
    # If pickup, no delivery charge
    if delivery_type.lower() == "pickup":
        return {
            'delivery_charge': 0.0,
            'distance_km': 0.0,
            'is_free_delivery': True,
            'delivery_time_estimate': 'Ready for pickup in 2-4 hours',
            'delivery_zone': 'pickup'
        }
    
    # Calculate distance
    distance_km = calculate_distance_haversine(
        SHOP_LATITUDE, SHOP_LONGITUDE,
        customer_lat, customer_lon
    )
    
    # Round to 2 decimal places
    distance_km = round(distance_km, 2)
    
    # Check if delivery is possible
    if distance_km > DeliveryConfig.MAX_DELIVERY_DISTANCE_KM:
        return {
            'delivery_charge': None,
            'distance_km': distance_km,
            'is_free_delivery': False,
            'delivery_time_estimate': 'Delivery not available',
            'delivery_zone': 'out_of_range',
            'error': f'Delivery not available beyond {DeliveryConfig.MAX_DELIVERY_DISTANCE_KM}km'
        }
    
    # Determine delivery zone and time estimate
    if distance_km <= 5:
        delivery_zone = 'city_center'
        delivery_time = '2-4 hours'
    elif distance_km <= 10:
        delivery_zone = 'city_extended'
        delivery_time = '4-6 hours'
    elif distance_km <= 20:
        delivery_zone = 'nearby_suburbs'
        delivery_time = '6-8 hours'
    elif distance_km <= 35:
        delivery_zone = 'extended_area'
        delivery_time = '1-2 days'
    else:
        delivery_zone = 'far_area'
        delivery_time = '2-3 days'
    
    # Calculate base delivery charge
    if distance_km <= DeliveryConfig.BASE_DISTANCE_KM:
        # Within base distance
        delivery_charge = DeliveryConfig.BASE_DELIVERY_CHARGE
    else:
        # Beyond base distance
        extra_distance = distance_km - DeliveryConfig.BASE_DISTANCE_KM
        delivery_charge = DeliveryConfig.BASE_DELIVERY_CHARGE + (extra_distance * DeliveryConfig.DISTANCE_MULTIPLIER)
    
    # Apply free delivery logic
    is_free_delivery = False
    if (order_amount >= DeliveryConfig.FREE_DELIVERY_THRESHOLD and 
        distance_km <= DeliveryConfig.FREE_DELIVERY_DISTANCE_KM):
        delivery_charge = 0.0
        is_free_delivery = True
    
    # Round to 2 decimal places
    delivery_charge = round(delivery_charge, 2)
    
    return {
        'delivery_charge': delivery_charge,
        'distance_km': distance_km,
        'is_free_delivery': is_free_delivery,
        'delivery_time_estimate': delivery_time,
        'delivery_zone': delivery_zone,
        'free_delivery_eligible': order_amount >= DeliveryConfig.FREE_DELIVERY_THRESHOLD,
        'free_delivery_distance_eligible': distance_km <= DeliveryConfig.FREE_DELIVERY_DISTANCE_KM
    }

def get_coordinates_from_address(address: str) -> Optional[Tuple[float, float]]:
    """
    Get coordinates from address using a simple geocoding approach
    In production, you would use Google Maps API or similar
    
    For now, return some predefined coordinates for common areas in Indore
    """
    # Predefined coordinates for common areas (this is a fallback)
    area_coordinates = {
        'indore': (22.7196, 75.8577),
        'bhopal': (23.2599, 77.4126),
        'mumbai': (19.0760, 72.8777),
        'delhi': (28.7041, 77.1025),
        'pune': (18.5204, 73.8567),
        'bangalore': (12.9716, 77.5946),
        'hyderabad': (17.3850, 78.4867),
        'chennai': (13.0827, 80.2707),
        'kolkata': (22.5726, 88.3639),
        'ahmedabad': (23.0225, 72.5714)
    }
    
    address_lower = address.lower()
    
    # Check for city names in address
    for city, coords in area_coordinates.items():
        if city in address_lower:
            return coords
    
    # If no match found, return None
    return None

def estimate_delivery_cost_range(distance_km: float) -> Dict[str, float]:
    """
    Estimate delivery cost range for a given distance
    Useful for frontend display before exact calculation
    """
    if distance_km <= DeliveryConfig.BASE_DISTANCE_KM:
        min_cost = DeliveryConfig.BASE_DELIVERY_CHARGE
        max_cost = DeliveryConfig.BASE_DELIVERY_CHARGE
    else:
        extra_distance = distance_km - DeliveryConfig.BASE_DISTANCE_KM
        base_cost = DeliveryConfig.BASE_DELIVERY_CHARGE + (extra_distance * DeliveryConfig.DISTANCE_MULTIPLIER)
        min_cost = base_cost * 0.8  # 20% variation
        max_cost = base_cost * 1.2
    
    return {
        'min_cost': round(min_cost, 2),
        'max_cost': round(max_cost, 2),
        'estimated_cost': round((min_cost + max_cost) / 2, 2)
    }

def get_delivery_policy_info() -> Dict[str, any]:
    """
    Get delivery policy information for frontend display
    """
    return {
        'free_delivery_threshold': DeliveryConfig.FREE_DELIVERY_THRESHOLD,
        'free_delivery_distance_km': DeliveryConfig.FREE_DELIVERY_DISTANCE_KM,
        'base_delivery_charge': DeliveryConfig.BASE_DELIVERY_CHARGE,
        'max_delivery_distance_km': DeliveryConfig.MAX_DELIVERY_DISTANCE_KM,
        'distance_multiplier': DeliveryConfig.DISTANCE_MULTIPLIER,
        'base_distance_km': DeliveryConfig.BASE_DISTANCE_KM,
        'shop_location': {
            'latitude': SHOP_LATITUDE,
            'longitude': SHOP_LONGITUDE,
            'address': '64, Kaveri Nagar, Indore, Madhya Pradesh 452006, India'
        }
    }

class DeliveryCalculator:
    """
    Enhanced delivery calculator with caching and validation
    """
    
    def __init__(self):
        self.cache = {}  # Simple in-memory cache
    
    def calculate_with_caching(
        self, 
        customer_lat: float, 
        customer_lon: float, 
        order_amount: float,
        delivery_type: str = "delivery"
    ) -> Dict[str, any]:
        """
        Calculate delivery charge with caching for performance
        """
        # Create cache key
        cache_key = f"{customer_lat:.4f}_{customer_lon:.4f}_{order_amount}_{delivery_type}"
        
        # Check cache
        if cache_key in self.cache:
            cached_result = self.cache[cache_key].copy()
            cached_result['cached'] = True
            return cached_result
        
        # Calculate and cache result
        result = calculate_delivery_charge(
            customer_lat, customer_lon, order_amount, delivery_type
        )
        
        self.cache[cache_key] = result.copy()
        result['cached'] = False
        
        return result
    
    def validate_coordinates(self, lat: float, lon: float) -> bool:
        """
        Validate latitude and longitude coordinates
        """
        return -90 <= lat <= 90 and -180 <= lon <= 180
    
    def clear_cache(self):
        """
        Clear delivery calculation cache
        """
        self.cache.clear()

# Global delivery calculator instance
delivery_calculator = DeliveryCalculator()
