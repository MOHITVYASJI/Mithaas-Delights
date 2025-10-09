import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, User, Search, Menu, X, ChevronDown, LogOut, UserCircle, Package, Bell, Heart, Sparkles, Zap, Star, TrendingUp, Gift } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { AnimatedLogoGIF } from './AnimatedLogoGIF';
import { ThemeSwitcher } from './ThemeSwitcher';
import { NotificationSystem } from './NotificationSystem';
import { CartDialog } from './CartCheckout';
import { AuthModals } from './auth/AuthModel';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../App';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Floating particles animation component
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: -10,
            opacity: 0
          }}
          animate={{
            y: window.innerHeight + 10,
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0]
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

// Premium glassmorphism card wrapper
const GlassCard = ({ children, className = "" }) => (
  <motion.div
    className={`backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 shadow-2xl ${className}`}
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    {children}
  </motion.div>
);

export const EnhancedHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  
  const { cartCount } = useCart();
  const { user, logout, isAuthenticated, loading } = useAuth();

  // Handle scroll for sticky header with shrink effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMenuOpen(false);
      }
    };
    
    setTimeout(checkMobile, 100);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch categories for mega menu
  useEffect(() => {
    fetchCategories();
    fetchFeaturedProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories?active_only=true`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${API}/products/featured`);
      setFeaturedProducts(response.data.slice(0, 4));
    } catch (error) {
      console.error('Error fetching featured products:', error);
    }
  };

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
    <>
      <motion.header 
        className={`bg-white/95 backdrop-blur-md border-b border-amber-100 sticky top-0 z-50 shadow-sm transition-all duration-300 ${
          isScrolled ? 'py-2' : 'py-3'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.a 
              href="/" 
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <AnimatedLogoGIF className="mr-2" gifPath="/animated-logo.mp4" />
              <span className={`font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent transition-all duration-300 ${
                isScrolled ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
              }`}>
                Mithaas Delights
              </span>
            </motion.a>

            {/* Desktop Navigation */}
            <nav className="desktop-nav" style={{display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '1.5rem'}}>
              <motion.a 
                href="/" 
                className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                Home
              </motion.a>
              
              {/* Products Mega Menu */}
              <div 
                className="relative"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <motion.button 
                  className="flex items-center text-gray-700 hover:text-orange-600 transition-colors font-medium"
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  Products
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>
                
                <AnimatePresence>
                  {megaMenuOpen && (
                    <motion.div
                      className="absolute top-full left-0 mt-2 w-[600px] bg-white rounded-lg shadow-2xl border border-orange-100 overflow-hidden"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="grid grid-cols-2 gap-4 p-6">
                        {/* Categories */}
                        <div>
                          <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Categories</h3>
                          <div className="space-y-2">
                            {categories.slice(0, 6).map((category) => (
                              <motion.a
                                key={category.id}
                                href={`/#products?category=${category.name}`}
                                className="block px-3 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-md transition-colors"
                                whileHover={{ x: 5 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                              >
                                {category.name.charAt(0).toUpperCase() + category.name.slice(1).replace(/_/g, ' ')}
                              </motion.a>
                            ))}
                          </div>
                        </div>

                        {/* Featured Products */}
                        <div>
                          <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Featured</h3>
                          <div className="space-y-2">
                            {featuredProducts.map((product) => (
                              <motion.a
                                key={product.id}
                                href={`/product/${product.id}`}
                                className="flex items-center space-x-3 p-2 hover:bg-orange-50 rounded-md transition-colors group"
                                whileHover={{ x: 5 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                              >
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded-md shadow-sm group-hover:shadow-md transition-shadow"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-orange-600 transition-colors">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-orange-600 font-semibold">
                                    From ₹{Math.min(...product.variants.map(v => v.price))}
                                  </p>
                                </div>
                              </motion.a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.a 
                href="/bulk-orders" 
                className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                Bulk Orders
              </motion.a>
              <motion.a 
                href="/gallery" 
                className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                Gallery
              </motion.a>
              <motion.a 
                href="/#about" 
                className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                About
              </motion.a>
              <motion.a 
                href="/#contact" 
                className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                Contact
              </motion.a>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <ThemeSwitcher />
              <NotificationSystem isAuthenticated={isAuthenticated} />
              
              {/* Enhanced Search with Image Previews */}
              <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                <DialogTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" size="sm" data-testid="search-button">
                      <Search className="w-5 h-5" />
                    </Button>
                  </motion.div>
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
                      className="border-2 border-orange-200 focus:border-orange-500"
                    />
                    {searchLoading && (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                      </div>
                    )}
                    {!searchLoading && searchResults.length > 0 && (
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {searchResults.map((product) => (
                          <motion.div
                            key={product.id}
                            className="flex items-center space-x-4 p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors"
                            onClick={() => {
                              setSearchOpen(false);
                              window.location.href = `/product/${product.id}`;
                            }}
                            whileHover={{ x: 5 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            <motion.img
                              src={product.image_url}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded shadow-md"
                              whileHover={{ scale: 1.1 }}
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
                          </motion.div>
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
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" size="sm" data-testid="user-menu-trigger">
                        <UserCircle className="w-5 h-5" />
                        <span className="ml-2 hidden sm:inline">{user?.name}</span>
                      </Button>
                    </motion.div>
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
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleAuthClick('login')}
                      data-testid="login-button"
                    >
                      Login
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAuthClick('register')}
                      className="hidden sm:inline-flex"
                      data-testid="signup-button"
                    >
                      Sign Up
                    </Button>
                  </motion.div>
                </div>
              )}

              {/* Animated Cart Button */}
              <CartDialog>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="sm" className="relative" data-testid="cart-button">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      >
                        <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-orange-500 text-xs p-0 flex items-center justify-center animate-pulse">
                          {cartCount}
                        </Badge>
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              </CartDialog>
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="mobile-menu-btn"
                style={{display: isMobile ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center'}}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                data-testid="mobile-menu-button"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu with Slide Animation */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.nav 
                className="mt-4 pb-4 border-t border-amber-100 pt-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col space-y-3">
                  <motion.a 
                    href="/" 
                    className="text-gray-700 hover:text-orange-600 transition-colors p-2 rounded hover:bg-orange-50"
                    whileTap={{ scale: 0.95 }}
                  >
                    Home
                  </motion.a>
                  <motion.a 
                    href="/#products" 
                    className="text-gray-700 hover:text-orange-600 transition-colors p-2 rounded hover:bg-orange-50"
                    whileTap={{ scale: 0.95 }}
                  >
                    Products
                  </motion.a>
                  <motion.a 
                    href="/bulk-orders" 
                    className="text-gray-700 hover:text-orange-600 transition-colors p-2 rounded hover:bg-orange-50"
                    whileTap={{ scale: 0.95 }}
                  >
                    Bulk Orders
                  </motion.a>
                  <motion.a 
                    href="/gallery" 
                    className="text-gray-700 hover:text-orange-600 transition-colors p-2 rounded hover:bg-orange-50"
                    whileTap={{ scale: 0.95 }}
                  >
                    Gallery
                  </motion.a>
                  <motion.a 
                    href="/#about" 
                    className="text-gray-700 hover:text-orange-600 transition-colors p-2 rounded hover:bg-orange-50"
                    whileTap={{ scale: 0.95 }}
                  >
                    About
                  </motion.a>
                  <motion.a 
                    href="/#contact" 
                    className="text-gray-700 hover:text-orange-600 transition-colors p-2 rounded hover:bg-orange-50"
                    whileTap={{ scale: 0.95 }}
                  >
                    Contact
                  </motion.a>
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
              </motion.nav>
            )}
          </AnimatePresence>
        </div>

        {/* Auth Modal */}
        <AuthModals 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
        />
      </motion.header>
    </>
  );
};

export default EnhancedHeader;
