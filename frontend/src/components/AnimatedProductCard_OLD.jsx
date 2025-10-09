import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { Tilt } from 'react-tilty';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Animated Product Card with 3D Tilt Effect, Complete Pricing, Offers, and Sold-Out Status
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
      filter: 'brightness(100%)',
    },
    hover: {
      scale: 1.1,
      filter: 'brightness(110%)',
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
    if (!cardRef.current) return;
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
      className="cursor-pointer"
      data-testid={`product-card-${product.id}`}
    >
      <Card className="overflow-hidden h-full border-2 border-transparent hover:border-primary/20 transition-colors relative group">
        {/* Glow effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10"
          animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        />

        <CardContent className="p-0 relative" onClick={() => onClick?.(product)}>
          {/* Image container with overflow hidden */}
          <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
            <motion.img
              src={product.image_url || '/placeholder-sweet.jpg'}
              alt={product.name}
              className="w-full h-full object-cover"
              variants={imageVariants}
              initial="rest"
              animate={isHovered ? 'hover' : 'rest'}
              style={{ transformStyle: 'preserve-3d', transform: 'translateZ(20px)' }}
            />

            {/* Offer badge with animation */}
            {product.offer_percentage > 0 && (
              <motion.div
                className="absolute top-2 right-2"
                variants={badgeVariants}
                initial="rest"
                animate={isHovered ? 'hover' : 'rest'}
                style={{ transformStyle: 'preserve-3d', transform: 'translateZ(40px)' }}
              >
                <Badge className="bg-red-500 text-white font-bold text-xs px-2 py-1">
                  {product.offer_percentage}% OFF
                </Badge>
              </motion.div>
            )}

            {/* Stock badge */}
            {product.stock === 0 && (
              <motion.div
                className="absolute top-2 left-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Badge variant="destructive" className="text-xs">
                  Out of Stock
                </Badge>
              </motion.div>
            )}

            {/* Shimmer effect on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
              animate={isHovered ? { x: '200%' } : { x: '-100%' }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          </div>

          {/* Content section */}
          <div className="p-4" style={{ transformStyle: 'preserve-3d', transform: 'translateZ(30px)' }}>
            {/* Product name */}
            <motion.h3
              className="font-semibold text-lg mb-2 line-clamp-2 min-h-[3.5rem]"
              animate={isHovered ? { x: 5 } : { x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {product.name}
            </motion.h3>

            {/* Rating */}
            <motion.div
              className="flex items-center gap-1 mb-2"
              animate={isHovered ? { x: 5 } : { x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {product.rating?.toFixed(1) || '4.5'} ({product.reviews_count || 0})
              </span>
            </motion.div>

            {/* Price section */}
            <motion.div
              className="flex items-baseline gap-2 mb-4"
              animate={isHovered ? { x: 5 } : { x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <span className="text-2xl font-bold text-primary">
                ₹{product.price}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{product.original_price}
                </span>
              )}
            </motion.div>

            {/* Add to cart button */}
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              style={{ transformStyle: 'preserve-3d', transform: 'translateZ(50px)' }}
            >
              <Button
                className="w-full group/btn relative overflow-hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart?.(product);
                }}
                disabled={product.stock === 0}
                data-testid={`add-to-cart-${product.id}`}
              >
                {/* Button glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={isHovered ? { x: '100%' } : { x: '-100%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
                <ShoppingCart className="w-4 h-4 mr-2" />
                <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </Button>
            </motion.div>
          </div>
        </CardContent>

        {/* Card border glow */}
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-primary/0 group-hover:border-primary/50 transition-colors pointer-events-none"
          animate={isHovered ? { boxShadow: '0 0 20px rgba(var(--primary), 0.3)' } : { boxShadow: '0 0 0px rgba(var(--primary), 0)' }}
        />
      </Card>
    </motion.div>
  );
};

export default AnimatedProductCard;
