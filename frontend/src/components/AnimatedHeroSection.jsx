import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronRight, Sparkles } from 'lucide-react';
import { AnimatedButton } from './AnimatedButton';
import { Hero3DBackground } from './Hero3DBackground';
import { HeroGIFBackground } from './HeroGIFBackground';
import { useScrollAnimation, useParallax } from '../hooks/useScrollAnimation';

gsap.registerPlugin(ScrollTrigger);

/**
 * Enhanced Animated Hero Section
 * Features: GSAP animations, parallax, 3D/GIF background, smooth transitions
 * 
 * GIF Background लगाने के लिए:
 * 1. use3DBackground को false करें (line 18)
 * 2. heroGifPath में अपनी GIF का path डालें
 */
export const AnimatedHeroSection = ({ 
  onCTAClick,
  use3DBackground = false,  // Changed to use GIF instead of 3D
  heroGifPath = '/hero-animation.mp4',  // Use the existing video file
  gifOpacity = 0.4,
  gifBlend = 'normal'
}) => {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);
  const imageRef = useRef(null);

  // Parallax references
  const parallaxBg = useParallax(-0.3);
  const parallaxContent = useParallax(0.1);

  useEffect(() => {
    // Hero entrance animation sequence
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.from(titleRef.current, {
      y: 100,
      opacity: 0,
      duration: 1.2,
      ease: 'elastic.out(1, 0.8)',
    })
      .from(
        subtitleRef.current,
        {
          y: 50,
          opacity: 0,
          duration: 0.8,
        },
        '-=0.6'
      )
      .from(
        ctaRef.current,
        {
          scale: 0.8,
          opacity: 0,
          duration: 0.6,
          ease: 'back.out(1.7)',
        },
        '-=0.4'
      )
      .from(
        imageRef.current,
        {
          x: 100,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
        },
        '-=0.8'
      );

    // Floating animation for hero elements
    gsap.to(imageRef.current, {
      y: -20,
      duration: 2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });

    // Parallax effect on scroll
    gsap.to(heroRef.current, {
      y: 200,
      opacity: 0.3,
      ease: 'none',
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // Floating particles animation data
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }));

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
    >
      {/* Background - 3D या GIF */}
      <div ref={parallaxBg}>
        {use3DBackground ? (
          <Hero3DBackground />
        ) : (
          <HeroGIFBackground 
            gifPath={heroGifPath}
            opacity={gifOpacity}
            blend={gifBlend}
          />
        )}
      </div>

      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-yellow-500/10"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 10,
          ease: 'linear',
          repeat: Infinity,
        }}
        style={{ backgroundSize: '200% 200%' }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full opacity-30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Main content */}
      <div ref={parallaxContent} className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-center md:text-left space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Authentic Indian Sweets</span>
            </motion.div>

            {/* Title with text reveal */}
            <div ref={titleRef} className="overflow-hidden">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
                  Mithaas
                </span>
                <br />
                <span className="text-gray-900 dark:text-white">Delights</span>
              </h1>
            </div>

            {/* Subtitle */}
            <p
              ref={subtitleRef}
              className="text-xl md:text-2xl text-black dark:text-gray-300 max-w-xl"
            >
              Experience the authentic taste of traditional Indian sweets, crafted with love and
              premium ingredients.
            </p>

            {/* CTA Buttons */}
            <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <AnimatedButton
                size="lg"
                magnetic={true}
                ripple={true}
                glow={true}
                onClick={onCTAClick}
                className="text-stone-950 text-lg px-8 py-6"
              >
                Explore Sweets
                <ChevronRight className="ml-2 w-5 h-5" />
              </AnimatedButton>

              <AnimatedButton
                size="lg"
                variant="outline"
                magnetic={true}
                className="text-lg px-8 py-6"
              >
                View Menu
              </AnimatedButton>
            </div>

            {/* Stats with counter animation */}
            <motion.div
              className="grid grid-cols-3 gap-6 pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              {[
                { value: '500+', label: 'Products' },
                { value: '10K+', label: 'Happy Customers' },
                { value: '100%', label: 'Fresh & Pure' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right content - Hero image */}
          <motion.div
            ref={imageRef}
            className="relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {/* Decorative circles */}
            <motion.div
              className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full blur-3xl opacity-50"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <motion.div
              className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full blur-3xl opacity-50"
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -90, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Main image container */}
            <motion.div
              className="relative z-10 rounded-3xl overflow-hidden shadow-2xl"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <img
                src="/mithaas_delights.png"
                alt="Delicious Indian Sweets"
                className="w-full h-auto object-cover"
                onError={(e) => {
                  e.target.src =
                    'https://images.unsplash.com/photo-1605713288610-00c1c630ca1e?w=600&h=600&fit=crop';
                }}
              />

              {/* Shimmer overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                  repeatDelay: 2,
                }}
              />
            </motion.div>

            {/* Floating badges */}
            <motion.div
              className="absolute -top-5 -left-5 bg-white dark:bg-gray-800 rounded-full p-4 shadow-lg"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <span className="text-2xl">🍬</span>
            </motion.div>

            <motion.div
              className="absolute -bottom-5 -right-5 bg-white dark:bg-gray-800 rounded-full p-4 shadow-lg"
              animate={{
                y: [0, 10, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1.5,
              }}
            >
              <span className="text-2xl">✨</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="w-6 h-10 border-2 border-gray-900 dark:border-white rounded-full flex items-start justify-center p-2">
          <motion.div
            className="w-1 h-2 bg-gray-900 dark:bg-white rounded-full"
            animate={{
              y: [0, 12, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default AnimatedHeroSection;
