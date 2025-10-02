import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, ExternalLink, Calendar, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Enhanced Banner Carousel Component
export const EnhancedBannerCarousel = ({ placement = 'hero' }) => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, [placement]);

  useEffect(() => {
    if (!autoPlay || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [autoPlay, banners.length]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/banners/enhanced?placement=${placement}&active_only=true`);
      setBanners(response.data);
      
      // Record banner views
      if (response.data.length > 0) {
        response.data.forEach(banner => {
          recordBannerView(banner.id);
        });
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordBannerView = async (bannerId) => {
    try {
      await axios.post(`${API}/banners/enhanced/${bannerId}/view`);
    } catch (error) {
      // Silent fail for analytics
    }
  };

  const handleBannerClick = async (banner) => {
    // Record click analytics
    try {
      await axios.post(`${API}/banners/enhanced/${banner.id}/click`);
    } catch (error) {
      // Silent fail for analytics
    }
    
    // Handle click action
    if (banner.cta_link) {
      if (banner.cta_link.startsWith('http')) {
        window.open(banner.cta_link, '_blank');
      } else {
        window.location.href = banner.cta_link;
      }
    }
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1);
    setAutoPlay(false); // Stop auto-play when user interacts
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1);
    setAutoPlay(false); // Stop auto-play when user interacts
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setAutoPlay(false);
  };

  if (loading) {
    return (
      <div className="relative w-full h-96 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-gray-200"></div>
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return null; // Don't render anything if no banners
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl group" data-testid="banner-carousel">
      {/* Banner Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-in-out"
        style={{ 
          backgroundImage: `url(${currentBanner.image_url})`,
          transform: 'scale(1.05)' // Slight zoom for parallax effect
        }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
          style={{ opacity: currentBanner.overlay_opacity || 0.3 }}
        ></div>
      </div>

      {/* Banner Content */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-4xl">
          {/* Festival Badge */}
          {currentBanner.festival_name && (
            <Badge 
              className="bg-orange-500 text-white px-4 py-2 text-sm font-semibold"
              data-testid="festival-badge"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {currentBanner.festival_name} Special
            </Badge>
          )}
          
          {/* Main Title */}
          <div className="space-y-4">
            <h1 
              className="text-4xl lg:text-6xl font-bold leading-tight"
              style={{ color: currentBanner.text_color || '#ffffff' }}
              data-testid="banner-title"
            >
              {currentBanner.title}
            </h1>
            
            {/* Subtitle */}
            {currentBanner.subtitle && (
              <h2 
                className="text-xl lg:text-2xl font-medium opacity-90"
                style={{ color: currentBanner.text_color || '#ffffff' }}
                data-testid="banner-subtitle"
              >
                {currentBanner.subtitle}
              </h2>
            )}
          </div>
          
          {/* Description */}
          {currentBanner.description && (
            <p 
              className="text-lg lg:text-xl max-w-2xl mx-auto opacity-80"
              style={{ color: currentBanner.text_color || '#ffffff' }}
              data-testid="banner-description"
            >
              {currentBanner.description}
            </p>
          )}
          
          {/* Call to Action */}
          {currentBanner.cta_text && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 text-lg font-semibold shadow-xl transform hover:scale-105 transition-all duration-200"
                onClick={() => handleBannerClick(currentBanner)}
                data-testid="banner-cta-button"
              >
                {currentBanner.cta_text}
                <ExternalLink className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <Button 
            variant="ghost" 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={goToPrevious}
            data-testid="banner-prev-button"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <Button 
            variant="ghost" 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={goToNext}
            data-testid="banner-next-button"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-white scale-110' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              onClick={() => goToSlide(index)}
              data-testid={`banner-indicator-${index}`}
            ></button>
          ))}
        </div>
      )}

      {/* Banner Info Badge */}
      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Badge className="bg-black/50 text-white border-none">
          {currentIndex + 1} of {banners.length}
        </Badge>
      </div>
    </div>
  );
};

// Small Banner Component for other placements
export const EnhancedSmallBanner = ({ placement = 'sidebar', className = '' }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, [placement]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/banners/enhanced?placement=${placement}&active_only=true`);
      setBanners(response.data.slice(0, 3)); // Limit to 3 for small banners
      
      // Record banner views
      response.data.forEach(banner => {
        recordBannerView(banner.id);
      });
    } catch (error) {
      console.error('Error fetching small banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordBannerView = async (bannerId) => {
    try {
      await axios.post(`${API}/banners/enhanced/${bannerId}/view`);
    } catch (error) {
      // Silent fail
    }
  };

  const handleBannerClick = async (banner) => {
    try {
      await axios.post(`${API}/banners/enhanced/${banner.id}/click`);
    } catch (error) {
      // Silent fail
    }
    
    if (banner.cta_link) {
      if (banner.cta_link.startsWith('http')) {
        window.open(banner.cta_link, '_blank');
      } else {
        window.location.href = banner.cta_link;
      }
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="small-banners">
      {banners.map((banner, index) => (
        <Card 
          key={banner.id}
          className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => handleBannerClick(banner)}
          data-testid={`small-banner-${index}`}
        >
          <CardContent className="p-0">
            <div className="relative">
              <img 
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-32 object-cover"
                onError={(e) => {
                  e.target.src = '/api/placeholder/300/128';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <h4 className="font-semibold text-sm line-clamp-1">{banner.title}</h4>
                {banner.subtitle && (
                  <p className="text-xs opacity-90 line-clamp-1">{banner.subtitle}</p>
                )}
                
                {banner.festival_name && (
                  <Badge className="bg-orange-500 text-white text-xs mt-1">
                    {banner.festival_name}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default {
  EnhancedBannerCarousel,
  EnhancedSmallBanner
};
