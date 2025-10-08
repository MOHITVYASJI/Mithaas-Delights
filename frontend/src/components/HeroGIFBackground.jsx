import React from 'react';
import { motion } from 'framer-motion';

/**
 * GIF/Video-based Hero Background
 * Usage: Replace Hero3DBackground with this component
 * Supports both GIF and video formats
 */
export const HeroGIFBackground = ({ 
  gifPath = '/hero-animation.gif',
  opacity = 0.3,
  blend = 'normal' // Options: 'normal', 'multiply', 'screen', 'overlay'
}) => {
  const isVideo = gifPath.toLowerCase().endsWith('.mp4') || gifPath.toLowerCase().endsWith('.webm');

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Main GIF/Video Background */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: opacity }}
        transition={{ duration: 1 }}
      >
        {isVideo ? (
          <video
            src={gifPath}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{
              mixBlendMode: blend,
              filter: 'brightness(0.9) contrast(1.1)',
            }}
          />
        ) : (
          <img
            src={gifPath}
            alt="Background Animation"
            className="w-full h-full object-cover"
            style={{
              mixBlendMode: blend,
              filter: 'brightness(0.9) contrast(1.1)',
            }}
          />
        )}
      </motion.div>

      {/* Optional: Gradient Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white/80 dark:via-gray-900/50 dark:to-gray-900/80" />
    </div>
  );
};

export default HeroGIFBackground;
