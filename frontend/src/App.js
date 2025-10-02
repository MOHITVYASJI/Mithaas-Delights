import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { ShoppingCart, User, Search, Menu, X, Star, ChevronRight, MapPin, Phone, Mail, Clock, Heart, LogOut, UserCircle, Package } from 'lucide-react';
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./components/ui/dropdown-menu";
import { AdminPanel } from "./components/AdminPanel";
import { CartDialog } from "./components/CartCheckout";
import { ChatBot } from "./components/ChatBot";
import { AuthModals } from "./components/auth/AuthModel";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { TermsAndConditions, PrivacyPolicy } from "./pages/Policies";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { BulkOrderPage } from "./pages/BulkOrderPage";
import { MediaGalleryPage } from "./pages/MediaGalleryPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { OrderTrackingPage } from "./pages/OrderTrackingPage";
import { loadCartFromLocalStorage, saveCartToLocalStorage, clearCartFromLocalStorage } from "./utils/cartStorage";
import "./App.css";
import "./components/images/Premium_mithai.png";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context for cart management with proper variant support
const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = loadCartFromLocalStorage();
    if (savedCart && savedCart.length > 0) {
      setCartItems(savedCart);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cartItems.length >= 0) {
      saveCartToLocalStorage(cartItems);
    }
  }, [cartItems]);

  // Generate unique cart item key: product_id + variant_weight
  const getCartItemKey = (item) => `${item.id}-${item.weight || 'default'}`;

  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const productKey = getCartItemKey(product);
      const existingItem = prevItems.find(item => getCartItemKey(item) === productKey);
      
      if (existingItem) {
        // Item with same product ID and variant exists, update quantity
        const updatedItems = prevItems.map(item =>
          getCartItemKey(item) === productKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        return updatedItems;
      } else {
        // New item (or same product with different variant)
        return [...prevItems, { ...product, quantity }];
      }
    });
    
    const variantText = product.weight ? ` (${product.weight})` : '';
    toast.success(`${product.name}${variantText} added to cart!`);
  };

  const removeFromCart = (productKey) => {
    setCartItems(prevItems => prevItems.filter(item => getCartItemKey(item) !== productKey));
  };

  const updateQuantity = (productKey, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productKey);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        getCartItemKey(item) === productKey ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    clearCartFromLocalStorage();
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  useEffect(() => {
    setCartCount(cartItems.reduce((total, item) => total + item.quantity, 0));
  }, [cartItems]);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Header Component with Authentication
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const { cartCount } = useCart();
  const { user, logout, isAuthenticated, loading } = useAuth();

  const handleAuthClick = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axios.get(`${API}/products/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-amber-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                Mithaas Delights
              </h1>
              <p className="text-xs text-gray-500">Premium Sweets & Snacks</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-gray-700 hover:text-orange-600 transition-colors">Home</a>
            <a href="/#products" className="text-gray-700 hover:text-orange-600 transition-colors">Products</a>
            <a href="/#about" className="text-gray-700 hover:text-orange-600 transition-colors">About</a>
            <a href="/#contact" className="text-gray-700 hover:text-orange-600 transition-colors">Contact</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="search-button">
                  <Search className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Search Products</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Search for sweets, namkeen, or snacks..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    autoFocus
                    data-testid="search-input"
                  />
                  {searchLoading && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    </div>
                  )}
                  {!searchLoading && searchResults.length > 0 && (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center space-x-4 p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => {
                            setSearchOpen(false);
                            window.location.href = `/#products`;
                          }}
                        >
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{product.name}</h4>
                            <p className="text-sm text-gray-600 line-clamp-1">{product.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {product.variants && product.variants.length > 0 && (
                                <span className="text-sm font-semibold text-orange-600">
                                  From ₹{Math.min(...product.variants.map(v => v.price))}
                                </span>
                              )}
                              <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No products found for "{searchQuery}"
                    </div>
                  )}
                  {searchQuery.length > 0 && searchQuery.length < 2 && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      Type at least 2 characters to search
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Authentication Section */}
            {loading ? (
              <Button variant="ghost" size="sm" disabled>
                <User className="w-5 h-5" />
              </Button>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="user-menu-trigger">
                    <UserCircle className="w-5 h-5" />
                    <span className="ml-2 hidden sm:inline">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/orders'}>
                    <Package className="w-4 h-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                      <User className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleAuthClick('login')}
                  data-testid="login-button"
                >
                  Login
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAuthClick('register')}
                  className="hidden sm:inline-flex"
                  data-testid="signup-button"
                >
                  Sign Up
                </Button>
              </div>
            )}

            <CartDialog>
              <Button variant="ghost" size="sm" className="relative" data-testid="cart-button">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-orange-500 text-xs p-0 flex items-center justify-center">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </CartDialog>
            
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-amber-100 pt-4">
            <div className="flex flex-col space-y-3">
              <a href="#home" className="text-gray-700 hover:text-orange-600 transition-colors">Home</a>
              <a href="#products" className="text-gray-700 hover:text-orange-600 transition-colors">Products</a>
              <a href="#about" className="text-gray-700 hover:text-orange-600 transition-colors">About</a>
              <a href="#contact" className="text-gray-700 hover:text-orange-600 transition-colors">Contact</a>
              {!isAuthenticated && (
                <div className="flex flex-col space-y-2 pt-2 border-t border-amber-100">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleAuthClick('login')}
                    className="justify-start"
                  >
                    Login
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAuthClick('register')}
                    className="justify-start"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModals 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </header>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/" replace />;
  }

  return children;
};

