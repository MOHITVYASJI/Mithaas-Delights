import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { performanceUtils } from '../utils/animationUtils';

gsap.registerPlugin(ScrollTrigger);

/**
 * Custom hook for scroll-triggered animations
 * @param {Object} options - Animation options
 * @returns {Object} - Ref to attach to element
 */
export const useScrollAnimation = (options = {}) => {
  const elementRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // Skip animations if user prefers reduced motion
    if (performanceUtils.prefersReducedMotion()) {
      return;
    }

    if (!elementRef.current) return;

    const defaults = {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: elementRef.current,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
      },
    };

    // Merge options with defaults
    const animationOptions = {
      ...defaults,
      ...options,
      scrollTrigger: {
        ...defaults.scrollTrigger,
        ...options.scrollTrigger,
      },
    };

    // Create animation
    animationRef.current = gsap.from(elementRef.current, animationOptions);

    // Cleanup
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [options]);

  return elementRef;
};

/**
 * Hook for parallax scroll effect
 * @param {number} speed - Parallax speed (0-1)
 * @returns {Object} - Ref to attach to element
 */
export const useParallax = (speed = 0.5) => {
  const elementRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (performanceUtils.prefersReducedMotion() || !elementRef.current) {
      return;
    }

    animationRef.current = gsap.to(elementRef.current, {
      y: () => window.innerHeight * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: elementRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [speed]);

  return elementRef;
};

/**
 * Hook for stagger animation on multiple elements
 * @param {Object} options - Stagger animation options
 * @returns {Object} - Ref to attach to container element
 */
export const useStaggerAnimation = (options = {}) => {
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (performanceUtils.prefersReducedMotion() || !containerRef.current) {
      return;
    }

    const children = containerRef.current.children;
    if (children.length === 0) return;

    const defaults = {
      opacity: 0,
      y: 30,
      duration: 0.6,
      ease: 'power3.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    };

    const animationOptions = {
      ...defaults,
      ...options,
      scrollTrigger: {
        ...defaults.scrollTrigger,
        ...options.scrollTrigger,
      },
    };

    animationRef.current = gsap.from(children, animationOptions);

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [options]);

  return containerRef;
};

/**
 * Hook for scale animation on scroll
 * @param {Object} options - Scale animation options
 * @returns {Object} - Ref to attach to element
 */
export const useScaleOnScroll = (options = {}) => {
  const elementRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (performanceUtils.prefersReducedMotion() || !elementRef.current) {
      return;
    }

    const defaults = {
      scale: 0.8,
      opacity: 0,
      duration: 1,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: elementRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    };

    animationRef.current = gsap.from(elementRef.current, {
      ...defaults,
      ...options,
      scrollTrigger: {
        ...defaults.scrollTrigger,
        ...options.scrollTrigger,
      },
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [options]);

  return elementRef;
};

/**
 * Hook for revealing text animation
 * @param {Object} options - Text reveal options
 * @returns {Object} - Ref to attach to text element
 */
export const useTextReveal = (options = {}) => {
  const textRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (performanceUtils.prefersReducedMotion() || !textRef.current) {
      return;
    }

    // Split text into words
    const text = textRef.current.textContent;
    const words = text.split(' ');
    textRef.current.innerHTML = words
      .map((word) => `<span class="word" style="display: inline-block; overflow: hidden;"><span style="display: inline-block;">${word}</span></span>`)
      .join(' ');

    const wordElements = textRef.current.querySelectorAll('.word span');

    const defaults = {
      y: '100%',
      duration: 0.8,
      ease: 'power4.out',
      stagger: 0.05,
      scrollTrigger: {
        trigger: textRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    };

    animationRef.current = gsap.from(wordElements, {
      ...defaults,
      ...options,
      scrollTrigger: {
        ...defaults.scrollTrigger,
        ...options.scrollTrigger,
      },
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [options]);

  return textRef;
};

export default {
  useScrollAnimation,
  useParallax,
  useStaggerAnimation,
  useScaleOnScroll,
  useTextReveal,
};
