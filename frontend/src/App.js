import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { ShoppingCart, User, Search, Menu, X, Star, ChevronRight, MapPin, Phone, Mail, Clock, Heart } from 'lucide-react';
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { AdminPanel } from "./components/AdminPanel";
import { CartDialog } from "./components/CartCheckout";
import { ChatBot } from "./components/ChatBot";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context for cart management
const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        const updatedItems = prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        return updatedItems;
      } else {
        return [...prevItems, { ...product, quantity }];
      }
    });
    toast.success(`${product.name} added to cart!`);
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
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

// Header Component
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartCount } = useCart();

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
            <a href="#home" className="text-gray-700 hover:text-orange-600 transition-colors">Home</a>
            <a href="#products" className="text-gray-700 hover:text-orange-600 transition-colors">Products</a>
            <a href="#about" className="text-gray-700 hover:text-orange-600 transition-colors">About</a>
            <a href="#contact" className="text-gray-700 hover:text-orange-600 transition-colors">Contact</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" data-testid="search-button">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="user-profile-button">
              <User className="w-5 h-5" />
            </Button>
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
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

// Product Card Component
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white border border-amber-100" data-testid="product-card">
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
        {product.is_featured && (
          <Badge className="absolute top-2 left-2 bg-amber-500 text-white">
            Featured
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-gray-800 mb-2" data-testid="product-name">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-orange-600" data-testid="product-price">₹{product.price}</span>
            {product.original_price && (
              <span className="text-sm text-gray-400 line-through">₹{product.original_price}</span>
            )}
          </div>
          <span className="text-sm text-gray-500">{product.weight}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm text-gray-600">4.5 (120)</span>
          </div>
          <Button 
            size="sm" 
            onClick={() => addToCart(product)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            data-testid="add-to-cart-button"
          >
            Add to Cart
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
              >
                Shop Now
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-orange-300 text-orange-700 hover:bg-orange-50 px-8 py-4 text-lg"
                data-testid="explore-button"
              >
                Explore Catalog
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-orange-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600" data-testid="happy-customers-count">10K+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600" data-testid="products-count">50+</div>
                <div className="text-sm text-gray-600">Premium Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600" data-testid="cities-count">25+</div>
                <div className="text-sm text-gray-600">Cities Served</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1606471191009-63b7dcf9e22f?w=600&h=600&fit=crop"
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
                src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop"
                alt="Traditional sweet making"
                className="rounded-lg shadow-md"
              />
              <img 
                src="https://images.unsplash.com/photo-1599599810094-c06e16c3315f?w=300&h=200&fit=crop"
                alt="Premium ingredients"
                className="rounded-lg shadow-md"
              />
            </div>
            <div className="space-y-4 mt-8">
              <img 
                src="https://images.unsplash.com/photo-1571119743851-7c6eb63b5da6?w=300&h=200&fit=crop"
                alt="Handcrafted sweets"
                className="rounded-lg shadow-md"
              />
              <img 
                src="https://images.unsplash.com/photo-1606471191009-63b7dcf9e22f?w=300&h=200&fit=crop"
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
                <p className="text-gray-600">123 Sweet Street, Mumbai, Maharashtra 400001, India</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Call Us</h3>
                <p className="text-gray-600">+91 98765 43210</p>
                <p className="text-gray-600">+91 98765 43211</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Email Us</h3>
                <p className="text-gray-600">orders@mithaasdelights.com</p>
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Your Name" data-testid="contact-name-input" />
                <Input placeholder="Your Email" type="email" data-testid="contact-email-input" />
              </div>
              <Input placeholder="Subject" data-testid="contact-subject-input" />
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows="4"
                placeholder="Your Message"
                data-testid="contact-message-input"
              ></textarea>
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                data-testid="send-message-button"
              >
                Send Message
              </Button>
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
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-orange-400 transition-colors">Mithai</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Namkeen</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Bengali Sweets</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Festival Specials</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-orange-400 transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">WhatsApp</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Twitter</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Mithaas Delights. All rights reserved. Made with ❤️ in India.</p>
        </div>
      </div>
    </footer>
  );
};

// Main Home Component
const Home = () => {
  useEffect(() => {
    // Initialize sample data
    const initializeData = async () => {
      try {
        await axios.post(`${API}/init-sample-data`);
      } catch (error) {
        console.error('Error initializing sample data:', error);
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

  const getStatusStep = (status) => {
    const steps = {
      'pending': 1,
      'confirmed': 2,
      'preparing': 3,
      'out_for_delivery': 4,
      'delivered': 5
    };
    return steps[status] || 1;
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

// Main App Component
function App() {
  return (
    <CartProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/track-order" element={<OrderTracking />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <ChatBot />
        <Toaster />
      </div>
    </CartProvider>
  );
}

export default App;