import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdvertisementSection = () => {
  const [advertisements, setAdvertisements] = useState([]);
  const [dismissedAds, setDismissedAds] = useState([]);
  const [hoveredAdId, setHoveredAdId] = useState(null);

  useEffect(() => {
    fetchAdvertisements();
    // Load dismissed ads from localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedAds') || '[]');
    setDismissedAds(dismissed);
  }, []);

  const fetchAdvertisements = async () => {
    try {
      const response = await axios.get(`${API}/advertisements?active_only=true`);
      setAdvertisements(response.data);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
    }
  };

  const recordImpression = async (adId) => {
    try {
      await axios.post(`${API}/advertisements/${adId}/impression`);
    } catch (error) {
      console.error('Error recording impression:', error);
    }
  };

  const recordClick = async (adId) => {
    try {
      await axios.post(`${API}/advertisements/${adId}/click`);
    } catch (error) {
      console.error('Error recording click:', error);
    }
  };

  const dismissAd = (adId) => {
    const newDismissed = [...dismissedAds, adId];
    setDismissedAds(newDismissed);
    localStorage.setItem('dismissedAds', JSON.stringify(newDismissed));
  };

  const getAdIcon = (adType) => {
    switch (adType) {
      case 'banner': return <Sparkles className="w-4 h-4" />;
      case 'promotional': return <Zap className="w-4 h-4" />;
      case 'featured': return <TrendingUp className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getAdColor = (adType) => {
    switch (adType) {
      case 'banner': return 'from-purple-500 to-pink-500';
      case 'promotional': return 'from-green-500 to-emerald-500';
      case 'featured': return 'from-blue-500 to-cyan-500';
      default: return 'from-orange-500 to-red-500';
    }
  };

  const visibleAds = advertisements.filter(ad => !dismissedAds.includes(ad.id));

  if (visibleAds.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-orange-50 to-amber-50 relative overflow-hidden" data-testid="advertisement-section">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-4 animate-pulse">
            ✨ Special Offers
          </Badge>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Exclusive 
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Deals</span>
          </h2>
          <p className="text-gray-600">Don't miss out on these amazing offers!</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {visibleAds.map((ad, index) => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                onHoverStart={() => setHoveredAdId(ad.id)}
                onHoverEnd={() => setHoveredAdId(null)}
              >
                <Card
                  className="relative overflow-hidden border-2 border-transparent bg-gradient-to-br from-white to-orange-50 shadow-lg hover:shadow-2xl transition-all duration-300"
                  style={{
                    borderImage: hoveredAdId === ad.id ? `linear-gradient(135deg, ${getAdColor(ad.ad_type).split(' ')[0].split('-')[1]}, ${getAdColor(ad.ad_type).split(' ')[2].split('-')[1]}) 1` : 'none'
                  }}
                  data-testid={`advertisement-card-${ad.id}`}
                >
                  {/* Animated Border */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${getAdColor(ad.ad_type)} opacity-0 pointer-events-none`}
                    animate={{
                      opacity: hoveredAdId === ad.id ? [0, 0.1, 0] : 0,
                    }}
                    transition={{
                      duration: 2,
                      repeat: hoveredAdId === ad.id ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAd(ad.id)}
                    className="absolute top-2 right-2 z-20 bg-white/90 hover:bg-white rounded-full w-8 h-8 p-0 shadow-lg transition-all duration-200 hover:scale-110"
                    data-testid={`dismiss-ad-${ad.id}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  
                  {/* Promotional Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className={`bg-gradient-to-r ${getAdColor(ad.ad_type)} text-white font-bold animate-pulse shadow-lg`}>
                      {getAdIcon(ad.ad_type)}
                      <span className="ml-1">HOT</span>
                    </Badge>
                  </div>

                  {ad.media_url && (
                    <div className="relative h-48 overflow-hidden">
                      <motion.img
                        src={ad.media_url}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                        onLoad={() => recordImpression(ad.id)}
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )}
                  
                  <CardContent className="p-6 relative">
                    {/* Floating Particles */}
                    <motion.div
                      className="absolute top-2 right-4 w-2 h-2 bg-orange-400 rounded-full"
                      animate={{
                        y: [-5, -15, -5],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div
                      className="absolute top-6 right-8 w-1 h-1 bg-amber-400 rounded-full"
                      animate={{
                        y: [-3, -10, -3],
                        opacity: [0.3, 0.8, 0.3],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                      }}
                    />

                    <div className="mb-3">
                      <motion.span 
                        className={`bg-gradient-to-r ${getAdColor(ad.ad_type)} text-white text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-md`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {getAdIcon(ad.ad_type)}
                        {ad.ad_type.replace('_', ' ').toUpperCase()}
                      </motion.span>
                    </div>
                    
                    <motion.h3 
                      className="text-xl font-bold text-gray-800 mb-2 line-clamp-2" 
                      data-testid="ad-title"
                      whileHover={{ color: "#f97316" }}
                      transition={{ duration: 0.2 }}
                    >
                      {ad.title}
                    </motion.h3>
                    
                    {ad.description && (
                      <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                        {ad.description}
                      </p>
                    )}
                    
                    {ad.click_url && (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          className={`w-full bg-gradient-to-r ${getAdColor(ad.ad_type)} hover:shadow-xl text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 relative overflow-hidden group`}
                          onClick={() => {
                            recordClick(ad.id);
                            window.location.href = ad.click_url;
                          }}
                          data-testid="ad-cta-button"
                        >
                          {/* Shimmer Effect */}
                          <motion.div
                            className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full"
                            transition={{ duration: 0.6 }}
                          />
                          
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {getAdIcon(ad.ad_type)}
                            {ad.cta_text || 'Learn More'}
                          </span>
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>

                  {/* Hover Glow Effect */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${getAdColor(ad.ad_type)} opacity-0 pointer-events-none rounded-lg`}
                    animate={{
                      opacity: hoveredAdId === ad.id ? 0.05 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default AdvertisementSection;