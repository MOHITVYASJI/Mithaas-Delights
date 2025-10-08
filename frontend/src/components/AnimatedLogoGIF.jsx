import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * GIF-based Animated Logo
 * Usage: Replace AnimatedLogo3D with this component
 */
export const AnimatedLogoGIF = ({ className = '', gifPath = '/animated-logo.gif' }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Main Logo GIF */}
      <img
        src={gifPath}
        alt="Mithaas Delights Logo"
        className="w-16 h-16 md:w-20 md:h-20 object-contain"
        style={{
          filter: isHovered ? 'brightness(1.2) drop-shadow(0 0 10px rgba(249,115,22,0.5))' : 'none',
          transition: 'filter 0.3s ease',
        }}
      />
      
      {/* Optional: Glow effect on hover */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-orange-400/30 to-amber-400/30 rounded-full blur-xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
};

export default AnimatedLogoGIF;
