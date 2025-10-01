import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Package, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WHATSAPP_NUMBER = "+918989549544";

export const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const orderId = location.state?.orderId;

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  const generateWhatsAppMessage = () => {
    if (!order) return '';
    
    const itemsList = order.items.map(item => 
      `${item.product_name || 'Product'} (${item.variant_weight}) x${item.quantity}`
    ).join(', ');
    
    return encodeURIComponent(
      `Hello! I have placed an order.\n\n` +
      `Order ID: ${order.id.substring(0, 8)}\n` +
      `Items: ${itemsList}\n` +
      `Total Amount: ₹${order.final_amount}\n\n` +
      `Please confirm my order. Thank you!`
    );
  };

  const openWhatsApp = () => {
    const message = generateWhatsAppMessage();
    window.open(`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${message}`, '_blank');
  };

  if (!orderId || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="order-success-title">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600">
            Thank you for your order. Your order ID is: <strong>{order.id.substring(0, 8)}</strong>
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <Package className="w-5 h-5 text-orange-500 mr-3 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Order Items</h3>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.product_name || 'Product'} ({item.variant_weight}) x {item.quantity}
                        </span>
                        <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal</span>
                  <span>₹{order.total_amount.toFixed(2)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm mb-2 text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                {order.delivery_charge > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span>Delivery Charge</span>
                    <span>₹{order.delivery_charge.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total Amount</span>
                  <span className="text-orange-600" data-testid="final-amount">₹{order.final_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">
                  <strong>Delivery Address:</strong><br />
                  {order.delivery_address}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Payment Method:</strong> {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Status:</strong> <span className="text-green-600 font-medium">{order.status}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Confirmation Button */}
        <Card className="mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageCircle className="w-8 h-8 mr-3" />
                <div>
                  <h3 className="font-semibold text-lg">Confirm via WhatsApp</h3>
                  <p className="text-sm text-green-100">Get instant order confirmation</p>
                </div>
              </div>
              <Button
                onClick={openWhatsApp}
                className="bg-white text-green-600 hover:bg-green-50"
                data-testid="whatsapp-confirm-button"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Open WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => navigate('/orders')}
            variant="outline"
            className="w-full"
            data-testid="view-orders-button"
          >
            View My Orders
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-orange-500 hover:bg-orange-600"
            data-testid="continue-shopping-button"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Track Order Link */}
        <div className="text-center mt-6">
          <Button
            onClick={() => navigate(`/track-order/${order.id}`)}
            variant="link"
            className="text-orange-600"
            data-testid="track-order-link"
          >
            Track Your Order →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;