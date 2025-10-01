import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Eye, Package, Users, BarChart, Settings, Star, Check, X, MessageSquare, Palette } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Get auth token
const getAuthToken = () => localStorage.getItem('token');
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`
});

// Admin Dashboard Component
export const AdminPanel = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedTab, setSelectedTab] = useState('dashboard');

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedTab === 'users') {
      fetchUsers();
    } else if (selectedTab === 'reviews') {
      fetchReviews();
    }
  }, [selectedTab]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`, {
        headers: getAuthHeaders()
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, {
        headers: getAuthHeaders()
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews`, {
        headers: getAuthHeaders()
      });
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mithaas Delights</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Back to Store
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" data-testid="dashboard-tab">
              <BarChart className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="products" data-testid="products-tab">
              <Package className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="orders-tab">
              <Eye className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="users-tab">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="reviews" data-testid="reviews-tab">
              <MessageSquare className="w-4 h-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="settings-tab">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardOverview products={products} orders={orders} />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement products={products} fetchProducts={fetchProducts} />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement orders={orders} fetchOrders={fetchOrders} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement users={users} fetchUsers={fetchUsers} />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewManagement reviews={reviews} fetchReviews={fetchReviews} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ products, orders }) => {
  const totalRevenue = orders.reduce((sum, order) => sum + (order.final_amount || order.total_amount), 0);
  const featuredProducts = products.filter(p => p.is_featured).length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="total-products-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{products.length}</div>
            <p className="text-sm text-gray-600">{featuredProducts} featured</p>
          </CardContent>
        </Card>

        <Card data-testid="total-orders-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{orders.length}</div>
            <p className="text-sm text-gray-600">{pendingOrders} pending</p>
          </CardContent>
        </Card>

        <Card data-testid="total-revenue-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</div>
            <p className="text-sm text-gray-600">All time</p>
          </CardContent>
        </Card>

        <Card data-testid="conversion-rate-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ₹{orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-sm text-green-600">Per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-600">{order.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{order.final_amount || order.total_amount}</p>
                  <Badge 
                    variant={order.status === 'delivered' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Product Management Component
const ProductManagement = ({ products, fetchProducts }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600" data-testid="add-product-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm onSuccess={() => {
              setIsAddDialogOpen(false);
              fetchProducts();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            fetchProducts={fetchProducts}
            onEdit={() => setEditProduct(product)}
          />
        ))}
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <ProductForm 
              product={editProduct}
              onSuccess={() => {
                setEditProduct(null);
                fetchProducts();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, fetchProducts, onEdit }) => {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API}/products/${product.id}`, {
          headers: getAuthHeaders()
        });
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const getMinPrice = () => {
    if (product.variants && product.variants.length > 0) {
      return Math.min(...product.variants.map(v => v.price));
    }
    return product.price || 0;
  };

  return (
    <Card className="overflow-hidden" data-testid="admin-product-card">
      <div className="relative">
        <img 
          src={product.image_url} 
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        {product.is_featured && (
          <Badge className="absolute top-2 left-2 bg-orange-500">Featured</Badge>
        )}
        {product.discount_percentage && (
          <Badge className="absolute top-2 right-2 bg-red-500">
            {product.discount_percentage}% OFF
          </Badge>
        )}
        {product.is_sold_out && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge className="bg-red-600 text-white">SOLD OUT</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Price Range:</p>
          <span className="text-xl font-bold text-orange-600">From ₹{getMinPrice()}</span>
        </div>
        {product.variants && product.variants.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Variants:</p>
            <div className="flex flex-wrap gap-1">
              {product.variants.map((variant, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {variant.weight}: ₹{variant.price}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={onEdit}
            data-testid="edit-product-button"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Product Form Component (Add/Edit)
const ProductForm = ({ product, onSuccess }) => {
  const isEdit = !!product;
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'mithai',
    image_url: product?.image_url || '',
    media_gallery: product?.media_gallery || [],
    ingredients: product?.ingredients?.join(', ') || '',
    is_featured: product?.is_featured || false,
    is_sold_out: product?.is_sold_out || false,
    discount_percentage: product?.discount_percentage || '',
    variants: product?.variants || [{ weight: '250g', price: '', original_price: '', is_available: true }]
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const productData = {
        ...formData,
        ingredients: formData.ingredients.split(',').map(ing => ing.trim()).filter(Boolean),
        variants: formData.variants.map(v => ({
          ...v,
          price: parseFloat(v.price),
          original_price: v.original_price ? parseFloat(v.original_price) : null
        })),
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null
      };

      if (isEdit) {
        await axios.put(`${API}/products/${product.id}`, productData, {
          headers: getAuthHeaders()
        });
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${API}/products`, productData, {
          headers: getAuthHeaders()
        });
        toast.success('Product added successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { weight: '', price: '', original_price: '', is_available: true }]
    }));
  };

  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Product Name *</label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Kaju Katli"
            required
            data-testid="product-name-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}
          >
            <SelectTrigger data-testid="product-category-select">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mithai">Mithai</SelectItem>
              <SelectItem value="namkeen">Namkeen</SelectItem>
              <SelectItem value="laddu">Laddu</SelectItem>
              <SelectItem value="bengali_sweets">Bengali Sweets</SelectItem>
              <SelectItem value="dry_fruit_sweets">Dry Fruit Sweets</SelectItem>
              <SelectItem value="farsan">Farsan</SelectItem>
              <SelectItem value="festival_special">Festival Special</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Product description"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows="3"
          required
          data-testid="product-description-input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Image URL *</label>
        <Input
          name="image_url"
          type="url"
          value={formData.image_url}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          required
          data-testid="product-image-url-input"
        />
      </div>

      {/* Variants Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium">Variants *</label>
          <Button type="button" size="sm" onClick={addVariant} variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add Variant
          </Button>
        </div>
        <div className="space-y-3">
          {formData.variants.map((variant, index) => (
            <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
              <Input
                placeholder="Weight (e.g., 250g)"
                value={variant.weight}
                onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                className="flex-1"
                required
              />
              <Input
                type="number"
                placeholder="Price"
                value={variant.price}
                onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                className="flex-1"
                required
              />
              <Input
                type="number"
                placeholder="Original Price"
                value={variant.original_price}
                onChange={(e) => handleVariantChange(index, 'original_price', e.target.value)}
                className="flex-1"
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={variant.is_available}
                  onChange={(e) => handleVariantChange(index, 'is_available', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Available</span>
              </label>
              {formData.variants.length > 1 && (
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removeVariant(index)}
                  className="text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ingredients (comma-separated)</label>
        <Input
          name="ingredients"
          value={formData.ingredients}
          onChange={handleChange}
          placeholder="Cashews, Sugar, Ghee, Silver Leaf"
          data-testid="product-ingredients-input"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Discount %</label>
          <Input
            name="discount_percentage"
            type="number"
            value={formData.discount_percentage}
            onChange={handleChange}
            placeholder="15"
            min="0"
            max="100"
            data-testid="product-discount-input"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleChange}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              data-testid="product-featured-checkbox"
            />
            <span className="text-sm font-medium">Featured</span>
          </label>
        </div>
        <div className="flex items-end">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_sold_out"
              checked={formData.is_sold_out}
              onChange={handleChange}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm font-medium">Sold Out</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={submitting}
          className="bg-orange-500 hover:bg-orange-600" 
          data-testid="submit-product-button"
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  );
};

// Order Management Component
const OrderManagement = ({ orders, fetchOrders }) => {
  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`, {}, {
        headers: getAuthHeaders()
      });
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} data-testid="admin-order-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Order #{order.id.slice(0, 8)}</h3>
                  <p className="text-gray-600">{order.email} • {order.phone_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">₹{order.final_amount || order.total_amount}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Delivery Address:</p>
                <p className="text-gray-800">{order.delivery_address}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Items:</p>
                <div className="space-y-1 bg-gray-50 p-3 rounded-lg">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.product_name || `Product ${item.product_id.slice(0, 8)}`} ({item.variant_weight}) x{item.quantity}</span>
                      <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Select 
                    value={order.status} 
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-48" data-testid="order-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="capitalize">
                    {order.payment_status}
                  </Badge>
                  <Badge 
                    variant={order.status === 'delivered' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// User Management Component
const UserManagement = ({ users, fetchUsers }) => {
  const [editUser, setEditUser] = useState(null);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const endpoint = currentStatus ? 'block' : 'unblock';
      await axios.put(`${API}/users/${userId}/${endpoint}`, {}, {
        headers: getAuthHeaders()
      });
      toast.success(`User ${currentStatus ? 'blocked' : 'unblocked'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${API}/users/${userId}`, {
          headers: getAuthHeaders()
        });
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.phone && (
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.is_active ? 'default' : 'destructive'}>
                        {user.is_active ? 'Active' : 'Blocked'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? 'Block' : 'Unblock'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <UserEditForm 
              user={editUser}
              onSuccess={() => {
                setEditUser(null);
                fetchUsers();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// User Edit Form
const UserEditForm = ({ user, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || '',
    role: user.role
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.put(`${API}/users/${user.id}`, formData, {
        headers: getAuthHeaders()
      });
      toast.success('User updated successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder="+91 98765 43210"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <Select 
          value={formData.role} 
          onValueChange={(value) => setFormData({...formData, role: value})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-600">
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

// Review Management Component
const ReviewManagement = ({ reviews, fetchReviews }) => {
  const [editReview, setEditReview] = useState(null);

  const handleApprove = async (reviewId) => {
    try {
      await axios.put(`${API}/reviews/${reviewId}/approve`, {}, {
        headers: getAuthHeaders()
      });
      toast.success('Review approved successfully');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to approve review');
    }
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await axios.delete(`${API}/reviews/${reviewId}`, {
          headers: getAuthHeaders()
        });
        toast.success('Review deleted successfully');
        fetchReviews();
      } catch (error) {
        toast.error('Failed to delete review');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Review Management</h2>
      
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-semibold text-gray-800">{review.user_name}</span>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {review.is_approved ? (
                      <Badge className="bg-green-100 text-green-700">
                        <Check className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{review.comment}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditReview(review)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!review.is_approved && (
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => handleApprove(review.id)}
                    >
                      Approve
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDelete(review.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {reviews.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500">Customer reviews will appear here once submitted</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Review Dialog */}
      <Dialog open={!!editReview} onOpenChange={() => setEditReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          {editReview && (
            <ReviewEditForm 
              review={editReview}
              onSuccess={() => {
                setEditReview(null);
                fetchReviews();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Review Edit Form
const ReviewEditForm = ({ review, onSuccess }) => {
  const [formData, setFormData] = useState({
    rating: review.rating,
    comment: review.comment,
    is_approved: review.is_approved
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.put(`${API}/reviews/${review.id}`, formData, {
        headers: getAuthHeaders()
      });
      toast.success('Review updated successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to update review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rating</label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-6 h-6 cursor-pointer ${
                star <= formData.rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300'
              }`}
              onClick={() => setFormData({...formData, rating: star})}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Comment</label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData({...formData, comment: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows="4"
          required
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.is_approved}
          onChange={(e) => setFormData({...formData, is_approved: e.target.checked})}
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        <label className="text-sm font-medium">Approved</label>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-600">
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

// Settings Management Component
const SettingsManagement = () => {
  const [themes, setThemes] = useState([]);
  const [banners, setBanners] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [activeTab, setActiveTab] = useState('themes');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'themes') {
      fetchThemes();
    } else if (activeTab === 'banners') {
      fetchBanners();
    } else if (activeTab === 'coupons') {
      fetchCoupons();
    }
  }, [activeTab]);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/settings/themes`, {
        headers: getAuthHeaders()
      });
      setThemes(response.data);
    } catch (error) {
      console.error('Error fetching themes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/banners`, {
        headers: getAuthHeaders()
      });
      setBanners(response.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/coupons`, {
        headers: getAuthHeaders()
      });
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings & Configuration</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="themes">
            <Palette className="w-4 h-4 mr-2" />
            Themes
          </TabsTrigger>
          <TabsTrigger value="banners">
            <Eye className="w-4 h-4 mr-2" />
            Banners
          </TabsTrigger>
          <TabsTrigger value="coupons">
            <Package className="w-4 h-4 mr-2" />
            Coupons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="themes">
          <Card>
            <CardHeader>
              <CardTitle>Theme Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Control your store's appearance, colors, and festival themes without touching code.
              </p>
              <div className="space-y-4">
                {themes.map((theme) => (
                  <div key={theme.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{theme.theme_name}</h4>
                      <div className="flex items-center space-x-2 mt-2">
                        <div 
                          className="w-6 h-6 rounded-full border" 
                          style={{backgroundColor: theme.primary_color}}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border" 
                          style={{backgroundColor: theme.secondary_color}}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border" 
                          style={{backgroundColor: theme.accent_color}}
                        />
                      </div>
                    </div>
                    {theme.is_active ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Button size="sm" variant="outline">Activate</Button>
                    )}
                  </div>
                ))}
                {themes.length === 0 && !loading && (
                  <p className="text-center text-gray-500 py-8">No themes configured yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banners">
          <Card>
            <CardHeader>
              <CardTitle>Festival Banners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage festival-specific banners and promotional content.
              </p>
              <div className="space-y-4">
                {banners.map((banner) => (
                  <div key={banner.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{banner.title}</h4>
                      <p className="text-sm text-gray-600">{banner.festival_name}</p>
                    </div>
                    <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
                {banners.length === 0 && !loading && (
                  <p className="text-center text-gray-500 py-8">No banners configured yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupons">
          <Card>
            <CardHeader>
              <CardTitle>Discount Coupons</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage discount codes and promotional offers.
              </p>
              <div className="space-y-4">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{coupon.code}</h4>
                      <p className="text-sm text-gray-600">{coupon.discount_percentage}% off</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        Used: {coupon.used_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
                {coupons.length === 0 && !loading && (
                  <p className="text-center text-gray-500 py-8">No coupons configured yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;