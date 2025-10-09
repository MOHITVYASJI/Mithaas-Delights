import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Animated Product Card with Complete Pricing, Offers, and Sold-Out Status
 */
export const AnimatedProductCard = ({
  product,
  onAddToCart,
  onClick,
  delay = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [activeOffers, setActiveOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  // Motion values for card animation
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring configs for smooth animations
  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), springConfig);

  // Fetch active offers for this product
  useEffect(() => {
    if (user && user.wishlist) {
      setIsInWishlist(user.wishlist.includes(product.id));
    }
  }, [user, product.id]);

  useEffect(() => {
    fetchActiveOffers();
  }, [product.id]);

  const fetchActiveOffers = async () => {
    try {
      const response = await axios.get(`${API}/offers/active?product_id=${product.id}`);
      setActiveOffers(response.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setActiveOffers([]);
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Get the minimum price from variants
  const getMinPrice = () => {
    if (product.variants && product.variants.length > 0) {
      return Math.min(...product.variants.map(v => v.price));
    }
    return product.price || 0;
  };

  // Calculate offer discount
  const calculateBestOffer = () => {
    if (activeOffers.length === 0) return null;
    
    const minPrice = getMinPrice();
    let bestDiscount = 0;
    let bestOffer = null;

    activeOffers.forEach(offer => {
      let discount = 0;
      if (offer.offer_type === 'percentage') {
        discount = (minPrice * offer.discount_percentage) / 100;
        if (offer.max_discount && discount > offer.max_discount) {
          discount = offer.max_discount;
        }
      } else if (offer.offer_type === 'flat_discount') {
        discount = Math.min(offer.discount_amount, minPrice);
      }
      
      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestOffer = offer;
      }
    });

    return bestOffer ? { offer: bestOffer, discount: bestDiscount } : null;
  };

  const bestOffer = calculateBestOffer();
  const finalPrice = bestOffer ? getMinPrice() - bestOffer.discount : getMinPrice();

  const getBadgeText = (offer) => {
    if (offer.badge_text) return offer.badge_text;
    
    switch (offer.offer_type) {
      case 'percentage':
        return `${offer.discount_percentage}% OFF`;
      case 'flat_discount':
        return `₹${offer.discount_amount} OFF`;
      case 'buy_x_get_y':
        return `Buy ${offer.buy_quantity} Get ${offer.get_quantity}`;
      default:
        return 'OFFER';
    }
  };

  // Check if product is sold out or not available
  const isSoldOut = product.is_sold_out || !product.is_available || 
    (product.variants && product.variants.every(v => !v.is_available || v.stock === 0));

  // Card animation variants
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay: delay,
      },
    },
    hover: {
      y: -10,
      scale: 1.02,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 20,
      },
    },
  };

  // Image animation
  const imageVariants = {
    rest: {
      scale: 1,
      filter: isSoldOut ? 'brightness(70%) grayscale(100%)' : 'brightness(100%)',
    },
    hover: {
      scale: isSoldOut ? 1 : 1.1,
      filter: isSoldOut ? 'brightness(70%) grayscale(100%)' : 'brightness(110%)',
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  // Badge animation
  const badgeVariants = {
    rest: { scale: 1, rotate: 0 },
    hover: {
      scale: 1.1,
      rotate: [0, -5, 5, 0],
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
  };

  // Button animation
  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current || isSoldOut) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    x.set(mouseX / (rect.width / 2));
    y.set(mouseY / (rect.height / 2));
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`cursor-pointer ${isSoldOut ? 'opacity-90' : ''}`}
      data-testid={`product-card-${product.id}`}
    >
      <Card className={`overflow-hidden h-full border-2 transition-colors relative group ${
        isSoldOut ? 'border-gray-300' : 'border-transparent hover:border-orange-200'
      }`}>
        {/* Glow effect on hover */}
        {!isSoldOut && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10"
            animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
          />
        )}

        <CardContent className="p-0 relative">
          {/* Image container */}
          <div 
            className="relative h-40 sm:h-44 md:h-48 overflow-hidden bg-gray-100 cursor-pointer"
            onClick={() => onClick?.(product)}
          >
            <motion.img
              src={product.image_url || '/placeholder-sweet.jpg'}
              alt={product.name}
              className="w-full h-full object-cover"
              variants={imageVariants}
              initial="rest"
              animate={isHovered ? 'hover' : 'rest'}
              style={{ transformStyle: 'preserve-3d', transform: 'translateZ(20px)' }}
            />

            {/* Offer Badges */}
            {activeOffers.length > 0 && !isSoldOut && (
              <div className="absolute top-2 left-2 z-10">
                <motion.div
                  variants={badgeVariants}
                  initial="rest"
                  animate={isHovered ? 'hover' : 'rest'}
                >
                  <Badge 
                    className="mb-1 shadow-lg font-bold text-xs px-2 py-1 animate-pulse"
                    style={{ 
                      backgroundColor: activeOffers[0].badge_color || '#f97316',
                      color: '#ffffff'
                    }}
                  >
                    {getBadgeText(activeOffers[0])}
                  </Badge>
                </motion.div>
                {activeOffers.length > 1 && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 shadow-lg animate-bounce">
                    +{activeOffers.length - 1} more
                  </Badge>
                )}
              </div>
            )}

            {/* Discount Badge */}
            <div className="absolute top-2 right-2 space-y-1">
              {product.discount_percentage && !isSoldOut && (
                <motion.div
                  variants={badgeVariants}
                  initial="rest"
                  animate={isHovered ? 'hover' : 'rest'}
                >
                  <Badge className="bg-red-500 text-white shadow-lg font-bold animate-pulse">
                    {product.discount_percentage}% OFF
                  </Badge>
                </motion.div>
              )}
              {product.is_featured && !isSoldOut && (
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg">
                  ⭐ Featured
                </Badge>
              )}
            </div>

            {/* Sold Out Overlay */}
            {isSoldOut && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-20">
                <div className="text-center">
                  <Badge className="bg-red-600 text-white text-lg px-6 py-3 shadow-xl animate-pulse font-bold">
                    SOLD OUT
                  </Badge>
                  <p className="text-white text-sm mt-2 font-medium">Out of Stock</p>
                </div>
              </div>
            )}

            {/* Wishlist Button */}
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              className={`absolute bottom-2 right-2 bg-white/90 hover:bg-white rounded-full w-8 h-8 p-0 shadow-lg transition-all duration-200 hover:scale-105 ${
                isSoldOut ? 'opacity-50' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist();
              }}
              data-testid="wishlist-toggle-button"
            >
              <Heart className={`w-4 h-4 transition-all duration-200 ${
                loading ? 'animate-pulse text-gray-400' : 
                isInWishlist ? 'fill-red-500 text-red-500 animate-pulse' : 'text-gray-600 hover:text-red-500'
              }`} />
            </Button>

            {/* Shimmer effect on hover */}
            {!isSoldOut && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                animate={isHovered ? { x: '200%' } : { x: '-100%' }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              />
            )}
          </div>

          {/* Content section */}
          <div className="p-3 sm:p-4" style={{ transformStyle: 'preserve-3d', transform: 'translateZ(30px)' }}>
            {/* Product name */}
            <motion.h3
              className={`font-semibold text-base sm:text-lg mb-2 cursor-pointer transition-colors line-clamp-1 ${
                isSoldOut ? 'text-gray-500' : 'text-gray-800 hover:text-orange-600'
              }`}
              animate={isHovered ? { x: 5 } : { x: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => onClick?.(product)}
              data-testid="product-name"
            >
              {product.name}
            </motion.h3>

            <p className={`text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed ${
              isSoldOut ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {product.description}
            </p>

            {/* Price section */}
            <motion.div
              className="flex items-center justify-between mb-3"
              animate={isHovered ? { x: 5 } : { x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                {bestOffer && !isSoldOut ? (
                  <>
                    <span className={`text-lg sm:text-xl font-bold ${
                      isSoldOut ? 'text-gray-400' : 'text-orange-600'
                    }`} data-testid="product-price">
                      ₹{finalPrice.toFixed(0)}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400 line-through">
                      ₹{getMinPrice()}
                    </span>
                  </>
                ) : (
                  <span className={`text-lg sm:text-xl font-bold ${
                    isSoldOut ? 'text-gray-400' : 'text-orange-600'
                  }`} data-testid="product-price">
                    From ₹{getMinPrice()}
                  </span>
                )}
              </div>
              {product.variants && product.variants.length > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {product.variants.length} options
                </span>
              )}
            </motion.div>

            {/* Rating and Action Button */}
            <div className="flex items-center justify-between">
              <motion.div
                className="flex items-center space-x-1"
                animate={isHovered ? { x: 5 } : { x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3 h-3 ${
                        i < Math.floor(product.rating || 4.5) 
                          ? (isSoldOut ? 'fill-gray-300 text-gray-300' : 'fill-amber-400 text-amber-400') 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <span className={`text-xs ml-1 ${
                  isSoldOut ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  ({product.review_count || 0})
                </span>
              </motion.div>

              <Button 
                size="sm" 
                onClick={() => onClick?.(product)}
                disabled={isSoldOut}
                className={`text-xs sm:text-sm px-2 sm:px-3 py-1 transition-all duration-200 shadow-lg ${
                  isSoldOut 
                    ? 'bg-gray-400 hover:bg-gray-400 text-white cursor-not-allowed opacity-50' 
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:scale-105'
                }`}
                data-testid="view-details-button"
              >
                {isSoldOut ? 'Out of Stock' : 'View Details'}
              </Button>
            </div>

            {/* Offer Savings Message */}
            {bestOffer && !isSoldOut && (
              <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full text-center font-medium animate-pulse">
                💰 Save ₹{bestOffer.discount.toFixed(0)} with this offer!
              </div>
            )}
          </div>
        </CardContent>

        {/* Card border glow */}
        {!isSoldOut && (
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-orange-500/0 group-hover:border-orange-500/50 transition-colors pointer-events-none"
            animate={isHovered ? { boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)' } : { boxShadow: '0 0 0px rgba(249, 115, 22, 0)' }}
          />
        )}
      </Card>
    </motion.div>
  );
};

export default AnimatedProductCard;
