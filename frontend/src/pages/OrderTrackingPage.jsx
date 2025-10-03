import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, CheckCircle, Clock, Truck, Home, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  preparing: Package,
  out_for_delivery: Truck,
  delivered: Home,
  cancelled: XCircle
};

const statusColors = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  preparing: 'bg-purple-500',
  out_for_delivery: 'bg-orange-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500'
};

export const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState(orderId || '');

  useEffect(() => {
    if (orderId) {
      trackOrder(orderId);
    }
  }, [orderId]);

  const trackOrder = async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/orders/track/${id || searchOrderId}`);
      setTrackingData(response.data);
    } catch (error) {
      console.error('Error tracking order:', error);
      alert('Order not found. Please check your order ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchOrderId) {
      navigate(`/track-order/${searchOrderId}`);
      trackOrder(searchOrderId);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Package className="w-16 h-16 mx-auto text-orange-500 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-lg text-gray-600">
            Enter your order ID to track your delivery
          </p>
        </div>

        {/* Search Box */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter Order ID (e.g., abc12345)"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                data-testid="order-id-input"
              />
              <Button
                onClick={handleSearch}
                disabled={loading || !searchOrderId}
                className="bg-orange-500 hover:bg-orange-600"
                data-testid="track-button"
              >
                {loading ? 'Tracking...' : 'Track Order'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Results */}
        {trackingData && (
          <div className="space-y-6">
            {/* Current Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Order ID</div>
                    <code className="text-lg font-mono bg-gray-100 px-3 py-1 rounded" data-testid="full-order-id">
                      {trackingData.order_id}
                    </code>
                  </div>
                  <Badge className={`${statusColors[trackingData.status]} text-white self-start sm:self-auto`}>
                    {trackingData.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-medium">{formatDate(trackingData.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium">{formatDate(trackingData.updated_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium capitalize">{trackingData.payment_method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <Badge variant={trackingData.payment_status === 'completed' ? 'success' : 'secondary'}>
                      {trackingData.payment_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-bold text-lg text-orange-600">₹{trackingData.total_amount}</p>
                  </div>
                  {trackingData.estimated_delivery && (
                    <div>
                      <p className="text-sm text-gray-600">Estimated Delivery</p>
                      <p className="font-medium">{formatDate(trackingData.estimated_delivery)}</p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                {trackingData.items && trackingData.items.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                    <div className="space-y-3">
                      {trackingData.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg" data-testid="order-item">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-600">
                              Weight: {item.variant_weight} | Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">₹{item.price * item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trackingData.status_history && trackingData.status_history.length > 0 ? (
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      {/* Timeline Items */}
                      {trackingData.status_history.map((historyItem, index) => {
                        const StatusIcon = statusIcons[historyItem.status] || Package;
                        const isLatest = index === trackingData.status_history.length - 1;
                        
                        return (
                          <div key={index} className="relative flex items-start space-x-4 pb-8 last:pb-0">
                            {/* Icon */}
                            <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                              isLatest ? statusColors[historyItem.status] : 'bg-gray-300'
                            }`}>
                              <StatusIcon className="w-6 h-6 text-white" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 pt-2">
                              <h3 className="font-semibold text-gray-900 capitalize">
                                {historyItem.status.replace('_', ' ')}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatDate(historyItem.timestamp)}
                              </p>
                              {historyItem.note && (
                                <p className="text-sm text-gray-500 mt-1">{historyItem.note}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-4">No status history available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => navigate('/orders')}
                variant="outline"
                data-testid="view-all-orders-button"
              >
                View All Orders
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="bg-orange-500 hover:bg-orange-600"
                data-testid="back-home-button"
              >
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;