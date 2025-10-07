import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Eye, Package, Users, BarChart, Settings, Star, Check, X, MessageSquare, Palette, Play, Folder, Tag, Volume2, Image, Calendar, Gift, Percent } from 'lucide-react';
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
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-12 gap-1">
            <TabsTrigger value="dashboard" data-testid="dashboard-tab">
              <BarChart className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="products" data-testid="products-tab">
              <Package className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="categories-tab">
              <Folder className="w-4 h-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="offers" data-testid="offers-tab">
              <Tag className="w-4 h-4 mr-2" />
              Offers
            </TabsTrigger>
            <TabsTrigger value="announcements" data-testid="announcements-tab">
              <Volume2 className="w-4 h-4 mr-2" />
              Marquee
            </TabsTrigger>
            <TabsTrigger value="advertisements" data-testid="advertisements-tab">
              <Image className="w-4 h-4 mr-2" />
              Ads
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="orders-tab">
              <Eye className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="bulk-orders" data-testid="bulk-orders-tab">
              <Package className="w-4 h-4 mr-2" />
              Bulk Orders
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="users-tab">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="reviews" data-testid="reviews-tab">
              <MessageSquare className="w-4 h-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="media" data-testid="media-tab">
              <Palette className="w-4 h-4 mr-2" />
              Media
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
          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="offers">
            <OffersManagement />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementManagement />
          </TabsContent>

          <TabsContent value="advertisements">
            <AdvertisementManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement orders={orders} fetchOrders={fetchOrders} />
          </TabsContent>

          <TabsContent value="bulk-orders">
            <BulkOrderManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement users={users} fetchUsers={fetchUsers} />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewManagement reviews={reviews} fetchReviews={fetchReviews} />
          </TabsContent>

          <TabsContent value="media">
            <MediaGalleryManagement />
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
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories?active_only=true`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories if API fails
      setCategories([
        { id: '1', name: 'mithai' },
        { id: '2', name: 'namkeen' },
        { id: '3', name: 'laddu' }
      ]);
    }
  };

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
              {categories.length > 0 ? (
                categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name.charAt(0).toUpperCase() + category.name.slice(1).replace(/_/g, ' ')}
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="mithai">Mithai</SelectItem>
                  <SelectItem value="namkeen">Namkeen</SelectItem>
                  <SelectItem value="laddu">Laddu</SelectItem>
                </>
              )}
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

// Category Management Component
const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/categories`, {
        headers: getAuthHeaders()
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`${API}/categories/${categoryId}`, {
          headers: getAuthHeaders()
        });
        toast.success('Category deleted successfully');
        fetchCategories();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600" data-testid="add-category-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <CategoryForm onSuccess={() => {
              setIsAddDialogOpen(false);
              fetchCategories();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden" data-testid="category-card">
              <div className="relative">
                {category.image_url && (
                  <img 
                    src={category.image_url} 
                    alt={category.name}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-2 text-white">
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={category.is_active ? 'default' : 'secondary'}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {category.product_count || 0} products
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setEditCategory(category)}
                    data-testid="edit-category-button"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editCategory && (
            <CategoryForm 
              category={editCategory}
              onSuccess={() => {
                setEditCategory(null);
                fetchCategories();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Category Form Component
const CategoryForm = ({ category, onSuccess }) => {
  const isEdit = !!category;
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    image_url: category?.image_url || '',
    is_active: category?.is_active ?? true
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEdit) {
        await axios.put(`${API}/categories/${category.id}`, formData, {
          headers: getAuthHeaders()
        });
        toast.success('Category updated successfully');
      } else {
        await axios.post(`${API}/categories`, formData, {
          headers: getAuthHeaders()
        });
        toast.success('Category added successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Category Name *</label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Mithai"
          required
          data-testid="category-name-input"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Category description"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows="3"
          data-testid="category-description-input"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Image URL</label>
        <Input
          name="image_url"
          type="url"
          value={formData.image_url}
          onChange={handleChange}
          placeholder="https://example.com/category-image.jpg"
          data-testid="category-image-url-input"
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          data-testid="category-active-checkbox"
        />
        <label className="text-sm font-medium">Active</label>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={submitting}
          className="bg-orange-500 hover:bg-orange-600" 
          data-testid="submit-category-button"
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Category' : 'Add Category'}
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
  const updatePaymentMethod = async (orderId, paymentMethod) => {
    try {
      await axios.put(
        `${API}/orders/${orderId}/update-payment`, 
        { payment_method: paymentMethod },
        { headers: getAuthHeaders() }
      );
      toast.success('Payment method updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update payment method');
    }
  };

  const updatePaymentStatus = async (orderId, paymentStatus) => {
    try {
      await axios.put(
        `${API}/orders/${orderId}/update-payment`, 
        { payment_status: paymentStatus },
        { headers: getAuthHeaders() }
      );
      toast.success('Payment status updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update payment status');
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
                  <p className="text-xs text-gray-500 mb-1">Order ID</p>
                  <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded" data-testid="admin-order-id">
                    {order.id}
                  </code>
                  <p className="text-gray-600 mt-2 text-sm">{order.email} • {order.phone_number}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Placed: {new Date(order.created_at).toLocaleString()}
                  </p>
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

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Order Status:</p>
                  <Select 
                    value={order.status} 
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-full" data-testid="order-status-select">
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
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Payment Method:</p>
                  <Select 
                    value={order.payment_method} 
                    onValueChange={(value) => updatePaymentMethod(order.id, value)}
                  >
                    <SelectTrigger className="w-full" data-testid="payment-method-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                      <SelectItem value="razorpay">Online Payment</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Payment Status:</p>
                  <Select 
                    value={order.payment_status} 
                    onValueChange={(value) => updatePaymentStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-full" data-testid="payment-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Badge 
                    variant={order.status === 'delivered' ? 'default' : 'secondary'}
                    className="capitalize px-4 py-2 text-sm"
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

// Banner Management Component with CRUD
const BannerManagement = ({ banners, fetchBanners, loading }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editBanner, setEditBanner] = useState(null);

  const handleDeleteBanner = async (bannerId) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await axios.delete(`${API}/banners/${bannerId}`, {
          headers: getAuthHeaders()
        });
        toast.success('Banner deleted successfully');
        fetchBanners();
      } catch (error) {
        toast.error('Failed to delete banner');
      }
    }
  };

  const toggleBannerStatus = async (bannerId, currentStatus) => {
    try {
      await axios.put(`${API}/banners/${bannerId}/toggle`, {}, {
        headers: getAuthHeaders()
      });
      toast.success(`Banner ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner status:', error);
      toast.error('Failed to update banner status');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Festival Banners</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600" data-testid="add-banner-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Banner</DialogTitle>
            </DialogHeader>
            <BannerForm onSuccess={() => {
              setIsAddDialogOpen(false);
              fetchBanners();
            }} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : banners.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No banners configured yet</p>
        ) : (
          <div className="space-y-4">
            {banners.map((banner) => (
              <div key={banner.id} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                <img 
                  src={banner.image_url} 
                  alt={banner.title}
                  className="w-32 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{banner.title}</h4>
                  <p className="text-sm text-gray-600">{banner.festival_name}</p>
                  {banner.description && (
                    <p className="text-xs text-gray-500 mt-1">{banner.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                    {banner.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => toggleBannerStatus(banner.id, banner.is_active)}
                  >
                    {banner.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditBanner(banner)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Banner Dialog */}
      <Dialog open={!!editBanner} onOpenChange={() => setEditBanner(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
          </DialogHeader>
          {editBanner && (
            <BannerForm 
              banner={editBanner}
              onSuccess={() => {
                setEditBanner(null);
                fetchBanners();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// // Banner Form Component
// const BannerForm = ({ banner, onSuccess }) => {
//   const isEdit = !!banner;
//   const [formData, setFormData] = useState({
//     title: banner?.title || '',
//     image_url: banner?.image_url || '',
//     festival_name: banner?.festival_name || '',
//     description: banner?.description || '',
//     cta_text: banner?.cta_text || 'Shop Now',
//     cta_link: banner?.cta_link || '',
//     is_active: banner?.is_active ?? true,
//     display_order: banner?.display_order || 0
//   });
//   const [submitting, setSubmitting] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitting(true);

//     try {
//       if (isEdit) {
//         await axios.put(`${API}/banners/${banner.id}`, formData, {
//           headers: getAuthHeaders()
//         });
//         toast.success('Banner updated successfully');
//       } else {
//         await axios.post(`${API}/banners`, formData, {
//           headers: getAuthHeaders()
//         });
//         toast.success('Banner added successfully');
//       }
//       onSuccess();
//     } catch (error) {
//       console.error('Error saving banner:', error);
//       toast.error('Failed to save banner');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <label className="block text-sm font-medium mb-1">Title *</label>
//         <Input
//           value={formData.title}
//           onChange={(e) => setFormData({...formData, title: e.target.value})}
//           placeholder="Diwali Special Offer"
//           required
//         />
//       </div>
//       <div>
//         <label className="block text-sm font-medium mb-1">Festival Name *</label>
//         <Input
//           value={formData.festival_name}
//           onChange={(e) => setFormData({...formData, festival_name: e.target.value})}
//           placeholder="Diwali"
//           required
//         />
//       </div>
//       <div>
//         <label className="block text-sm font-medium mb-1">Image URL *</label>
//         <Input
//           type="url"
//           value={formData.image_url}
//           onChange={(e) => setFormData({...formData, image_url: e.target.value})}
//           placeholder="https://example.com/banner.jpg"
//           required
//         />
//       </div>
//       <div>
//         <label className="block text-sm font-medium mb-1">Description</label>
//         <textarea
//           value={formData.description}
//           onChange={(e) => setFormData({...formData, description: e.target.value})}
//           placeholder="Banner description"
//           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
//           rows="3"
//         />
//       </div>
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium mb-1">CTA Text</label>
//           <Input
//             value={formData.cta_text}
//             onChange={(e) => setFormData({...formData, cta_text: e.target.value})}
//             placeholder="Shop Now"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium mb-1">Display Order</label>
//           <Input
//             type="number"
//             value={formData.display_order}
//             onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
//             placeholder="0"
//           />
//         </div>
//       </div>
//       <div className="flex items-center space-x-2">
//         <input
//           type="checkbox"
//           checked={formData.is_active}
//           onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
//           className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
//         />
//         <label className="text-sm font-medium">Active</label>
//       </div>
//       <div className="flex justify-end space-x-2 pt-4">
//         <Button type="button" variant="outline" onClick={onSuccess}>
//           Cancel
//         </Button>
//         <Button 
//           type="submit" 
//           disabled={submitting}
//           className="bg-orange-500 hover:bg-orange-600"
//         >
//           {submitting ? 'Saving...' : isEdit ? 'Update Banner' : 'Add Banner'}
//         </Button>
//       </div>
//     </form>
//   );
// };

// Coupon Management Component with CRUD
const CouponManagement = ({ coupons, fetchCoupons, loading }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);

  const handleDeleteCoupon = async (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await axios.delete(`${API}/coupons/${couponId}`, {
          headers: getAuthHeaders()
        });
        toast.success('Coupon deleted successfully');
        fetchCoupons();
      } catch (error) {
        toast.error('Failed to delete coupon');
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Discount Coupons</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600" data-testid="add-coupon-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Coupon</DialogTitle>
            </DialogHeader>
            <CouponForm onSuccess={() => {
              setIsAddDialogOpen(false);
              fetchCoupons();
            }} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        ) : coupons.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No coupons configured yet</p>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-lg font-mono">{coupon.code}</h4>
                    <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {coupon.discount_percentage}% off • Min Order: ₹{coupon.min_order_amount}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Used: {coupon.used_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''} • 
                    Expires: {new Date(coupon.expiry_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditCoupon(coupon)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Coupon Dialog */}
      <Dialog open={!!editCoupon} onOpenChange={() => setEditCoupon(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
          </DialogHeader>
          {editCoupon && (
            <CouponForm 
              coupon={editCoupon}
              onSuccess={() => {
                setEditCoupon(null);
                fetchCoupons();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// Coupon Form Component
const CouponForm = ({ coupon, onSuccess }) => {
  const isEdit = !!coupon;
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    discount_percentage: coupon?.discount_percentage || 10,
    max_discount_amount: coupon?.max_discount_amount || null,
    min_order_amount: coupon?.min_order_amount || 0,
    expiry_date: coupon?.expiry_date ? new Date(coupon.expiry_date).toISOString().split('T')[0] : '',
    usage_limit: coupon?.usage_limit || null,
    is_active: coupon?.is_active ?? true
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        expiry_date: new Date(formData.expiry_date).toISOString()
      };

      if (isEdit) {
        await axios.put(`${API}/coupons/${coupon.id}`, submitData, {
          headers: getAuthHeaders()
        });
        toast.success('Coupon updated successfully');
      } else {
        await axios.post(`${API}/coupons`, submitData, {
          headers: getAuthHeaders()
        });
        toast.success('Coupon added successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error(error.response?.data?.detail || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Coupon Code *</label>
        <Input
          value={formData.code}
          onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
          placeholder="FESTIVE50"
          className="font-mono uppercase"
          required
          disabled={isEdit}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Discount % *</label>
          <Input
            type="number"
            value={formData.discount_percentage}
            onChange={(e) => setFormData({...formData, discount_percentage: parseInt(e.target.value)})}
            min="1"
            max="100"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Discount Amount</label>
          <Input
            type="number"
            value={formData.max_discount_amount || ''}
            onChange={(e) => setFormData({...formData, max_discount_amount: e.target.value ? parseFloat(e.target.value) : null})}
            placeholder="No limit"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Min Order Amount</label>
          <Input
            type="number"
            value={formData.min_order_amount}
            onChange={(e) => setFormData({...formData, min_order_amount: parseFloat(e.target.value)})}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Usage Limit</label>
          <Input
            type="number"
            value={formData.usage_limit || ''}
            onChange={(e) => setFormData({...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null})}
            placeholder="Unlimited"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Expiry Date *</label>
        <Input
          type="date"
          value={formData.expiry_date}
          onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
          required
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        <label className="text-sm font-medium">Active</label>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={submitting}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Coupon' : 'Add Coupon'}
        </Button>
      </div>
    </form>
  );
};


// // Banner Management Component
// const BannerManagement = ({ banners, fetchBanners, loading }) => {
//   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
//   const [editBanner, setEditBanner] = useState(null);

//   const handleDelete = async (bannerId) => {
//     if (window.confirm('Are you sure you want to delete this banner?')) {
//       try {
//         await axios.delete(`${API}/banners/${bannerId}`, {
//           headers: getAuthHeaders()
//         });
//         toast.success('Banner deleted successfully');
//         fetchBanners();
//       } catch (error) {
//         toast.error('Failed to delete banner');
//       }
//     }
//   };

//   const handleToggleStatus = async (bannerId, currentStatus) => {
//     try {
//       await axios.put(`${API}/banners/${bannerId}/toggle`, {}, {
//         headers: getAuthHeaders()
//       });
//       toast.success(`Banner ${currentStatus ? 'deactivated' : 'activated'} successfully`);
//       fetchBanners();
//     } catch (error) {
//       toast.error('Failed to update banner status');
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-900">Banner Management</h2>
//         <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
//           <DialogTrigger asChild>
//             <Button className="bg-orange-500 hover:bg-orange-600">
//               <Plus className="w-4 h-4 mr-2" />
//               Add Banner
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-2xl">
//             <DialogHeader>
//               <DialogTitle>Add New Banner</DialogTitle>
//             </DialogHeader>
//             <BannerForm onSuccess={() => {
//               setIsAddDialogOpen(false);
//               fetchBanners();
//             }} />
//           </DialogContent>
//         </Dialog>
//       </div>

//       <Card>
//         <CardContent className="p-6">
//           {loading ? (
//             <div className="text-center py-8">
//               <p className="text-gray-500">Loading banners...</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {banners.map((banner) => (
//                 <div key={banner.id} className="flex items-center justify-between p-4 border rounded-lg">
//                   <div className="flex-1">
//                     <div className="flex items-center space-x-4">
//                       {banner.image_url && (
//                         <img 
//                           src={banner.image_url} 
//                           alt={banner.title}
//                           className="w-16 h-16 object-cover rounded-lg"
//                         />
//                       )}
//                       <div>
//                         <h4 className="font-semibold text-lg">{banner.title}</h4>
//                         <p className="text-sm text-gray-600">{banner.festival_name}</p>
//                         {banner.description && (
//                           <p className="text-sm text-gray-500 mt-1">{banner.description}</p>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <Badge variant={banner.is_active ? 'default' : 'secondary'}>
//                       {banner.is_active ? 'Active' : 'Inactive'}
//                     </Badge>
//                     <Button 
//                       size="sm" 
//                       variant="outline"
//                       onClick={() => setEditBanner(banner)}
//                     >
//                       <Edit className="w-4 h-4" />
//                     </Button>
//                     <Button 
//                       size="sm" 
//                       variant="outline"
//                       onClick={() => handleToggleStatus(banner.id, banner.is_active)}
//                     >
//                       {banner.is_active ? 'Deactivate' : 'Activate'}
//                     </Button>
//                     <Button 
//                       size="sm" 
//                       variant="outline"
//                       onClick={() => handleDelete(banner.id)}
//                       className="text-red-600 hover:text-red-700"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//               {banners.length === 0 && (
//                 <div className="text-center py-8">
//                   <p className="text-gray-500">No banners configured yet</p>
//                 </div>
//               )}
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Edit Banner Dialog */}
//       <Dialog open={!!editBanner} onOpenChange={() => setEditBanner(null)}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>Edit Banner</DialogTitle>
//           </DialogHeader>
//           {editBanner && (
//             <BannerForm 
//               banner={editBanner}
//               onSuccess={() => {
//                 setEditBanner(null);
//                 fetchBanners();
//               }} 
//             />
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// Banner Form Component (Add/Edit)
const BannerForm = ({ banner, onSuccess }) => {
  const isEdit = !!banner;
  const [formData, setFormData] = useState({
    title: banner?.title || '',
    description: banner?.description || '',
    festival_name: banner?.festival_name || '',
    image_url: banner?.image_url || '',
    link_url: banner?.link_url || '',
    is_active: banner?.is_active || false,
    start_date: banner?.start_date || '',
    end_date: banner?.end_date || ''
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const bannerData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      if (isEdit) {
        await axios.put(`${API}/banners/${banner.id}`, bannerData, {
          headers: getAuthHeaders()
        });
        toast.success('Banner updated successfully');
      } else {
        await axios.post(`${API}/banners`, bannerData, {
          headers: getAuthHeaders()
        });
        toast.success('Banner added successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Failed to save banner');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Banner Title *</label>
          <Input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Diwali Special Offer"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Festival Name</label>
          <Input
            name="festival_name"
            value={formData.festival_name}
            onChange={handleChange}
            placeholder="e.g., Diwali, Holi, Eid"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Banner description"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows="3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Image URL *</label>
        <Input
          name="image_url"
          type="url"
          value={formData.image_url}
          onChange={handleChange}
          placeholder="https://example.com/banner.jpg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Link URL</label>
        <Input
          name="link_url"
          type="url"
          value={formData.link_url}
          onChange={handleChange}
          placeholder="https://example.com/promotion"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <Input
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <Input
            name="end_date"
            type="date"
            value={formData.end_date}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        <label className="text-sm font-medium">Active</label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={submitting}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Banner' : 'Add Banner'}
        </Button>
      </div>
    </form>
  );
};
// Notification Form Component
const NotificationForm = ({ fetchNotifications }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_audience: 'all',
    notification_type: 'info'
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      // Create notification
      const response = await axios.post(
        `${API}/notifications`,
        formData,
        { headers: getAuthHeaders() }
      );

      // Broadcast notification
      await axios.post(
        `${API}/notifications/${response.data.id}/broadcast`,
        {},
        { headers: getAuthHeaders() }
      );

      toast.success('Notification sent successfully!');
      setFormData({ title: '', message: '', target_audience: 'all', notification_type: 'info' });
      if (fetchNotifications) fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="Notification title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Message</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows="4"
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          placeholder="Notification message"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Target Audience</label>
          <Select 
            value={formData.target_audience}
            onValueChange={(value) => setFormData({...formData, target_audience: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active">Active Users</SelectItem>
              <SelectItem value="inactive">Inactive Users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <Select
            value={formData.notification_type}
            onValueChange={(value) => setFormData({...formData, notification_type: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="promo">Promotion</SelectItem>
              <SelectItem value="alert">Alert</SelectItem>
              <SelectItem value="update">Update</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        disabled={sending}
        className="w-full bg-orange-500 hover:bg-orange-600"
      >
        {sending ? 'Sending...' : 'Send Notification'}
      </Button>
    </form>
  );
};

// Settings Management Component
const SettingsManagement = () => {
  const [themes, setThemes] = useState([]);
  const [banners, setBanners] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('themes');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'themes') {
      fetchThemes();
    } else if (activeTab === 'banners') {
      fetchBanners();
    } else if (activeTab === 'coupons') {
      fetchCoupons();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab]);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/themes`, {
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

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/notifications/admin/all`, {
        headers: getAuthHeaders()
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };
  const initializeDefaultThemes = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/themes/initialize-defaults`, {}, {
        headers: getAuthHeaders()
      });
      toast.success(response.data.message || 'Default themes initialized successfully');
      await fetchThemes(); // Fetch themes after initialization
    } catch (error) {
      console.error('Error initializing themes:', error);
      toast.error('Failed to initialize default themes');
    } finally {
      setLoading(false);
    }
  };

  const activateTheme = async (themeId) => {
    try {
      setLoading(true);
      await axios.put(`${API}/themes/${themeId}/activate`, {}, {
        headers: getAuthHeaders()
      });
      toast.success('Theme activated successfully');
      fetchThemes();
    } catch (error) {
      console.error('Error activating theme:', error);
      toast.error('Failed to activate theme');
    } finally {
      setLoading(false);
    }
  };

  const deleteTheme = async (themeId) => {
    if (window.confirm('Are you sure you want to delete this theme?')) {
      try {
        setLoading(true);
        await axios.delete(`${API}/themes/${themeId}`, {
          headers: getAuthHeaders()
        });
        toast.success('Theme deleted successfully');
        fetchThemes();
      } catch (error) {
        console.error('Error deleting theme:', error);
        toast.error('Failed to delete theme');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings & Configuration</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="notifications">
            <MessageSquare className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="themes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Theme Management</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Control your store's appearance, colors, and festival themes. Changes apply instantly across the entire website.
                  </p>
                </div>
                <Button 
                  onClick={initializeDefaultThemes}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Palette className="w-4 h-4" />
                  Initialize Default Themes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <div 
                      key={theme.id} 
                      className={`relative p-4 border-2 rounded-lg transition-all hover:shadow-lg ${
                        theme.is_active ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                      data-testid={`theme-card-${theme.name}`}
                    >
                      {/* Active Badge */}
                      {theme.is_active && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500 text-white">Active</Badge>
                        </div>
                      )}
                      
                      {/* Theme Header */}
                      <div className="mb-3">
                        <h4 className="font-bold text-lg mb-1">{theme.display_name}</h4>
                        {theme.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{theme.description}</p>
                        )}
                        {theme.festival_mode && theme.festival_name && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            🎉 {theme.festival_name}
                          </Badge>
                        )}
                      </div>

                      {/* Color Preview */}
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">Color Palette:</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm" 
                              style={{backgroundColor: theme.colors?.primary || '#f97316'}}
                              title="Primary"
                            />
                            <span className="text-xs text-gray-500 mt-1">Primary</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm" 
                              style={{backgroundColor: theme.colors?.secondary || '#f59e0b'}}
                              title="Secondary"
                            />
                            <span className="text-xs text-gray-500 mt-1">Secondary</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div 
                              className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm" 
                              style={{backgroundColor: theme.colors?.accent || '#ea580c'}}
                              title="Accent"
                            />
                            <span className="text-xs text-gray-500 mt-1">Accent</span>
                          </div>
                        </div>
                      </div>

                      {/* Full Color Details (Expandable) */}
                      <details className="mb-3">
                        <summary className="text-xs font-medium text-gray-600 cursor-pointer hover:text-orange-600">
                          View All Colors
                        </summary>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Background:</span>
                            <code className="bg-gray-100 px-1 rounded">{theme.colors?.background}</code>
                          </div>
                          <div className="flex justify-between">
                            <span>Surface:</span>
                            <code className="bg-gray-100 px-1 rounded">{theme.colors?.surface}</code>
                          </div>
                          <div className="flex justify-between">
                            <span>Text Primary:</span>
                            <code className="bg-gray-100 px-1 rounded">{theme.colors?.text_primary}</code>
                          </div>
                          <div className="flex justify-between">
                            <span>Border:</span>
                            <code className="bg-gray-100 px-1 rounded">{theme.colors?.border}</code>
                          </div>
                        </div>
                      </details>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        {!theme.is_active && (
                          <Button
                            onClick={() => activateTheme(theme.id)}
                            size="sm"
                            className="flex-1 bg-orange-500 hover:bg-orange-600"
                            disabled={loading}
                            data-testid={`activate-theme-${theme.name}`}
                          >
                            Activate
                          </Button>
                        )}
                        {theme.is_active && (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-500"
                            disabled
                          >
                            ✓ Currently Active
                          </Button>
                        )}
                        {!theme.is_default && !theme.is_active && (
                          <Button
                            onClick={() => deleteTheme(theme.id)}
                            size="sm"
                            variant="destructive"
                            disabled={loading}
                            data-testid={`delete-theme-${theme.name}`}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && themes.length === 0 && (
                <div className="text-center py-12">
                  <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No themes found</p>
                  <Button 
                    onClick={initializeDefaultThemes}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Initialize Default Themes
                  </Button>
                </div>
              )}

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-2">📝 Theme Information</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Users</strong> can only toggle between Dark and Light modes</li>
                  <li>• <strong>Admin</strong> controls the global theme and color palette</li>
                  <li>• Theme changes apply <strong>instantly</strong> across the entire website</li>
                  <li>• Festival themes include special decorations and effects</li>
                  <li>• Default themes cannot be deleted, only deactivated</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banners">
          <BannerManagement banners={banners} fetchBanners={fetchBanners} loading={loading} />
        </TabsContent>

        <TabsContent value="coupons">
          <CouponManagement coupons={coupons} fetchCoupons={fetchCoupons} loading={loading} />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Send Notification</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationForm fetchNotifications={fetchNotifications} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Bulk Order Management Component
const BulkOrderManagement = () => {
  const [bulkOrders, setBulkOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBulkOrders();
  }, []);

  const fetchBulkOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/bulk-orders`, {
        headers: getAuthHeaders()
      });
      setBulkOrders(response.data);
    } catch (error) {
      console.error('Error fetching bulk orders:', error);
      toast.error('Failed to fetch bulk orders');
    } finally {
      setLoading(false);
    }
  };

  const updateBulkOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/bulk-orders/${orderId}`, 
        { status },
        { headers: getAuthHeaders() }
      );
      toast.success('Bulk order status updated successfully');
      fetchBulkOrders();
    } catch (error) {
      toast.error('Failed to update bulk order status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Bulk Order Requests</h2>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {bulkOrders.length} Total Requests
        </Badge>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      ) : bulkOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No bulk orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bulkOrders.map((order) => (
            <Card key={order.id} data-testid="bulk-order-card">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-4">{order.company_name}</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <Users className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
                        <div>
                          <p className="font-medium">{order.contact_person}</p>
                          <p className="text-gray-600">{order.email}</p>
                          <p className="text-gray-600">{order.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Package className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
                        <div>
                          <p className="font-medium">Product Details:</p>
                          <p className="text-gray-700">{order.product_details}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-gray-600">Quantity:</p>
                          <p className="font-medium">{order.quantity}</p>
                        </div>
                        {order.preferred_date && (
                          <div>
                            <p className="text-gray-600">Preferred Date:</p>
                            <p className="font-medium">{new Date(order.preferred_date).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start">
                        <span className="text-gray-600 mr-2">Address:</span>
                        <p className="text-gray-700">{order.delivery_address}</p>
                      </div>

                      <div className="text-xs text-gray-500">
                        Submitted: {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="border-l pl-6">
                    <div className="mb-4">
                      <label className="text-sm text-gray-600 mb-2 block">Order Status:</label>
                      <Select 
                        value={order.status} 
                        onValueChange={(value) => updateBulkOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-full" data-testid="bulk-order-status-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="quoted">Quoted</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <a
                        href={`mailto:${order.email}?subject=Bulk Order Inquiry - ${order.company_name}`}
                        className="block w-full text-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                      >
                        Send Email
                      </a>
                      <a
                        href={`tel:${order.phone}`}
                        className="block w-full text-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                      >
                        Call Customer
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Media Gallery Management Component
const MediaGalleryManagement = () => {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMedia, setNewMedia] = useState({
    title: '',
    description: '',
    media_url: '',
    media_type: 'image',
    thumbnail_url: ''
  });

  useEffect(() => {
    fetchMediaItems();
  }, []);

  const fetchMediaItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/media`);
      setMediaItems(response.data);
    } catch (error) {
      console.error('Error fetching media items:', error);
      toast.error('Failed to fetch media items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedia = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/media`, newMedia, {
        headers: getAuthHeaders()
      });
      toast.success('Media item added successfully');
      setIsAddDialogOpen(false);
      setNewMedia({ title: '', description: '', media_url: '', media_type: 'image', thumbnail_url: '' });
      fetchMediaItems();
    } catch (error) {
      console.error('Error adding media:', error);
      toast.error('Failed to add media item');
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (window.confirm('Are you sure you want to delete this media item?')) {
      try {
        await axios.delete(`${API}/media/${mediaId}`, {
          headers: getAuthHeaders()
        });
        toast.success('Media item deleted successfully');
        fetchMediaItems();
      } catch (error) {
        toast.error('Failed to delete media item');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Media Gallery Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600" data-testid="add-media-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Media Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Media Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMedia} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  value={newMedia.title}
                  onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                  placeholder="e.g., Kaju Katli Special"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={newMedia.description}
                  onChange={(e) => setNewMedia({ ...newMedia, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Media Type *</label>
                <Select value={newMedia.media_type} onValueChange={(value) => setNewMedia({ ...newMedia, media_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Media URL *</label>
                <Input
                  type="url"
                  value={newMedia.media_url}
                  onChange={(e) => setNewMedia({ ...newMedia, media_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>

              {newMedia.media_type === 'video' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
                  <Input
                    type="url"
                    value={newMedia.thumbnail_url}
                    onChange={(e) => setNewMedia({ ...newMedia, thumbnail_url: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>
              )}

              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                Add Media Item
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      ) : mediaItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No media items found</p>
            <p className="text-sm text-gray-400 mt-2">Add your first media item to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaItems.map((item) => (
            <Card key={item.id} data-testid="media-item-card">
              <div className="relative aspect-video overflow-hidden">
                {item.media_type === 'image' ? (
                  <img
                    src={item.media_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full bg-gray-200">
                    <video
                      src={item.media_url}
                      className="w-full h-full object-cover"
                      poster={item.thumbnail_url}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-orange-500" />
                      </div>
                    </div>
                  </div>
                )}
                <Badge className="absolute top-2 right-2">
                  {item.media_type}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteMedia(item.id)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== OFFERS MANAGEMENT ====================

const OffersManagement = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editOffer, setEditOffer] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/offers`, {
        headers: getAuthHeaders()
      });
      setOffers(response.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        await axios.delete(`${API}/offers/${offerId}`, {
          headers: getAuthHeaders()
        });
        toast.success('Offer deleted successfully');
        fetchOffers();
      } catch (error) {
        toast.error('Failed to delete offer');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Offers Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600" data-testid="add-offer-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Offer</DialogTitle>
            </DialogHeader>
            <OfferForm onSuccess={() => {
              setIsAddDialogOpen(false);
              fetchOffers();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden" data-testid="offer-card">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{offer.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                  </div>
                  <Badge 
                    className={`${offer.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {offer.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Type:</span>
                    <span className="text-sm font-medium capitalize">{offer.offer_type.replace('_', ' ')}</span>
                  </div>
                  {offer.discount_percentage && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Discount:</span>
                      <span className="text-sm font-medium">{offer.discount_percentage}% OFF</span>
                    </div>
                  )}
                  {offer.discount_amount && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Amount:</span>
                      <span className="text-sm font-medium">₹{offer.discount_amount} OFF</span>
                    </div>
                  )}
                  {offer.buy_quantity && offer.get_quantity && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Deal:</span>
                      <span className="text-sm font-medium">Buy {offer.buy_quantity} Get {offer.get_quantity}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Usage:</span>
                    <span className="text-sm font-medium">{offer.used_count}{offer.usage_limit ? `/${offer.usage_limit}` : ''}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setEditOffer(offer)}
                    data-testid="edit-offer-button"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Offer Dialog */}
      <Dialog open={!!editOffer} onOpenChange={() => setEditOffer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Offer</DialogTitle>
          </DialogHeader>
          {editOffer && (
            <OfferForm 
              offer={editOffer}
              onSuccess={() => {
                setEditOffer(null);
                fetchOffers();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Offer Form Component
const OfferForm = ({ offer, onSuccess }) => {
  const isEdit = !!offer;
  const [formData, setFormData] = useState({
    name: offer?.name || '',
    description: offer?.description || '',
    offer_type: offer?.offer_type || 'percentage',
    discount_percentage: offer?.discount_percentage || '',
    discount_amount: offer?.discount_amount || '',
    max_discount: offer?.max_discount || '',
    buy_quantity: offer?.buy_quantity || '',
    get_quantity: offer?.get_quantity || '',
    get_discount_percentage: offer?.get_discount_percentage || '',
    applicable_product_ids: offer?.applicable_product_ids || [],
    category_names: offer?.category_names || [],
    min_purchase_amount: offer?.min_purchase_amount || 0,
    min_quantity: offer?.min_quantity || 1,
    is_active: offer?.is_active ?? true,
    start_date: offer?.start_date ? offer.start_date.split('T')[0] : '',
    end_date: offer?.end_date ? offer.end_date.split('T')[0] : '',
    usage_limit: offer?.usage_limit || '',
    per_user_limit: offer?.per_user_limit || 1,
    stackable: offer?.stackable ?? true,
    auto_apply: offer?.auto_apply ?? true,
    badge_text: offer?.badge_text || '',
    badge_color: offer?.badge_color || '#f97316',
    priority: offer?.priority || 0
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories?active_only=true`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const offerData = {
        ...formData,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        buy_quantity: formData.buy_quantity ? parseInt(formData.buy_quantity) : null,
        get_quantity: formData.get_quantity ? parseInt(formData.get_quantity) : null,
        get_discount_percentage: formData.get_discount_percentage ? parseInt(formData.get_discount_percentage) : null,
        min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0,
        min_quantity: parseInt(formData.min_quantity) || 1,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        per_user_limit: parseInt(formData.per_user_limit) || 1,
        priority: parseInt(formData.priority) || 0,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
      };

      if (isEdit) {
        await axios.put(`${API}/offers/${offer.id}`, offerData, {
          headers: getAuthHeaders()
        });
        toast.success('Offer updated successfully');
      } else {
        await axios.post(`${API}/offers`, offerData, {
          headers: getAuthHeaders()
        });
        toast.success('Offer created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Offer Name *</label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Diwali Special 25% Off"
            required
            data-testid="offer-name-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Offer Type *</label>
          <Select value={formData.offer_type} onValueChange={(value) => setFormData(prev => ({...prev, offer_type: value}))}>
            <SelectTrigger data-testid="offer-type-select">
              <SelectValue placeholder="Select offer type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage Discount</SelectItem>
              <SelectItem value="flat_discount">Flat Discount</SelectItem>
              <SelectItem value="buy_x_get_y">Buy X Get Y Free</SelectItem>
              <SelectItem value="buy_x_get_y_discount">Buy X Get Y at Discount</SelectItem>
              <SelectItem value="free_shipping">Free Shipping</SelectItem>
              <SelectItem value="bundle">Bundle Offer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Offer description"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows="3"
          data-testid="offer-description-input"
        />
      </div>

      {/* Discount Fields */}
      <div className="grid grid-cols-3 gap-4">
        {(formData.offer_type === 'percentage' || formData.offer_type === 'buy_x_get_y_discount') && (
          <div>
            <label className="block text-sm font-medium mb-1">Discount %</label>
            <Input
              name="discount_percentage"
              type="number"
              value={formData.discount_percentage}
              onChange={handleChange}
              placeholder="25"
              min="1"
              max="100"
              data-testid="offer-discount-percentage-input"
            />
          </div>
        )}
        {formData.offer_type === 'flat_discount' && (
          <div>
            <label className="block text-sm font-medium mb-1">Discount Amount (₹)</label>
            <Input
              name="discount_amount"
              type="number"
              value={formData.discount_amount}
              onChange={handleChange}
              placeholder="100"
              min="0"
              step="0.01"
              data-testid="offer-discount-amount-input"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Max Discount (₹)</label>
          <Input
            name="max_discount"
            type="number"
            value={formData.max_discount}
            onChange={handleChange}
            placeholder="500"
            min="0"
            step="0.01"
            data-testid="offer-max-discount-input"
          />
        </div>
      </div>

      {/* Buy X Get Y Fields */}
      {(formData.offer_type === 'buy_x_get_y' || formData.offer_type === 'buy_x_get_y_discount') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Buy Quantity</label>
            <Input
              name="buy_quantity"
              type="number"
              value={formData.buy_quantity}
              onChange={handleChange}
              placeholder="2"
              min="1"
              data-testid="offer-buy-quantity-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Get Quantity</label>
            <Input
              name="get_quantity"
              type="number"
              value={formData.get_quantity}
              onChange={handleChange}
              placeholder="1"
              min="1"
              data-testid="offer-get-quantity-input"
            />
          </div>
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <Input
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
            data-testid="offer-start-date-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <Input
            name="end_date"
            type="date"
            value={formData.end_date}
            onChange={handleChange}
            data-testid="offer-end-date-input"
          />
        </div>
      </div>

      {/* Usage Limits */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Usage Limit</label>
          <Input
            name="usage_limit"
            type="number"
            value={formData.usage_limit}
            onChange={handleChange}
            placeholder="100"
            min="1"
            data-testid="offer-usage-limit-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Per User Limit</label>
          <Input
            name="per_user_limit"
            type="number"
            value={formData.per_user_limit}
            onChange={handleChange}
            placeholder="1"
            min="1"
            data-testid="offer-per-user-limit-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <Input
            name="priority"
            type="number"
            value={formData.priority}
            onChange={handleChange}
            placeholder="0"
            min="0"
            data-testid="offer-priority-input"
          />
        </div>
      </div>

      {/* Badge Customization */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Badge Text</label>
          <Input
            name="badge_text"
            value={formData.badge_text}
            onChange={handleChange}
            placeholder="SPECIAL OFFER"
            data-testid="offer-badge-text-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Badge Color</label>
          <Input
            name="badge_color"
            type="color"
            value={formData.badge_color}
            onChange={handleChange}
            data-testid="offer-badge-color-input"
          />
        </div>
      </div>

      {/* Conditions */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Min Purchase Amount (₹)</label>
          <Input
            name="min_purchase_amount"
            type="number"
            value={formData.min_purchase_amount}
            onChange={handleChange}
            placeholder="0"
            min="0"
            step="0.01"
            data-testid="offer-min-purchase-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Min Quantity</label>
          <Input
            name="min_quantity"
            type="number"
            value={formData.min_quantity}
            onChange={handleChange}
            placeholder="1"
            min="1"
            data-testid="offer-min-quantity-input"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            data-testid="offer-active-checkbox"
          />
          <label className="text-sm font-medium">Active</label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="stackable"
            checked={formData.stackable}
            onChange={handleChange}
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            data-testid="offer-stackable-checkbox"
          />
          <label className="text-sm font-medium">Stackable</label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="auto_apply"
            checked={formData.auto_apply}
            onChange={handleChange}
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            data-testid="offer-auto-apply-checkbox"
          />
          <label className="text-sm font-medium">Auto Apply</label>
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
          data-testid="submit-offer-button"
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Offer' : 'Create Offer'}
        </Button>
      </div>
    </form>
  );
};

// ==================== ANNOUNCEMENT MANAGEMENT ====================

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/announcements`, {
        headers: getAuthHeaders()
      });
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await axios.delete(`${API}/announcements/${announcementId}`, {
          headers: getAuthHeaders()
        });
        toast.success('Announcement deleted successfully');
        fetchAnnouncements();
      } catch (error) {
        toast.error('Failed to delete announcement');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Marquee & Announcements</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600" data-testid="add-announcement-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add New Announcement</DialogTitle>
            </DialogHeader>
            <AnnouncementForm onSuccess={() => {
              setIsAddDialogOpen(false);
              fetchAnnouncements();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="overflow-hidden" data-testid="announcement-card">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{announcement.title}</h3>
                    <p className="text-gray-600 mt-1">{announcement.message}</p>
                  </div>
                  <Badge 
                    className={`${announcement.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {announcement.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="font-medium capitalize">{announcement.announcement_type}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Direction:</span>
                    <p className="font-medium capitalize">{announcement.direction}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Speed:</span>
                    <p className="font-medium">{announcement.animation_speed}px/s</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Views:</span>
                    <p className="font-medium">{announcement.display_count || 0}</p>
                  </div>
                </div>

                {/* Preview */}
                <div className="mb-4">
                  <span className="text-sm text-gray-500 mb-2 block">Preview:</span>
                  <div 
                    className="p-3 rounded border overflow-hidden relative"
                    style={{
                      backgroundColor: announcement.background_color,
                      color: announcement.text_color,
                      fontSize: announcement.font_size,
                      fontWeight: announcement.font_weight
                    }}
                  >
                    <div className="whitespace-nowrap animate-pulse">
                      {announcement.message}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setEditAnnouncement(announcement)}
                    data-testid="edit-announcement-button"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Announcement Dialog */}
      <Dialog open={!!editAnnouncement} onOpenChange={() => setEditAnnouncement(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          {editAnnouncement && (
            <AnnouncementForm 
              announcement={editAnnouncement}
              onSuccess={() => {
                setEditAnnouncement(null);
                fetchAnnouncements();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Announcement Form Component
const AnnouncementForm = ({ announcement, onSuccess }) => {
  const isEdit = !!announcement;
  const [formData, setFormData] = useState({
    title: announcement?.title || '',
    message: announcement?.message || '',
    announcement_type: announcement?.announcement_type || 'marquee',
    color: announcement?.color || '#f97316',
    background_color: announcement?.background_color || '#fff7ed',
    text_color: announcement?.text_color || '#9a3412',
    font_size: announcement?.font_size || '16px',
    font_weight: announcement?.font_weight || '600',
    animation_speed: announcement?.animation_speed || 50,
    direction: announcement?.direction || 'left',
    is_active: announcement?.is_active ?? true,
    display_order: announcement?.display_order || 0,
    show_on_pages: announcement?.show_on_pages || ['home'],
    start_date: announcement?.start_date ? announcement.start_date.split('T')[0] : '',
    end_date: announcement?.end_date ? announcement.end_date.split('T')[0] : '',
    max_displays: announcement?.max_displays || ''
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const announcementData = {
        ...formData,
        animation_speed: parseInt(formData.animation_speed) || 50,
        display_order: parseInt(formData.display_order) || 0,
        max_displays: formData.max_displays ? parseInt(formData.max_displays) : null,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
      };

      if (isEdit) {
        await axios.put(`${API}/announcements/${announcement.id}`, announcementData, {
          headers: getAuthHeaders()
        });
        toast.success('Announcement updated successfully');
      } else {
        await axios.post(`${API}/announcements`, announcementData, {
          headers: getAuthHeaders()
        });
        toast.success('Announcement created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <Input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Announcement title"
            required
            data-testid="announcement-title-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <Select value={formData.announcement_type} onValueChange={(value) => setFormData(prev => ({...prev, announcement_type: value}))}>
            <SelectTrigger data-testid="announcement-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marquee">Marquee (Scrolling)</SelectItem>
              <SelectItem value="ticker">Ticker</SelectItem>
              <SelectItem value="banner">Banner</SelectItem>
              <SelectItem value="popup">Popup</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Message *</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Your announcement message"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows="3"
          required
          data-testid="announcement-message-input"
        />
      </div>

      {/* Styling Options */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Background Color</label>
          <Input
            name="background_color"
            type="color"
            value={formData.background_color}
            onChange={handleChange}
            data-testid="announcement-bg-color-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Text Color</label>
          <Input
            name="text_color"
            type="color"
            value={formData.text_color}
            onChange={handleChange}
            data-testid="announcement-text-color-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Accent Color</label>
          <Input
            name="color"
            type="color"
            value={formData.color}
            onChange={handleChange}
            data-testid="announcement-accent-color-input"
          />
        </div>
      </div>

      {/* Animation Settings */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Font Size</label>
          <Input
            name="font_size"
            value={formData.font_size}
            onChange={handleChange}
            placeholder="16px"
            data-testid="announcement-font-size-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Font Weight</label>
          <Select value={formData.font_weight} onValueChange={(value) => setFormData(prev => ({...prev, font_weight: value}))}>
            <SelectTrigger data-testid="announcement-font-weight-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="400">Normal</SelectItem>
              <SelectItem value="500">Medium</SelectItem>
              <SelectItem value="600">Semi Bold</SelectItem>
              <SelectItem value="700">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Direction</label>
          <Select value={formData.direction} onValueChange={(value) => setFormData(prev => ({...prev, direction: value}))}>
            <SelectTrigger data-testid="announcement-direction-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="up">Up</SelectItem>
              <SelectItem value="down">Down</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Speed (px/s)</label>
          <Input
            name="animation_speed"
            type="number"
            value={formData.animation_speed}
            onChange={handleChange}
            placeholder="50"
            min="10"
            max="200"
            data-testid="announcement-speed-input"
          />
        </div>
      </div>

      {/* Date Range & Limits */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <Input
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
            data-testid="announcement-start-date-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <Input
            name="end_date"
            type="date"
            value={formData.end_date}
            onChange={handleChange}
            data-testid="announcement-end-date-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Displays</label>
          <Input
            name="max_displays"
            type="number"
            value={formData.max_displays}
            onChange={handleChange}
            placeholder="Unlimited"
            min="1"
            data-testid="announcement-max-displays-input"
          />
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-sm font-medium mb-2">Preview</label>
        <div 
          className="p-3 rounded border overflow-hidden relative min-h-[50px] flex items-center"
          style={{
            backgroundColor: formData.background_color,
            color: formData.text_color,
            fontSize: formData.font_size,
            fontWeight: formData.font_weight
          }}
        >
          <div className="whitespace-nowrap">
            {formData.message || 'Your announcement message will appear here...'}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Display Order</label>
          <Input
            name="display_order"
            type="number"
            value={formData.display_order}
            onChange={handleChange}
            placeholder="0"
            min="0"
            data-testid="announcement-display-order-input"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              data-testid="announcement-active-checkbox"
            />
            <span className="text-sm font-medium">Active</span>
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
          data-testid="submit-announcement-button"
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Announcement' : 'Create Announcement'}
        </Button>
      </div>
    </form>
  );
};

// ==================== ADVERTISEMENT MANAGEMENT ====================

const AdvertisementManagement = () => {
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editAdvertisement, setEditAdvertisement] = useState(null);

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/advertisements`, {
        headers: getAuthHeaders()
      });
      setAdvertisements(response.data);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      toast.error('Failed to fetch advertisements');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdvertisement = async (adId) => {
    if (window.confirm('Are you sure you want to delete this advertisement?')) {
      try {
        await axios.delete(`${API}/advertisements/${adId}`, {
          headers: getAuthHeaders()
        });
        toast.success('Advertisement deleted successfully');
        fetchAdvertisements();
      } catch (error) {
        toast.error('Failed to delete advertisement');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Advertisement Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600" data-testid="add-advertisement-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Advertisement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add New Advertisement</DialogTitle>
            </DialogHeader>
            <AdvertisementForm onSuccess={() => {
              setIsAddDialogOpen(false);
              fetchAdvertisements();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advertisements.map((ad) => (
            <Card key={ad.id} className="overflow-hidden" data-testid="advertisement-card">
              <div className="relative">
                <img 
                  src={ad.media_url} 
                  alt={ad.title}
                  className="w-full h-48 object-cover"
                />
                <Badge 
                  className={`absolute top-2 right-2 ${ad.is_active ? 'bg-green-500' : 'bg-gray-500'}`}
                >
                  {ad.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge className="absolute top-2 left-2 bg-blue-500">
                  {ad.ad_type}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">{ad.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ad.description}</p>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Placement:</span>
                    <p className="font-medium capitalize">{ad.placement.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Impressions:</span>
                    <p className="font-medium">{ad.impression_count || 0}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Clicks:</span>
                    <p className="font-medium">{ad.click_count || 0}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">CTR:</span>
                    <p className="font-medium">
                      {ad.impression_count > 0 ? ((ad.click_count / ad.impression_count) * 100).toFixed(2) : 0}%
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setEditAdvertisement(ad)}
                    data-testid="edit-advertisement-button"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDeleteAdvertisement(ad.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Advertisement Dialog */}
      <Dialog open={!!editAdvertisement} onOpenChange={() => setEditAdvertisement(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Advertisement</DialogTitle>
          </DialogHeader>
          {editAdvertisement && (
            <AdvertisementForm 
              advertisement={editAdvertisement}
              onSuccess={() => {
                setEditAdvertisement(null);
                fetchAdvertisements();
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Advertisement Form Component
const AdvertisementForm = ({ advertisement, onSuccess }) => {
  const isEdit = !!advertisement;
  const [formData, setFormData] = useState({
    title: advertisement?.title || '',
    description: advertisement?.description || '',
    ad_type: advertisement?.ad_type || 'banner',
    placement: advertisement?.placement || 'hero_section',
    media_url: advertisement?.media_url || '',
    media_type: advertisement?.media_type || 'image',
    click_url: advertisement?.click_url || '',
    cta_text: advertisement?.cta_text || 'Shop Now',
    target_audience: advertisement?.target_audience || 'all',
    display_order: advertisement?.display_order || 0,
    is_active: advertisement?.is_active ?? true,
    start_date: advertisement?.start_date ? advertisement.start_date.split('T')[0] : '',
    end_date: advertisement?.end_date ? advertisement.end_date.split('T')[0] : '',
    budget_limit: advertisement?.budget_limit || '',
    cost_per_click: advertisement?.cost_per_click || ''
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const advertisementData = {
        ...formData,
        display_order: parseInt(formData.display_order) || 0,
        budget_limit: formData.budget_limit ? parseFloat(formData.budget_limit) : null,
        cost_per_click: formData.cost_per_click ? parseFloat(formData.cost_per_click) : null,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
      };

      if (isEdit) {
        await axios.put(`${API}/advertisements/${advertisement.id}`, advertisementData, {
          headers: getAuthHeaders()
        });
        toast.success('Advertisement updated successfully');
      } else {
        await axios.post(`${API}/advertisements`, advertisementData, {
          headers: getAuthHeaders()
        });
        toast.success('Advertisement created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving advertisement:', error);
      toast.error('Failed to save advertisement');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <Input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Advertisement title"
            required
            data-testid="advertisement-title-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ad Type</label>
          <Select value={formData.ad_type} onValueChange={(value) => setFormData(prev => ({...prev, ad_type: value}))}>
            <SelectTrigger data-testid="advertisement-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="banner">Banner</SelectItem>
              <SelectItem value="popup">Popup</SelectItem>
              <SelectItem value="inline">Inline</SelectItem>
              <SelectItem value="carousel">Carousel</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Advertisement description"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows="3"
          data-testid="advertisement-description-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Media URL *</label>
          <Input
            name="media_url"
            type="url"
            value={formData.media_url}
            onChange={handleChange}
            placeholder="https://example.com/ad-image.jpg"
            required
            data-testid="advertisement-media-url-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Placement</label>
          <Select value={formData.placement} onValueChange={(value) => setFormData(prev => ({...prev, placement: value}))}>
            <SelectTrigger data-testid="advertisement-placement-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hero_section">Hero Section</SelectItem>
              <SelectItem value="product_grid">Product Grid</SelectItem>
              <SelectItem value="sidebar">Sidebar</SelectItem>
              <SelectItem value="footer">Footer</SelectItem>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="between_products">Between Products</SelectItem>
              <SelectItem value="checkout">Checkout</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Media Type</label>
          <Select value={formData.media_type} onValueChange={(value) => setFormData(prev => ({...prev, media_type: value}))}>
            <SelectTrigger data-testid="advertisement-media-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="carousel">Carousel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">CTA Text</label>
          <Input
            name="cta_text"
            value={formData.cta_text}
            onChange={handleChange}
            placeholder="Shop Now"
            data-testid="advertisement-cta-text-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Target Audience</label>
          <Select value={formData.target_audience} onValueChange={(value) => setFormData(prev => ({...prev, target_audience: value}))}>
            <SelectTrigger data-testid="advertisement-target-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="new_users">New Users</SelectItem>
              <SelectItem value="returning_users">Returning Users</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Click URL</label>
        <Input
          name="click_url"
          type="url"
          value={formData.click_url}
          onChange={handleChange}
          placeholder="https://example.com/landing-page"
          data-testid="advertisement-click-url-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <Input
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
            data-testid="advertisement-start-date-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <Input
            name="end_date"
            type="date"
            value={formData.end_date}
            onChange={handleChange}
            data-testid="advertisement-end-date-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Display Order</label>
          <Input
            name="display_order"
            type="number"
            value={formData.display_order}
            onChange={handleChange}
            placeholder="0"
            min="0"
            data-testid="advertisement-display-order-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Budget Limit (₹)</label>
          <Input
            name="budget_limit"
            type="number"
            value={formData.budget_limit}
            onChange={handleChange}
            placeholder="1000"
            min="0"
            step="0.01"
            data-testid="advertisement-budget-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cost Per Click (₹)</label>
          <Input
            name="cost_per_click"
            type="number"
            value={formData.cost_per_click}
            onChange={handleChange}
            placeholder="5.00"
            min="0"
            step="0.01"
            data-testid="advertisement-cpc-input"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          data-testid="advertisement-active-checkbox"
        />
        <label className="text-sm font-medium">Active</label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={submitting}
          className="bg-orange-500 hover:bg-orange-600" 
          data-testid="submit-advertisement-button"
        >
          {submitting ? 'Saving...' : isEdit ? 'Update Advertisement' : 'Create Advertisement'}
        </Button>
      </div>
    </form>
  );
};

export default AdminPanel;