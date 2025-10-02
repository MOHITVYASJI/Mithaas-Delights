"""
Delivery calculation utilities using Haversine formula for distance calculation
Shop location: 22.738152, 75.831858 (Indore, Madhya Pradesh)
Geocoding: Using OpenStreetMap Nominatim API (free service)
"""
import math
import requests
import time
from typing import Tuple, Dict, Optional

# Shop location coordinates (Indore)
SHOP_LAT = 22.738152
SHOP_LON = 75.831858

# Delivery pricing configuration (Admin can modify via settings)
FREE_DELIVERY_MIN_AMOUNT = 1500
FREE_DELIVERY_MAX_DISTANCE_KM = 10
PRICE_PER_KM_BEYOND_FREE = 19  # ₹19 per km beyond free delivery zone
MAX_DELIVERY_DISTANCE_KM = 50  # Currently limited to Indore city (expandable)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on earth (in kilometers)
    using the Haversine formula
    
    Args:
        lat1, lon1: Coordinates of first point
        lat2, lon2: Coordinates of second point
    
    Returns:
        Distance in kilometers
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
) -> Dict:
    """
    Calculate delivery charges based on distance and order amount
    
    Args:
        customer_lat: Customer's latitude
        customer_lon: Customer's longitude
        order_amount: Total order amount
        delivery_type: "delivery" or "pickup"
    
    Returns:
        Dictionary with distance, delivery_charge, and is_free_delivery
    """
    # If pickup, no delivery charge
    if delivery_type.lower() == "pickup":
        return {
            "distance_km": 0,
            "delivery_charge": 0,
            "is_free_delivery": True,
            "delivery_type": "pickup",
            "message": "Pickup from store - No delivery charge"
        }
    
    # Calculate distance from shop to customer
    distance = haversine_distance(SHOP_LAT, SHOP_LON, customer_lat, customer_lon)
    
    # Round to 2 decimal places
    distance = round(distance, 2)
    
    # Check if eligible for free delivery
    if order_amount >= FREE_DELIVERY_MIN_AMOUNT and distance <= FREE_DELIVERY_MAX_DISTANCE_KM:
        return {
            "distance_km": distance,
            "delivery_charge": 0,
            "is_free_delivery": True,
            "delivery_type": "delivery",
            "message": f"Free delivery (Order ≥ ₹{FREE_DELIVERY_MIN_AMOUNT} & Distance ≤ {FREE_DELIVERY_MAX_DISTANCE_KM}km)"
        }
    
    # Check if distance exceeds maximum delivery range
    if distance > MAX_DELIVERY_DISTANCE_KM:
        return {
            "distance_km": distance,
            "delivery_charge": 0,
            "is_free_delivery": False,
            "delivery_type": "delivery",
            "error": f"Sorry, we currently deliver only within {MAX_DELIVERY_DISTANCE_KM}km (Indore city area)",
            "message": "Out of delivery range"
        }
    
    # Calculate delivery charge: ₹19 per km beyond free delivery zone
    if distance <= FREE_DELIVERY_MAX_DISTANCE_KM:
        # Within free delivery zone but amount is less than minimum
        delivery_charge = PRICE_PER_KM_BEYOND_FREE * distance
    else:
        # Beyond free delivery zone
        delivery_charge = PRICE_PER_KM_BEYOND_FREE * distance
    
    # Round delivery charge
    delivery_charge = round(delivery_charge, 2)
    
    return {
        "distance_km": distance,
        "delivery_charge": delivery_charge,
        "is_free_delivery": False,
        "delivery_type": "delivery",
        "message": f"Delivery to {distance}km - ₹{delivery_charge}"
    }


async def geocode_address(pincode: str = None, address: str = None) -> Optional[Tuple[float, float]]:
    """
    Geocode address using OpenStreetMap Nominatim API (free service)
    Respects rate limits: max 1 request per second
    
    Args:
        pincode: Indian PIN code
        address: Full address string
    
    Returns:
        Tuple of (latitude, longitude) or None if geocoding fails
    """
    try:
        # Build query for Nominatim
        query_parts = []
        if address:
            query_parts.append(address)
        if pincode:
            query_parts.append(pincode)
        query_parts.append("India")  # Limit to India
        
        query = ", ".join(query_parts)
        
        # Nominatim API endpoint
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": query,
            "format": "json",
            "limit": 1
        }
        headers = {
            "User-Agent": "Mithaas-Delights-App/1.0"  # Required by Nominatim
        }
        
        # Make request (with timeout)
        response = requests.get(url, params=params, headers=headers, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                
                # Respect Nominatim rate limit (1 request/second)
                time.sleep(1)
                
                return (lat, lon)
        
        # If API fails, fall back to pincode map
        return fallback_geocode(pincode)
        
    except Exception as e:
        print(f"Geocoding error: {e}")
        return fallback_geocode(pincode)


def fallback_geocode(pincode: str = None) -> Tuple[float, float]:
    """
    Fallback geocoding using known pincode prefixes for Indore and nearby areas
    """
    pincode_map = {
        "452": (22.7196, 75.8577),   # Indore area
        "453": (22.7500, 75.8500),   # Indore nearby
        "454": (22.6800, 75.9000),   # Indore outskirts
    }
    
    if pincode and len(pincode) >= 3:
        prefix = pincode[:3]
        if prefix in pincode_map:
            return pincode_map[prefix]
    
    # Default to Indore center
    return (22.7196, 75.8577)