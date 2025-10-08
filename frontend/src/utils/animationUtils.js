// Animation utility functions for GSAP, Framer Motion, and performance optimization

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP Animation Presets
 */
export const gsapPresets = {
  // Fade animations
  fadeIn: {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: 'power3.out',
  },
  fadeInUp: {
    opacity: 0,
    y: 60,
    duration: 1,
    ease: 'power4.out',
  },
  fadeInDown: {
    opacity: 0,
    y: -60,
    duration: 1,
    ease: 'power4.out',
  },
  fadeInLeft: {
    opacity: 0,
    x: -60,
    duration: 1,
    ease: 'power4.out',
  },
  fadeInRight: {
    opacity: 0,
    x: 60,
    duration: 1,
    ease: 'power4.out',
  },
  
  // Scale animations
  scaleIn: {
    opacity: 0,
    scale: 0.8,
    duration: 0.6,
    ease: 'back.out(1.7)',
  },
  scaleInBounce: {
    opacity: 0,
    scale: 0.5,
    duration: 0.8,
    ease: 'elastic.out(1, 0.5)',
  },
  
  // Stagger animations
  staggerChildren: {
    opacity: 0,
    y: 30,
    duration: 0.6,
    ease: 'power3.out',
    stagger: {
      amount: 0.3,
      from: 'start',
    },
  },
};

/**
 * Framer Motion Variants
 */
export const motionVariants = {
  // Container variants
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },
  
  // Item variants
  item: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  },
  
  // Card hover
  cardHover: {
    rest: { scale: 1, y: 0 },
    hover: {
      scale: 1.05,
      y: -10,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    },
  },
  
  // Button tap
  buttonTap: {
    scale: 0.95,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    },
  },
  
  // Modal animations
  modal: {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 100,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 100,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  },
  
  // Backdrop
  backdrop: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  },
  
  // Slide animations
  slideInLeft: {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
      },
    },
  },
  
  slideInRight: {
    hidden: { x: 100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
      },
    },
  },
};

/**
 * Scroll-triggered animation helper
 */
export const createScrollAnimation = (element, options = {}) => {
  const defaults = {
    trigger: element,
    start: 'top 80%',
    end: 'bottom 20%',
    toggleActions: 'play none none reverse',
    markers: false,
  };

  return gsap.from(element, {
    ...gsapPresets.fadeInUp,
    scrollTrigger: {
      ...defaults,
      ...options.scrollTrigger,
    },
    ...options.animation,
  });
};

/**
 * Parallax scroll animation
 */
export const createParallax = (element, speed = 0.5) => {
  return gsap.to(element, {
    y: () => window.innerHeight * speed,
    ease: 'none',
    scrollTrigger: {
      trigger: element,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
};

/**
 * Performance utilities
 */
export const performanceUtils = {
  // Check if device prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Check if device is mobile
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  },
  
  // Enable GPU acceleration
  enableGPU: (element) => {
    if (element) {
      element.style.transform = 'translateZ(0)';
      element.style.willChange = 'transform';
    }
  },
  
  // Disable GPU acceleration (cleanup)
  disableGPU: (element) => {
    if (element) {
      element.style.willChange = 'auto';
    }
  },
  
  // Throttle function for performance
  throttle: (func, delay) => {
    let lastCall = 0;
    return (...args) => {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return func(...args);
    };
  },
  
  // Debounce function
  debounce: (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },
};

/**
 * Page transition configurations
 */
export const pageTransitions = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  
  slideUp: {
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -50, opacity: 0 },
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
  
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};

/**
 * Stagger animation helper for lists
 */
export const staggerAnimation = (elements, options = {}) => {
  const defaults = {
    opacity: 0,
    y: 30,
    duration: 0.6,
    ease: 'power3.out',
    stagger: 0.1,
  };

  return gsap.from(elements, {
    ...defaults,
    ...options,
  });
};

/**
 * Magnetic button effect
 */
export const magneticEffect = (element, strength = 0.3) => {
  element.addEventListener('mousemove', (e) => {
    const bounds = element.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    gsap.to(element, {
      x: deltaX,
      y: deltaY,
      duration: 0.3,
      ease: 'power2.out',
    });
  });

  element.addEventListener('mouseleave', () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
    });
  });
};

export default {
  gsapPresets,
  motionVariants,
  createScrollAnimation,
  createParallax,
  performanceUtils,
  pageTransitions,
  staggerAnimation,
  magneticEffect,
};
