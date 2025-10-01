"""
Delivery calculation utilities using Haversine formula for distance calculation
Shop location: 22.738152, 75.831858 (Indore, Madhya Pradesh)
"""
import math
from typing import Tuple, Dict

# Shop location coordinates (Indore)
SHOP_LAT = 22.738152
SHOP_LON = 75.831858

# Delivery pricing configuration
FREE_DELIVERY_MIN_AMOUNT = 1500
FREE_DELIVERY_MAX_DISTANCE_KM = 10
BASE_DELIVERY_CHARGE_0_10KM = 50
BASE_DELIVERY_CHARGE_10_20KM = 100
BASE_DELIVERY_CHARGE_20_30KM = 150
BASE_DELIVERY_CHARGE_ABOVE_30KM = 200


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
    
    # Calculate delivery charge based on distance
    if distance <= 10:
        delivery_charge = BASE_DELIVERY_CHARGE_0_10KM if order_amount < FREE_DELIVERY_MIN_AMOUNT else 0
    elif distance <= 20:
        delivery_charge = BASE_DELIVERY_CHARGE_10_20KM
    elif distance <= 30:
        delivery_charge = BASE_DELIVERY_CHARGE_20_30KM
    else:
        delivery_charge = BASE_DELIVERY_CHARGE_ABOVE_30KM
    
    is_free = delivery_charge == 0
    
    return {
        "distance_km": distance,
        "delivery_charge": delivery_charge,
        "is_free_delivery": is_free,
        "delivery_type": "delivery",
        "message": f"Delivery to {distance}km - ₹{delivery_charge}" if not is_free else "Free delivery"
    }


async def geocode_address(pincode: str = None, address: str = None) -> Tuple[float, float]:
    """
    Geocode address using OpenStreetMap Nominatim API (free, rate-limited)
    
    Args:
        pincode: Indian PIN code
        address: Full address string
    
    Returns:
        Tuple of (latitude, longitude)
    
    Note: This is a placeholder. In production, implement actual geocoding with caching
    to respect Nominatim's rate limits (1 request/second)
    """
    # For demo purposes, return approximate coordinates based on pincode prefix
    # In production, use actual Nominatim API with proper rate limiting
    
    # This is a simplified demo - map common Indore pincodes
    pincode_map = {
        "452": (22.7196, 75.8577),  # Indore area
        "453": (22.7500, 75.8500),  # Indore nearby
        "400": (19.0760, 72.8777),  # Mumbai
        "110": (28.7041, 77.1025),  # Delhi
        "560": (12.9716, 77.5946),  # Bangalore
        "600": (13.0827, 80.2707),  # Chennai
    }
    
    if pincode:
        prefix = pincode[:3]
        if prefix in pincode_map:
            return pincode_map[prefix]
    
    # Default to Indore center if cannot geocode
    return (22.7196, 75.8577)