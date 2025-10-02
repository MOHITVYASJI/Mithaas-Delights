/**
 * Razorpay Payment Integration Component
 */
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { CreditCard, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const RazorpayCheckout = ({ 
  amount, 
  orderId, 
  userDetails, 
  onSuccess, 
  onFailure,
  buttonText = "Pay with Razorpay",
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // Create Razorpay order
      const orderResponse = await axios.post(`${API}/razorpay/create-order`, {
        amount: amount
      });

      const { razorpay_order_id, key_id } = orderResponse.data;

      // Razorpay options
      const options = {
        key: key_id,
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        name: 'Mithaas Delights',
        description: 'Order Payment',
        order_id: razorpay_order_id,
        prefill: {
          name: userDetails.name || '',
          email: userDetails.email || '',
          contact: userDetails.phone || ''
        },
        theme: {
          color: '#f97316' // Orange color
        },
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await axios.post(`${API}/razorpay/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId
            });

            if (verifyResponse.data.success) {
              toast.success('Payment successful!');
              onSuccess(response);
            } else {
              toast.error('Payment verification failed');
              onFailure && onFailure(new Error('Verification failed'));
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
            onFailure && onFailure(error);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.info('Payment cancelled');
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        onFailure && onFailure(response.error);
        setLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setLoading(false);
      onFailure && onFailure(error);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
      data-testid="razorpay-payment-button"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  );
};

export default RazorpayCheckout;
