import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, User, Search, Menu, X, ChevronDown, ChevronRight, LogOut, UserCircle, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
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

export const AdvancedHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isDark, setIsDark] = useState(false);
  
  const { cartCount } = useCart();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { scrollY } = useScroll();

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.classList.contains('dark');
      setIsDark(theme);
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Handle scroll direction for auto hide/show
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY;
    
    // Hide header when scrolling down and show when scrolling up
    if (latest > previous && latest > 100) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    
    setLastScrollY(latest);
  });

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

  // Glow color based on theme
  const glowColor = isDark ? 'rgba(56, 189, 248, 0.5)' : 'rgba(249, 115, 22, 0.5)';
  const glowColorHover = isDark ? 'rgba(56, 189, 248, 0.8)' : 'rgba(249, 115, 22, 0.8)';

  return (
    <>
      <motion.header 
        className="fixed z-50 w-full"
        style={{
          top: 0,
          left: 0,
          right: 0,
          
        }}
        initial={{ y: 0, opacity: 1 }}
        animate={{ 
          y: hidden ? -120 : 0,
          opacity: hidden ? 0 : 1
        }}
        transition={{ 
          duration: 0.3,
          ease: 'easeInOut'
        }}
      >
        <div 
          className="border-b shadow-lg"
          style={{
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.4)' : 'rgba(255, 255, 255, 0.4)',
            borderColor: isDark ? 'rgba(107, 114, 128, 0.25)' : 'rgba(255, 255, 255, 0.25)',
            borderWidth: '0 0 1px 0',
            borderStyle: 'solid',
            boxShadow: isDark 
              ? '0 4px 20px rgba(56, 189, 248, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 4px 20px rgba(249, 115, 22, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            minHeight: '60px'
          }}
        >
          <div className="container mx-auto px-4 py-1.5">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <motion.a 
                href="/" 
                className="flex items-center group"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <AnimatedLogoGIF className="mr-2" gifPath="/animated-logo.mp4" />
                <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Mithaas Delights
                </span>
              </motion.a>

              {/* Desktop Navigation */}
              <nav 
                className="desktop-nav" 
                style={{
                  display: isMobile ? 'none' : 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem'
                }}
              >
                {['Home', 'Products', 'Bulk Orders', 'Gallery', 'About', 'Contact'].map((item, idx) => {
                  const href = item === 'Home' ? '/' : 
                               item === 'Bulk Orders' ? '/bulk-orders' :
                               item === 'Gallery' ? '/gallery' :
                               `/#${item.toLowerCase()}`;
                  
                  return (
                    <motion.a
                      key={item}
                      href={href}
                      className="relative px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-xl border transition-all duration-300 overflow-hidden group"
                      whileHover={{ 
                        scale: 1.05,
                        y: -1
                      }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 400, 
                        damping: 20 
                      }}
                      style={{
                        backdropFilter: 'blur(60%) saturate(150%)',
                        WebkitBackdropFilter: 'blur(60%) saturate(150%)',
                        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                        borderColor: isDark ? 'rgba(107, 114, 128, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                        boxShadow: isDark 
                          ? '0 4px 12px rgba(56, 189, 248, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          : '0 4px 12px rgba(249, 115, 22, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = isDark 
                          ? '0 0 25px rgba(56, 189, 248, 0.6), 0 0 50px rgba(56, 189, 248, 0.4), 0 8px 16px rgba(56, 189, 248, 0.2)'
                          : '0 0 25px rgba(249, 115, 22, 0.6), 0 0 50px rgba(249, 115, 22, 0.4), 0 8px 16px rgba(249, 115, 22, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = isDark 
                          ? '0 4px 12px rgba(56, 189, 248, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          : '0 4px 12px rgba(249, 115, 22, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                      }}
                    >
                      {item}
                    </motion.a>
                  );
                })}
              </nav>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <ThemeSwitcher />
                <NotificationSystem isAuthenticated={isAuthenticated} />
                
                {/* Enhanced Search */}
                <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                  <DialogTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-full p-2 border transition-all duration-300"
                        data-testid="search-button"
                        style={{
                          backdropFilter: 'blur(60%) saturate(150%)',
                          WebkitBackdropFilter: 'blur(60%) saturate(150%)',
                          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                          borderColor: isDark ? 'rgba(107, 114, 128, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                          boxShadow: isDark 
                            ? '0 4px 12px rgba(56, 189, 248, 0.15)'
                            : '0 4px 12px rgba(249, 115, 22, 0.15)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = isDark 
                            ? '0 0 25px rgba(56, 189, 248, 0.6), 0 8px 16px rgba(56, 189, 248, 0.2)'
                            : '0 0 25px rgba(249, 115, 22, 0.6), 0 8px 16px rgba(249, 115, 22, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = isDark 
                            ? '0 4px 12px rgba(56, 189, 248, 0.15)'
                            : '0 4px 12px rgba(249, 115, 22, 0.15)';
                        }}
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
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
                        className="border-2 border-orange-200 dark:border-sky-400 focus:border-orange-500 dark:focus:border-sky-500"
                      />
                      {searchLoading && (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 dark:border-sky-400 mx-auto"></div>
                        </div>
                      )}
                      {!searchLoading && searchResults.length > 0 && (
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {searchResults.map((product) => (
                            <motion.div
                              key={product.id}
                              className="flex items-center space-x-4 p-3 hover:bg-orange-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                              onClick={() => {
                                setSearchOpen(false);
                                window.location.href = `/product/${product.id}`;
                              }}
                              whileHover={{ x: 5 }}
                            >
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded shadow-md"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200">{product.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{product.description}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  {product.variants && product.variants.length > 0 && (
                                    <span className="text-sm font-semibold text-orange-600 dark:text-sky-400">
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
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Authentication Section */}
                {loading ? (
                  <Button variant="ghost" size="sm" disabled className="backdrop-blur-md bg-white/60 dark:bg-gray-800/60">
                    <User className="w-4 h-4" />
                  </Button>
                ) : isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.08, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      >
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-2xl px-3 py-2 border transition-all duration-300"
                          data-testid="user-menu-trigger"
                          style={{
                            backdropFilter: 'blur(60%) saturate(150%)',
                            WebkitBackdropFilter: 'blur(60%) saturate(150%)',
                            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                            borderColor: isDark ? 'rgba(107, 114, 128, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                            boxShadow: isDark 
                              ? '0 4px 12px rgba(56, 189, 248, 0.15)'
                              : '0 4px 12px rgba(249, 115, 22, 0.15)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = isDark 
                              ? '0 0 25px rgba(56, 189, 248, 0.6), 0 8px 16px rgba(56, 189, 248, 0.2)'
                              : '0 0 25px rgba(249, 115, 22, 0.6), 0 8px 16px rgba(249, 115, 22, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = isDark 
                              ? '0 4px 12px rgba(56, 189, 248, 0.15)'
                              : '0 4px 12px rgba(249, 115, 22, 0.15)';
                          }}
                        >
                          <UserCircle className="w-4 h-4" />
                          <span className="ml-2 hidden sm:inline text-sm">{user?.name}</span>
                        </Button>
                      </motion.div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95">
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
                  <div className="flex items-center gap-2">
                    <motion.div
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAuthClick('login')}
                        className="rounded-2xl text-sm px-4 py-2 border transition-all duration-300"
                        data-testid="login-button"
                        style={{
                          backdropFilter: 'blur(60%) saturate(150%)',
                          WebkitBackdropFilter: 'blur(60%) saturate(150%)',
                          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                          borderColor: isDark ? 'rgba(107, 114, 128, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                          boxShadow: isDark 
                            ? '0 4px 12px rgba(56, 189, 248, 0.15)'
                            : '0 4px 12px rgba(249, 115, 22, 0.15)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = isDark 
                            ? '0 0 25px rgba(56, 189, 248, 0.6), 0 8px 16px rgba(56, 189, 248, 0.2)'
                            : '0 0 25px rgba(249, 115, 22, 0.6), 0 8px 16px rgba(249, 115, 22, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = isDark 
                            ? '0 4px 12px rgba(56, 189, 248, 0.15)'
                            : '0 4px 12px rgba(249, 115, 22, 0.15)';
                        }}
                      >
                        Login
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAuthClick('register')}
                        className="hidden sm:inline-flex rounded-2xl text-sm px-4 py-2 border font-semibold transition-all duration-300 premium-button"
                        data-testid="signup-button"
                        style={{
                          backdropFilter: 'blur(60%) saturate(150%)',
                          WebkitBackdropFilter: 'blur(60%) saturate(150%)',
                          background: isDark 
                            ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.3) 100%)'
                            : 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.3) 100%)',
                          borderColor: isDark ? 'rgba(56, 189, 248, 0.5)' : 'rgba(249, 115, 22, 0.5)',
                          color: isDark ? 'rgb(125, 211, 252)' : 'rgb(249, 115, 22)',
                          boxShadow: isDark 
                            ? '0 4px 12px rgba(56, 189, 248, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            : '0 4px 12px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = isDark 
                            ? '0 0 30px rgba(56, 189, 248, 0.7), 0 0 60px rgba(56, 189, 248, 0.4), 0 8px 20px rgba(56, 189, 248, 0.3)'
                            : '0 0 30px rgba(249, 115, 22, 0.7), 0 0 60px rgba(249, 115, 22, 0.4), 0 8px 20px rgba(249, 115, 22, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = isDark 
                            ? '0 4px 12px rgba(56, 189, 248, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            : '0 4px 12px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                        }}
                      >
                        Sign Up
                      </Button>
                    </motion.div>
                  </div>
                )}

                {/* Animated Cart Button */}
                <CartDialog>
                  <motion.div
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="relative rounded-full p-2 border transition-all duration-300" 
                      data-testid="cart-button"
                      style={{
                        backdropFilter: 'blur(60%) saturate(150%)',
                        WebkitBackdropFilter: 'blur(60%) saturate(150%)',
                        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                        borderColor: isDark ? 'rgba(107, 114, 128, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                        boxShadow: isDark 
                          ? '0 4px 12px rgba(56, 189, 248, 0.15)'
                          : '0 4px 12px rgba(249, 115, 22, 0.15)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = isDark 
                          ? '0 0 25px rgba(56, 189, 248, 0.6), 0 8px 16px rgba(56, 189, 248, 0.2)'
                          : '0 0 25px rgba(249, 115, 22, 0.6), 0 8px 16px rgba(249, 115, 22, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = isDark 
                          ? '0 4px 12px rgba(56, 189, 248, 0.15)'
                          : '0 4px 12px rgba(249, 115, 22, 0.15)';
                      }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {cartCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                        >
                          <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-orange-500 dark:bg-sky-500 text-xs p-0 flex items-center justify-center animate-pulse">
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
                  className="mobile-menu-btn rounded-full p-2 border transition-all duration-300"
                  style={{
                    display: isMobile ? 'flex' : 'none', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backdropFilter: 'blur(60%) saturate(150%)',
                    WebkitBackdropFilter: 'blur(60%) saturate(150%)',
                    backgroundColor: isDark ? 'rgba(31, 41, 55, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                    borderColor: isDark ? 'rgba(107, 114, 128, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                    boxShadow: isDark 
                      ? '0 4px 12px rgba(56, 189, 248, 0.15)'
                      : '0 4px 12px rgba(249, 115, 22, 0.15)'
                  }}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  data-testid="mobile-menu-button"
                >
                  {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Enhanced Mobile Menu with Premium Animations */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  className="absolute top-full left-0 right-0 mt-1 mx-4 rounded-2xl overflow-hidden"
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.4, 0, 0.2, 1],
                    type: "spring",
                    damping: 25,
                    stiffness: 300
                  }}
                  style={{
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    borderColor: isDark ? 'rgba(107, 114, 128, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                    border: '1px solid',
                    boxShadow: isDark 
                      ? '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(56, 189, 248, 0.2)'
                      : '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 30px rgba(249, 115, 22, 0.2)'
                  }}
                >
                  <nav className="p-6">
                    <div className="flex flex-col gap-3">
                      {[
                        { name: 'Home', href: '/', icon: '🏠' },
                        { name: 'Products', href: '/#products', icon: '🍬' },
                        { name: 'Bulk Orders', href: '/bulk-orders', icon: '📦' },
                        { name: 'Gallery', href: '/gallery', icon: '🖼️' },
                        { name: 'About', href: '/#about', icon: '📖' },
                        { name: 'Contact', href: '/#contact', icon: '📞' }
                      ].map((item, idx) => (
                        <motion.a
                          key={item.name}
                          href={item.href}
                          className="group flex items-center px-4 py-4 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-xl border transition-all duration-300"
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ 
                            delay: idx * 0.08,
                            type: "spring",
                            damping: 20,
                            stiffness: 300
                          }}
                          whileHover={{ 
                            scale: 1.02,
                            x: 8,
                            transition: { duration: 0.2 }
                          }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsMenuOpen(false)}
                          style={{
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.3)' : 'rgba(255, 255, 255, 0.3)',
                            borderColor: isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                          }}
                        >
                          <motion.span 
                            className="text-lg mr-3"
                            whileHover={{ scale: 1.2 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            {item.icon}
                          </motion.span>
                          <span className="flex-1">{item.name}</span>
                          <motion.div
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            initial={{ x: -10 }}
                            whileHover={{ x: 0 }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.div>
                        </motion.a>
                      ))}
                      
                      {!isAuthenticated && (
                        <motion.div 
                          className="flex flex-col gap-3 pt-4 border-t border-white/20 dark:border-gray-700/20"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                handleAuthClick('login');
                                setIsMenuOpen(false);
                              }}
                              className="w-full justify-start text-sm py-3 px-4 rounded-xl font-medium transition-all duration-300"
                              style={{
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                                borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(249, 115, 22, 0.3)',
                                border: '1px solid'
                              }}
                            >
                              <User className="w-4 h-4 mr-2" />
                              Login
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                handleAuthClick('register');
                                setIsMenuOpen(false);
                              }}
                              className="w-full justify-start text-sm py-3 px-4 rounded-xl font-semibold transition-all duration-300"
                              style={{
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                background: isDark 
                                  ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.3) 100%)'
                                  : 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.3) 100%)',
                                borderColor: isDark ? 'rgba(56, 189, 248, 0.5)' : 'rgba(249, 115, 22, 0.5)',
                                color: isDark ? 'rgb(125, 211, 252)' : 'rgb(249, 115, 22)'
                              }}
                            >
                              <UserCircle className="w-4 h-4 mr-2" />
                              Sign Up
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </div>
                  </nav>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModals 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
        />
      </motion.header>

      {/* Spacer to prevent content from going under the header */}
      <div className="h-16"></div>
    </>
  );
};

export default AdvancedHeader;
