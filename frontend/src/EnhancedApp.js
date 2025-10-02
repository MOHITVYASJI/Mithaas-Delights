import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { 
  ShoppingCart, User, Search, Menu, X, Star, ChevronRight, MapPin, Phone, Mail, 
  Clock, Heart, LogOut, UserCircle, Package, Bell, Palette, Zap, Settings 
} from 'lucide-react';
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./components/ui/dropdown-menu";

// Enhanced Components
import { AdminPanel } from "./components/AdminPanel";
import { EnhancedAdminPanel } from "./components/EnhancedAdminPanel";
import { CartDialog } from "./components/CartCheckout";
import { ChatBot } from "./components/ChatBot";
import { EnhancedChatBot } from "./components/EnhancedChatBot";
import { AuthModals } from "./components/auth/AuthModel";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider, NotificationBell } from "./components/EnhancedNotifications";
import { EnhancedBannerCarousel, EnhancedSmallBanner } from "./components/EnhancedBanners";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

// Pages
import { TermsAndConditions, PrivacyPolicy } from "./pages/Policies";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { BulkOrderPage } from "./pages/BulkOrderPage";
import { MediaGalleryPage } from "./pages/MediaGalleryPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { OrderTrackingPage } from "./pages/OrderTrackingPage";

