import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Button } from './ui/button';

/**
 * Animated Button with Magnetic Effect and Micro-interactions
 */
export const AnimatedButton = ({
  children,
  variant = 'default',
  size = 'default',
  magnetic = true,
  ripple = true,
  glow = false,
  onClick,
  className = '',
  ...props
}) => {
  const buttonRef = useRef(null);
  const rippleRef = useRef(null);

  // Magnetic effect
  useEffect(() => {
    if (!magnetic || !buttonRef.current) return;

    const button = buttonRef.current;
    let isHovering = false;

    const handleMouseMove = (e) => {
      if (!isHovering) return;

      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) * 0.3;
      const deltaY = (e.clientY - centerY) * 0.3;

      gsap.to(button, {
        x: deltaX,
        y: deltaY,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseEnter = () => {
      isHovering = true;
    };

    const handleMouseLeave = () => {
      isHovering = false;
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)',
      });
    };

    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [magnetic]);

  // Ripple effect
  const handleRipple = (e) => {
    if (!ripple || !buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rippleElement = document.createElement('span');
    rippleElement.className = 'ripple-effect';
    rippleElement.style.left = `${x}px`;
    rippleElement.style.top = `${y}px`;

    button.appendChild(rippleElement);

    setTimeout(() => {
      rippleElement.remove();
    }, 600);

    onClick?.();
  };

  return (
    <>
      <style jsx>{`
        .animated-button-wrapper {
          position: relative;
          display: inline-block;
        }

        .animated-button-wrapper button {
          position: relative;
          overflow: hidden;
        }

        .ripple-effect {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          transform: translate(-50%, -50%) scale(0);
          animation: ripple-animation 0.6s ease-out;
          pointer-events: none;
        }

        @keyframes ripple-animation {
          to {
            transform: translate(-50%, -50%) scale(15);
            opacity: 0;
          }
        }

        .glow-button {
          box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.5);
          transition: box-shadow 0.3s ease;
        }

        .glow-button:hover {
          box-shadow: 0 0 30px rgba(var(--primary-rgb), 0.8);
        }
      `}</style>

      <motion.div
        className="animated-button-wrapper"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
      >
        <Button
          ref={buttonRef}
          variant={variant}
          size={size}
          className={`${glow ? 'glow-button' : ''} ${className}`}
          onClick={handleRipple}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    </>
  );
};

/**
 * Icon Button with Bounce Animation
 */
export const AnimatedIconButton = ({
  children,
  icon: Icon,
  onClick,
  className = '',
  bounce = true,
  ...props
}) => {
  return (
    <motion.button
      className={`relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      whileHover={bounce ? { scale: 1.1, rotate: [0, -10, 10, 0] } : { scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </motion.button>
  );
};

/**
 * Gradient Button with Animated Background
 */
export const GradientAnimatedButton = ({
  children,
  onClick,
  className = '',
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.button
      className={`relative px-6 py-3 rounded-lg font-semibold text-white overflow-hidden ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      {...props}
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
        animate={isHovered ? { backgroundPosition: '200% center' } : { backgroundPosition: '0% center' }}
        transition={{ duration: 0.8, ease: 'linear' }}
        style={{ backgroundSize: '200% 100%' }}
      />

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-white/20 blur-xl"
        animate={isHovered ? { scale: 1.2, opacity: 0.5 } : { scale: 1, opacity: 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default AnimatedButton;
