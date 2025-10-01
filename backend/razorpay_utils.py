"""
Razorpay integration utilities
"""
import os
import hmac
import hashlib
from typing import Dict, Optional
import razorpay
from fastapi import HTTPException

# Initialize Razorpay client
def get_razorpay_client():
    """Get Razorpay client instance"""
    key_id = os.environ.get('RAZORPAY_KEY_ID')
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET')
    
    if not key_id or not key_secret:
        raise HTTPException(status_code=500, detail="Razorpay credentials not configured")
    
    return razorpay.Client(auth=(key_id, key_secret))


def create_razorpay_order(amount: float, currency: str = "INR", receipt: str = None) -> Dict:
    """
    Create a Razorpay order
    
    Args:
        amount: Amount in rupees (will be converted to paise)
        currency: Currency code (default INR)
        receipt: Order receipt ID
    
    Returns:
        Razorpay order data
    """
    try:
        client = get_razorpay_client()
        
        # Convert amount to paise (smallest currency unit)
        amount_paise = int(amount * 100)
        
        order_data = {
            "amount": amount_paise,
            "currency": currency,
            "receipt": receipt or f"order_{int(amount)}",
            "payment_capture": 1  # Auto capture
        }
        
        order = client.order.create(data=order_data)
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Razorpay order: {str(e)}")


def verify_razorpay_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
) -> bool:
    """
    Verify Razorpay payment signature
    
    Args:
        razorpay_order_id: Order ID from Razorpay
        razorpay_payment_id: Payment ID from Razorpay
        razorpay_signature: Signature to verify
    
    Returns:
        True if signature is valid, False otherwise
    """
    try:
        key_secret = os.environ.get('RAZORPAY_KEY_SECRET')
        if not key_secret:
            return False
        
        # Create signature string
        message = f"{razorpay_order_id}|{razorpay_payment_id}"
        
        # Generate signature
        generated_signature = hmac.new(
            key_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures
        return hmac.compare_digest(generated_signature, razorpay_signature)
    except Exception as e:
        print(f"Signature verification error: {str(e)}")
        return False


def create_refund(payment_id: str, amount: Optional[float] = None) -> Dict:
    """
    Create a refund for a payment
    
    Args:
        payment_id: Razorpay payment ID
        amount: Refund amount in rupees (if None, full refund)
    
    Returns:
        Refund data
    """
    try:
        client = get_razorpay_client()
        
        refund_data = {}
        if amount:
            refund_data["amount"] = int(amount * 100)  # Convert to paise
        
        refund = client.payment.refund(payment_id, refund_data)
        return refund
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create refund: {str(e)}")