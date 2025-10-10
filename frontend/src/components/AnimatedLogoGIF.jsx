import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * GIF/Video-based Animated Logo
 * Usage: Replace AnimatedLogo3D with this component
 * Supports both GIF and MP4 formats
 */
export const AnimatedLogoGIF = ({ className = '', gifPath = '/mithaas-logo.png' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isVideo = gifPath.toLowerCase().endsWith('.mp4') || gifPath.toLowerCase().endsWith('.webm');

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={isHovered ? { rotate: [-5, 5, -5, 5, 0] } : { rotate: 0 }}
      whileHover={{ scale: 1.1 }}
      transition={{ 
        scale: { type: 'spring', stiffness: 300, damping: 20 },
        rotate: { duration: 0.5, ease: 'easeInOut' }
      }}
    >
      {/* Main Logo - GIF or Video */}
      {isVideo ? (
        <video
          src={gifPath}
          autoPlay
          loop
          muted
          playsInline
          className="w-16 h-16 md:w-20 md:h-20 object-contain"
          style={{
            filter: isHovered ? 'brightness(1.2) drop-shadow(0 0 10px rgba(249,115,22,0.5))' : 'none',
            transition: 'filter 0.3s ease',
          }}
        />
      ) : (
        <img
          src={gifPath}
          alt="Mithaas Delights Logo"
          className="w-16 h-16 md:w-20 md:h-20 object-contain"
          style={{
            filter: isHovered ? 'brightness(1.2) drop-shadow(0 0 10px rgba(249,115,22,0.5))' : 'none',
            transition: 'filter 0.3s ease',
          }}
        />
      )}
      
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