// Product Card Component
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    if (user && user.wishlist) {
      setIsInWishlist(user.wishlist.includes(product.id));
    }
  }, [user, product.id]);

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (isInWishlist) {
        await axios.delete(`${API}/wishlist/remove/${product.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Removed from wishlist');
        setIsInWishlist(false);
      } else {
        await axios.post(`${API}/wishlist/add/${product.id}`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Added to wishlist');
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error('Failed to update wishlist');
    }
  };

  // Get the minimum price from variants
  const getMinPrice = () => {
    if (product.variants && product.variants.length > 0) {
      return Math.min(...product.variants.map(v => v.price));
    }
    return product.price || 0;
  };

  const handleViewDetails = () => {
    window.location.href = `/product/${product.id}`;
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white border border-amber-100" data-testid="product-card">
      <div 
        className="relative overflow-hidden cursor-pointer"
        onClick={handleViewDetails}
      >
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
        {product.is_featured && (
          <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
            Featured
          </Badge>
        )}
        {product.is_sold_out && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge className="bg-red-600 text-white">SOLD OUT</Badge>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-2 right-2 bg-white/90 hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist();
          }}
          data-testid="wishlist-toggle-button"
        >
          <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </Button>
      </div>
      <CardContent className="p-4">
        <h3 
          className="font-semibold text-lg text-gray-800 mb-2 cursor-pointer hover:text-orange-600 transition-colors" 
          data-testid="product-name"
          onClick={handleViewDetails}
        >
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-orange-600" data-testid="product-price">
              From ₹{getMinPrice()}
            </span>
          </div>
          {product.variants && product.variants.length > 0 && (
            <span className="text-xs text-gray-500">{product.variants.length} variants</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm text-gray-600">{product.rating || 4.5} ({product.review_count || 0})</span>
          </div>
          <Button 
            size="sm" 
            onClick={handleViewDetails}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            data-testid="view-details-button"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Hero Section Component
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 overflow-hidden" id="home">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,146,60,0.1)_0%,transparent_50%)]"></div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-orange-100 text-orange-700 border-orange-200" data-testid="hero-badge">
                🎉 Festival Special Offers Available
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                  Premium
                </span>
                <br />
                <span className="text-gray-800">Indian Sweets</span>
                <br />
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  & Delights
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-lg">
                Experience the authentic taste of traditional Indian mithai and namkeen, 
                crafted with love and the finest ingredients.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 text-lg"
                data-testid="shop-now-button"
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Shop Now
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-orange-300 text-orange-700 hover:bg-orange-50 px-8 py-4 text-lg"
                data-testid="explore-button"
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Catalog
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-orange-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600" data-testid="happy-customers-count">5K+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600" data-testid="products-count">50+</div>
                <div className="text-sm text-gray-600">Premium Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600" data-testid="cities-count">10+</div>
                <div className="text-sm text-gray-600">Cities Served</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="/Premium_mithai.png"
                alt="Premium Indian Sweets"
                className="w-full h-96 lg:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full opacity-30 animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Products Section
const ProductsSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'mithai', label: 'Mithai' },
    { value: 'namkeen', label: 'Namkeen' },
    { value: 'laddu', label: 'Laddu' },
    { value: 'bengali_sweets', label: 'Bengali Sweets' },
    { value: 'dry_fruit_sweets', label: 'Dry Fruit Sweets' }
  ];

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'all' 
        ? `${API}/products`
        : `${API}/products?category=${selectedCategory}`;
      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-white" id="products">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-orange-100 text-orange-700 mb-4">Our Products</Badge>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Premium Collection of
            <span className="block bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Sweets & Snacks
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our handcrafted selection of traditional Indian sweets and savory snacks, 
            made with authentic recipes and the finest ingredients.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.value)}
              className={selectedCategory === category.value 
                ? "bg-orange-500 hover:bg-orange-600" 
                : "border-orange-200 text-orange-700 hover:bg-orange-50"
              }
              data-testid={`category-filter-${category.value}`}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};

// About Section
const AboutSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 to-amber-50" id="about">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-orange-100 text-orange-700 mb-4">About Us</Badge>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Crafting Sweet Memories Since
              <span className="block bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Three Generations
              </span>
            </h2>
            <p className="text-gray-600 mb-6">
              At Mithaas Delights, we believe in preserving the authentic taste of traditional Indian sweets 
              while embracing modern quality standards. Our master chefs use time-honored recipes passed down 
              through generations, combined with the finest ingredients sourced from across India.
            </p>
            <p className="text-gray-600 mb-8">
              From the rich, creamy texture of our Kaju Katli to the perfectly spiced Masala Mixture, 
              every product is crafted with love, care, and attention to detail. We're not just making sweets; 
              we're creating moments of joy and celebration.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-white rounded-lg border border-orange-100">
                <div className="text-2xl font-bold text-orange-600 mb-2">100%</div>
                <div className="text-sm text-gray-600">Pure Ingredients</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-orange-100">
                <div className="text-2xl font-bold text-orange-600 mb-2">0</div>
                <div className="text-sm text-gray-600">Artificial Colors</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <img 
                src="https://lh3.googleusercontent.com/gg/AAHar4cFdaQc-K1pKHWOLD44h9jHoYa7m5N_R6oDbsPIFn4WSEOSqvcTkt61AYNQUW5bnUUbvJVaWLCvkRqh2UBrcP0cFsqAeJHyl9FUFK7DWd3jM86hCMn1Y6-ofPRLIMW5JwKTGGg2sG0c369sOvWCtjP0RmbflspHLapvEf5UvxjZpLeANvHaT-ggF_uNomK1IHTDjaNYB6-eM-uXtq6A0SidHAyVZdG8JUXrwpn5VqnYyKVN6H5JSEhL6rZbWM-JILbctYCT0qCfCxb579B4mkVNhj3LBCFoLRsnrj5RA5E0SMLp_ouLmFTe65AmdNOdK1CkGKqSh6wTHoclYlvFnLtq=s1024"
                alt="Traditional sweet making"
                className="rounded-lg shadow-md"
              />
              <img 
                src="https://lh3.googleusercontent.com/gg-dl/AJfQ9KTh9gCdVMwkvObt7am5S_JwcYSqOHIqxhv0PINvV1fVYmm9lp3xd5kzXfwoeHHQo40XAA0xeoWCfpS6azXz6LrFhk3WYhw17nzC_uw6S7Y8dbLOl4-0PkF4SL5eZ-8e7zwACJaZedBD0stqObrpCRSjViMontbAsN-XBUrimD0Zuw0CZw=s1024"
                alt="Premium ingredients"
                className="rounded-lg shadow-md"
              />
            </div>
            <div className="space-y-4 mt-8">
              <img 
                src="https://lh3.googleusercontent.com/gg/AAHar4e6yrcbXa60SQNMLkX1cHkFbu7iUSFpHWKgS6zW6UCv3c_v5DvxaP3cHqbKpj7fIbw_D_JW4wb-2vke8ZWUEkKxhuPsDlqo1V3buyFSWCWMrUoOrLtTEnuSObiWoB41llrFW4lSeufINs-CjztOPbrRHHWwgB-Rz0bqvkugYn58-2B69LRgaKBkkyTKv4Nr9f-EklU96i4KvKDms46tvcBiiYVCfT9w0eJSlmLfXnV-j5oCROe7qwDBnQtv0HJT8newVslw6T3mDOwXf_tLVYYcBVR5uco91HLh9hMFqq08TVyXMaQcL03r1GMmfdFiLOQneetFKUkdWY14z0-q7602=s1024"
                alt="Handcrafted sweets"
                className="rounded-lg shadow-md"
              />
              <img 
                src="https://lh3.googleusercontent.com/gg/AAHar4eafvtf5YSBhFxQEokS0adf8l2czmhsCLz8GHdaeoqRaEd4G2rTBmS6qE2NzAB50OTmf1QK74zgAKQQhhRO6Bu3EG97_gJVUHBrGZI3546SoGDxw0uLpCj4bf81vJh24vWKOg17kd8Vq5Y0rS91lXJo22ifdoMVfF8qQlMc3H1aig-gBRDPhKXP15TFCJDTT0mX0yur1X1xnapF2tw_8B_pfZXtbR3tZwxlzG9o3Si6N2yfXxsPwINk1kVAY9FyKZKmdEgPu8v5Hag4e119XDTV21BSY_h3uHhZpP1naB3WhHUlaGip8_NyXPZu5tTE0LSPKaEmgICNGjD5gL_KZzp8=s1024"
                alt="Quality testing"
                className="rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API}/contact`, contactData);
      toast.success('Message sent successfully! We will get back to you soon.');
      setContactData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-white" id="contact">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-orange-100 text-orange-700 mb-4">Get In Touch</Badge>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Contact
            <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent"> Us</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Have questions about our products or need help with your order? 
            We're here to help you every step of the way.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Visit Our Store</h3>
                <p className="text-gray-600">64, Kaveri Nagar, Indore, Madhya Pradesh 452006, India</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Call Us</h3>
                <p className="text-gray-600">+91 8989549544</p>
                <p className="text-gray-600">+91 9754681201</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Email Us</h3>
                <p className="text-gray-600">mithaasdelightsofficial@gmail.com</p>
                <p className="text-gray-600">support@mithaasdelights.com</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Store Hours</h3>
                <p className="text-gray-600">Mon - Sat: 9:00 AM - 9:00 PM</p>
                <p className="text-gray-600">Sunday: 10:00 AM - 8:00 PM</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    placeholder="Your Name" 
                    value={contactData.name}
                    onChange={(e) => setContactData({...contactData, name: e.target.value})}
                    required
                    data-testid="contact-name-input" 
                  />
                  <Input 
                    placeholder="Your Email" 
                    type="email" 
                    value={contactData.email}
                    onChange={(e) => setContactData({...contactData, email: e.target.value})}
                    required
                    data-testid="contact-email-input" 
                  />
                </div>
                <Input 
                  placeholder="Subject" 
                  value={contactData.subject}
                  onChange={(e) => setContactData({...contactData, subject: e.target.value})}
                  required
                  data-testid="contact-subject-input" 
                />
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows="4"
                  placeholder="Your Message"
                  value={contactData.message}
                  onChange={(e) => setContactData({...contactData, message: e.target.value})}
                  required
                  data-testid="contact-message-input"
                ></textarea>
                <Button 
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  data-testid="send-message-button"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="text-xl font-bold">Mithaas Delights</span>
            </div>
            <p className="text-gray-400 mb-4">
              Premium Indian sweets and snacks crafted with love and tradition.
            </p>
            <div className="bg-orange-900/30 px-3 py-2 rounded-lg">
              <p className="text-xs font-semibold text-orange-300 mb-1">FSSAI License</p>
              <p className="text-sm text-gray-300">12345678901234</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#home" className="hover:text-orange-400 transition-colors">Home</a></li>
              <li><a href="#products" className="hover:text-orange-400 transition-colors">Products</a></li>
              <li><a href="#about" className="hover:text-orange-400 transition-colors">About</a></li>
              <li><a href="#contact" className="hover:text-orange-400 transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/terms" className="hover:text-orange-400 transition-colors">Terms & Conditions</a></li>
              <li><a href="/privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</a></li>
              <li><a href="/track-order" className="hover:text-orange-400 transition-colors">Track Order</a></li>
              <li><a href="#contact" className="hover:text-orange-400 transition-colors">Contact Us</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="https://www.instagram.com/mithaasdelightsofficial?igsh=aW85Z2h6bTEwazJv" className="hover:text-orange-400 transition-colors">Instagram</a></li>
              <li><a href="https://wa.me/918989549544" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">WhatsApp</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Twitter</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Mithaas Delights. All rights reserved. Made with ❤️ in India.</p>
          <p className="text-xs mt-2">Certified by Food Safety and Standards Authority of India</p>
        </div>
      </div>
    </footer>
  );
};

