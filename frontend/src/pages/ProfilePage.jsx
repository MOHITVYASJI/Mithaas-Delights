import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../App';
import axios from 'axios';
import { Header } from '../App';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Heart, Package, User, Edit, Save, X, MapPin, Phone, Mail } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    addresses: []
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        addresses: user.addresses || []
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'wishlist') {
      fetchWishlist();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/orders/user/my-orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      if (user?.wishlist && user.wishlist.length > 0) {
        const productPromises = user.wishlist.map(productId => 
          axios.get(`${API}/products/${productId}`)
        );
        const responses = await Promise.all(productPromises);
        setWishlistProducts(responses.map(response => response.data));
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await axios.put(`${API}/auth/profile`, formData);
      toast.success('Profile updated successfully');
      setEditMode(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const canCancelOrder = (order) => {
    // Check if order can be cancelled (within 1 hour and status allows)
    if (order.status === 'cancelled' || order.status === 'delivered') {
      return false;
    }
    
    const orderTime = new Date(order.created_at).getTime();
    const currentTime = new Date().getTime();
    const oneHourInMs = 60 * 60 * 1000;
    
    return (currentTime - orderTime) < oneHourInMs;
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.put(`${API}/orders/${orderId}/status?status=cancelled`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Order cancelled successfully');
      fetchOrders(); // Refresh orders list
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.detail || 'Failed to cancel order. Please contact support.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-700';
      case 'preparing': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Account</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{user?.name}</h3>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'profile' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                      }`}
                      data-testid="profile-tab"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'orders' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                      }`}
                      data-testid="orders-tab"
                    >
                      <Package className="w-4 h-4" />
                      <span>My Orders</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('wishlist')}
                      className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'wishlist' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                      }`}
                      data-testid="wishlist-tab"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Wishlist</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === 'profile' && (
                <Card data-testid="profile-content">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Profile Information</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditMode(!editMode)}
                      >
                        {editMode ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Full Name</label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          readOnly={!editMode}
                          data-testid="profile-name-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email Address</label>
                        <Input value={user?.email || ''} readOnly />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Phone Number</label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          readOnly={!editMode}
                          placeholder="Enter phone number"
                          data-testid="profile-phone-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Account Role</label>
                        <Input value={user?.role || ''} readOnly />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Delivery Addresses</label>
                      <div className="space-y-3">
                        {formData.addresses && formData.addresses.length > 0 ? (
                          formData.addresses.map((address, index) => (
                            <div key={index} className="p-3 border rounded-lg bg-gray-50">
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{address}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No addresses added yet</p>
                        )}
                      </div>
                    </div>

                    {editMode && (
                      <div className="flex space-x-3">
                        <Button 
                          onClick={handleUpdateProfile}
                          className="bg-orange-500 hover:bg-orange-600"
                          data-testid="save-profile-button"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditMode(false);
                            setFormData({
                              name: user?.name || '',
                              phone: user?.phone || '',
                              addresses: user?.addresses || []
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'orders' && (
                <Card data-testid="orders-content">
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading your orders...</p>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Orders Yet</h3>
                        <p className="text-gray-500 mb-4">Start shopping to see your orders here</p>
                        <Button 
                          onClick={() => window.location.href = '/#products'}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          Browse Products
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-semibold text-lg">Order #{order.id.slice(0, 12)}...</h3>
                                  <Badge className={getStatusColor(order.status)}>
                                    {order.status.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>📅 {new Date(order.created_at).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}</span>
                                  <span>📦 {order.items.length} items</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-orange-600">₹{order.total_amount}</p>
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <h4 className="font-medium mb-2">Delivery Address</h4>
                                <div className="flex items-start space-x-2">
                                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                                  <p className="text-sm text-gray-600">{order.delivery_address}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Contact Information</h4>
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    <p className="text-sm text-gray-600">{order.phone_number}</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <p className="text-sm text-gray-600">{order.email}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Items Ordered</h4>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="space-y-2">
                                  {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                      <span className="text-sm">Product ID: {item.product_id}</span>
                                      <div className="text-sm text-gray-600">
                                        <span>Qty: {item.quantity}</span>
                                        <span className="ml-4 font-medium">₹{item.price}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                              <div className="flex space-x-3">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.location.href = `/track-order?id=${order.id}`}
                                data-testid="track-order-button"
                              >
                                Track Order
                              </Button>
                              {order.status === 'delivered' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-orange-600 hover:text-orange-700"
                                  data-testid="reorder-button"
                                >
                                  Reorder
                                </Button>
                              )}
                              </div>
                              
                              {/* Cancel button - only shown within 1 hour of order and if not cancelled/delivered */}
                              {canCancelOrder(order) && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleCancelOrder(order.id)}
                                  data-testid="cancel-order-button"
                                >
                                  Cancel Order
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'wishlist' && (
                <Card data-testid="wishlist-content">
                  <CardHeader>
                    <CardTitle>My Wishlist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading your wishlist...</p>
                      </div>
                    ) : wishlistProducts.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Wishlist is Empty</h3>
                        <p className="text-gray-500 mb-4">Save items you love to your wishlist</p>
                        <Button 
                          onClick={() => window.location.href = '/#products'}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          Browse Products
                        </Button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlistProducts.map((product) => (
                          <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <div className="relative overflow-hidden">
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              {product.discount_percentage && (
                                <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                                  {product.discount_percentage}% OFF
                                </Badge>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-lg text-gray-800 mb-2">{product.name}</h3>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xl font-bold text-orange-600">₹{product.price}</span>
                                  {product.original_price && (
                                    <span className="text-sm text-gray-400 line-through">₹{product.original_price}</span>
                                  )}
                                </div>
                                <span className="text-sm text-gray-500">{product.weight}</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                                >
                                  Add to Cart
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;