// Utils
import { loadCartFromLocalStorage, saveCartToLocalStorage, clearCartFromLocalStorage } from "./utils/cartStorage";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Enhanced Theme Context
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Provider Component
const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(null);
  const [themeCSS, setThemeCSS] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveTheme();
  }, []);

  const loadActiveTheme = async () => {
    try {
      setLoading(true);
      
      // Try to load enhanced theme
      try {
        const themeResponse = await axios.get(`${API}/themes/enhanced/active`);
        const cssResponse = await axios.get(`${API}/themes/enhanced/active/css`);
        
        setCurrentTheme(themeResponse.data);
        setThemeCSS(cssResponse.data.css);
        
        // Apply theme CSS
        applyThemeCSS(cssResponse.data.css);
      } catch (error) {
        console.warn('Enhanced themes not available, using default theme');
        // Fallback to default theme
        setCurrentTheme({ name: 'default', display_name: 'Default Orange' });
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      setCurrentTheme({ name: 'default', display_name: 'Default Orange' });
    } finally {
      setLoading(false);
    }
  };

  const applyThemeCSS = (css) => {
    // Remove existing theme styles
    const existingStyle = document.getElementById('dynamic-theme-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new theme styles
    const styleElement = document.createElement('style');
    styleElement.id = 'dynamic-theme-styles';
    styleElement.innerHTML = css;
    document.head.appendChild(styleElement);
  };

  const refreshTheme = async () => {
    await loadActiveTheme();
  };

  const value = {
    currentTheme,
    themeCSS,
    loading,
    refreshTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Enhanced Cart Context
const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated } = useAuth();

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

  // Sync cart with server when user logs in
  useEffect(() => {
    if (isAuthenticated && cartItems.length > 0) {
      syncCartWithServer();
    }
  }, [isAuthenticated]);

  const syncCartWithServer = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Convert cart items to server format
      const serverCartItems = cartItems.map(item => ({
        product_id: item.id,
        variant_weight: item.weight || 'default',
        quantity: item.quantity,
        price: item.price
      }));

      const response = await axios.post(
        `${API}/cart/enhanced/sync`,
        serverCartItems,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.items) {
        // Update local cart with synced data
        const syncedCart = response.data.items.map(item => ({
          id: item.product_id,
          weight: item.variant_weight,
          quantity: item.quantity,
          price: item.price,
          // Add other product details as needed
        }));
        
        setCartItems(syncedCart);
        toast.success(`Cart synced: ${response.data.item_count} items`);
      }
    } catch (error) {
      console.error('Error syncing cart:', error);
      // Don't show error to user as this is background sync
    }
  };

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
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  useEffect(() => {
    setCartCount(getItemCount());
  }, [cartItems]);

  const value = {
    cartItems,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getItemCount,
    getCartItemKey,
    syncCartWithServer
  };

  return (
    <CartContext.Provider value={value}>
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

// Enhanced Header Component
const EnhancedHeader = ({ onOpenAuth, searchQuery, setSearchQuery }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const { currentTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Mithaas Delights
              </h1>
              {currentTheme && currentTheme.name !== 'default' && (
                <Badge variant="outline" className="text-xs">
                  <Palette className="w-2 h-2 mr-1" />
                  {currentTheme.display_name}
                </Badge>
              )}
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search for sweets and snacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 w-full"
                data-testid="search-input"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            {isAuthenticated && (
              <NotificationBell />
            )}

            {/* Cart */}
            <CartDialog>
              <Button variant="ghost" className="relative" data-testid="cart-button">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-orange-500 text-xs p-0 flex items-center justify-center">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </CartDialog>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2" data-testid="user-menu">
                    <UserCircle className="w-5 h-5" />
                    <span className="hidden md:block">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Package className="w-4 h-4 mr-2" />
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Heart className="w-4 h-4 mr-2" />
                    Wishlist
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                        <Settings className="w-4 h-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = '/admin-enhanced'}>
                        <Zap className="w-4 h-4 mr-2" />
                        Enhanced Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={onOpenAuth} data-testid="login-button">
                <User className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search for sweets and snacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 w-full"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// Enhanced Home Page Component
const EnhancedHomePage = ({ searchQuery }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
      setFeaturedProducts(response.data.filter(p => p.is_featured));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = (product, variant = null) => {
    const productToAdd = {
      ...product,
      price: variant ? variant.price : product.price || 0,
      weight: variant ? variant.weight : null,
      originalPrice: variant ? variant.original_price : product.original_price
    };
    addToCart(productToAdd, 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Hero Banner */}
      <section className="relative">
        <EnhancedBannerCarousel placement="hero" />
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Badge className="bg-orange-500">
              <Star className="w-3 h-3 mr-1" />
              Bestsellers
            </Badge>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/300/300';
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span className="font-bold text-orange-600">₹{product.price || 0}</span>
                        {product.original_price && (
                          <span className="text-sm text-gray-500 line-through">₹{product.original_price}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{product.rating}</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleAddToCart(product)}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      size="sm"
                      data-testid="add-to-cart-button"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Our Products'}
          </h2>
          <span className="text-sm text-gray-600">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </span>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="aspect-square bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg mb-3 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/300/300';
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  
                  <Badge variant="outline" className="text-xs">
                    {product.category.replace('_', ' ')}
                  </Badge>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-orange-600">₹{product.price || 0}</span>
                      {product.original_price && (
                        <span className="text-sm text-gray-500 line-through">₹{product.original_price}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{product.rating}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    size="sm"
                    data-testid="add-to-cart-button"
                  >
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try searching with different keywords or browse all products.</p>
          </div>
        )}
      </section>

      {/* Sidebar Banners */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3"></div>
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Special Offers</h3>
            <EnhancedSmallBanner placement="sidebar" />
          </div>
        </div>
      </section>
    </div>
  );
};

// Main Enhanced App Component
function EnhancedApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider>
          <CartProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-gray-50">
                <EnhancedHeader 
                  onOpenAuth={() => setShowAuthModal(true)}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
                
                <main>
                  <Routes>
                    <Route 
                      path="/" 
                      element={<EnhancedHomePage searchQuery={searchQuery} />} 
                    />
                    <Route 
                      path="/admin" 
                      element={<AdminPanel />} 
                    />
                    <Route 
                      path="/admin-enhanced" 
                      element={<EnhancedAdminPanel />} 
                    />
                    <Route 
                      path="/product/:id" 
                      element={<ProductDetailPage />} 
                    />
                    <Route 
                      path="/bulk-order" 
                      element={<BulkOrderPage />} 
                    />
                    <Route 
                      path="/gallery" 
                      element={<MediaGalleryPage />} 
                    />
                    <Route 
                      path="/order-success" 
                      element={<OrderSuccessPage />} 
                    />
                    <Route 
                      path="/track-order/:orderId" 
                      element={<OrderTrackingPage />} 
                    />
                    <Route 
                      path="/terms" 
                      element={<TermsAndConditions />} 
                    />
                    <Route 
                      path="/privacy" 
                      element={<PrivacyPolicy />} 
                    />
                  </Routes>
                </main>
                
                {/* Enhanced ChatBot */}
                <EnhancedChatBot />
                
                {/* Auth Modals */}
                <AuthModals 
                  isOpen={showAuthModal}
                  onClose={() => setShowAuthModal(false)}
                />
                
                {/* Toast Notifications */}
                <Toaster richColors position="top-right" />
              </div>
            </BrowserRouter>
          </CartProvider>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default EnhancedApp;