// User Profile Page
const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'wishlist') {
      fetchWishlist();
    }
  }, [activeTab]);
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/orders/user/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setWishlistProducts(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/auth/profile`, profileData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/wishlist/remove/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/orders/${orderId}/cancel`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success(response.data.message);
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.detail || 'Failed to cancel order');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account and preferences</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'profile' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                      }`}
                      data-testid="profile-tab"
                    >
                      Profile Information
                    </button>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'orders' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                      }`}
                      data-testid="orders-tab"
                    >
                      My Orders
                    </button>
                    <button
                      onClick={() => setActiveTab('wishlist')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'wishlist' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                      }`}
                      data-testid="wishlist-tab"
                    >
                      Wishlist
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
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <Input 
                          value={profileData.name} 
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          disabled={!isEditingProfile}
                          data-testid="profile-name-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input value={user?.email || ''} readOnly className="bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Phone</label>
                        <Input 
                          value={profileData.phone} 
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          disabled={!isEditingProfile}
                          placeholder="Add phone number"
                          data-testid="profile-phone-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Role</label>
                        <Input value={user?.role || ''} readOnly className="bg-gray-50" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {!isEditingProfile ? (
                        <Button 
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => setIsEditingProfile(true)}
                          data-testid="edit-profile-button"
                        >
                          Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button 
                            className="bg-orange-500 hover:bg-orange-600"
                            onClick={handleProfileUpdate}
                            data-testid="save-profile-button"
                          >
                            Save Changes
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setIsEditingProfile(false);
                              setProfileData({
                                name: user?.name || '',
                                phone: user?.phone || ''
                              });
                            }}
                            data-testid="cancel-edit-button"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'orders' && (
                <Card data-testid="orders-content">
                  <CardHeader>
                    <CardTitle>My Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No orders found</p>
                        <Button 
                          onClick={() => window.location.href = '/#products'}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          Start Shopping
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold text-lg">Order #{order.id.slice(0, 8)}</p>
                                <p className="text-sm text-gray-600">
                                  Placed on {new Date(order.created_at).toLocaleString()}
                                </p>
                              </div>
                              <Badge className={`${
                                order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {order.status.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 mb-3">
                              <div className="border-t pt-3">
                                <p className="text-sm text-gray-600 mb-2 font-medium">Order Items:</p>
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm py-1">
                                    <span className="text-gray-700">{item.variant_weight} × {item.quantity}</span>
                                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Payment Method:</span>
                                <span className="text-sm font-medium">{order.payment_method.toUpperCase()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Payment Status:</span>
                                <Badge variant="outline" className={`text-xs ${
                                  order.payment_status === 'completed' ? 'border-green-500 text-green-700' : 
                                  order.payment_status === 'failed' ? 'border-red-500 text-red-700' :
                                  order.payment_status === 'refunded' ? 'border-blue-500 text-blue-700' :
                                  'border-orange-500 text-orange-700'
                                }`}>
                                  {order.payment_status}
                                </Badge>
                              </div>
                              {order.discount_amount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Discount Applied:</span>
                                  <span className="text-sm text-green-600 font-medium">-₹{order.discount_amount}</span>
                                </div>
                              )}
                            </div>

                            <div className="border-t pt-3 mb-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Total Amount:</span>
                                <span className="text-xl font-bold text-orange-600">₹{order.final_amount || order.total_amount}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {order.whatsapp_link && (
                                <a
                                  href={order.whatsapp_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  Contact via WhatsApp
                                </a>
                              )}
                              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="text-red-600 hover:text-red-700 border-red-300"
                                  data-testid="cancel-order-button"
                                >
                                  Cancel Order
                                </Button>
                              )}
                            </div>

                            <div className="border-t pt-3 mt-3">
                              <p className="text-xs text-gray-500">
                                Delivery Address: {order.delivery_address}
                              </p>
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
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                      </div>
                    ) : wishlistProducts.length === 0 ? (
                      <div className="text-center py-8">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Your wishlist is empty</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlistProducts.map((product) => (
                          <Card key={product.id} className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 z-10 text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveFromWishlist(product.id)}
                              data-testid="remove-wishlist-button"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <div className="relative overflow-hidden">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-48 object-cover"
                              />
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-orange-600">
                                  From ₹{product.variants && product.variants.length > 0 
                                    ? Math.min(...product.variants.map(v => v.price))
                                    : product.price || 0}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => window.location.href = `/product/${product.id}`}
                                  className="bg-orange-500 hover:bg-orange-600"
                                >
                                  View
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

// Main Home Component
const Home = () => {
  useEffect(() => {
    // Initialize sample data and admin user
    const initializeData = async () => {
      try {
        await axios.post(`${API}/init-sample-data`);
        await axios.post(`${API}/init-admin`);
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };
    
    initializeData();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <ProductsSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

// Order Tracking Page Component
const OrderTracking = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const trackOrder = async () => {
    if (!orderId.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      toast.error('Order not found');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Track Your Order</h1>
            <p className="text-gray-600">Enter your order ID to track the status of your delivery</p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter Order ID (e.g., ORD-123456)"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="flex-1"
                  data-testid="order-id-input"
                />
                <Button 
                  onClick={trackOrder}
                  disabled={loading}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="track-order-button"
                >
                  {loading ? 'Tracking...' : 'Track Order'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {order && (
            <Card data-testid="order-details">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-semibold">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className="bg-orange-100 text-orange-700 capitalize">
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold">₹{order.total_amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-semibold">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Delivery Address</p>
                    <p className="font-semibold">{order.delivery_address}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Items Ordered</p>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span>Product ID: {item.product_id} (Qty: {item.quantity})</span>
                          <span>₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Protected Admin Panel Component  
const ProtectedAdminPanel = () => {
  return (
    <ProtectedRoute adminOnly={true}>
      <AdminPanel />
    </ProtectedRoute>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:productId" element={<ProductDetailPage Header={Header} Footer={Footer} />} />
              <Route path="/track-order" element={<OrderTracking />} />
              <Route path="/track-order/:orderId" element={<OrderTrackingPage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />
              <Route path="/bulk-orders" element={<BulkOrderPage />} />
              <Route path="/gallery" element={<MediaGalleryPage />} />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/admin" element={<ProtectedAdminPanel />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <ChatBot />
          <Toaster />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;