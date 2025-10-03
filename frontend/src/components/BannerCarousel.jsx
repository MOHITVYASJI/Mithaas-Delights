import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    // Auto-rotate banners every 5 seconds
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/banners?active_only=true`);
      setBanners(response.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (loading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-64 md:h-96 bg-gradient-to-r from-orange-100 to-amber-100 overflow-hidden rounded-xl shadow-lg mb-8" data-testid="banner-carousel">
      {/* Banner Images with transition */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <img
            key={banner.id}
            src={banner.image_url}
            alt={banner.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        ))}
      </div>
      
      {/* Overlay Content */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
        <div className="container mx-auto px-6 pb-8">
          <div className="max-w-2xl text-white">
            <div className="mb-2">
              <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {currentBanner.festival_name}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" data-testid="banner-title">
              {currentBanner.title}
            </h2>
            {currentBanner.description && (
              <p className="text-lg mb-4 text-gray-100">
                {currentBanner.description}
              </p>
            )}
            {currentBanner.cta_link && (
              <Button
                className="bg-white text-orange-600 hover:bg-orange-50 font-semibold"
                onClick={() => window.location.href = currentBanner.cta_link}
                data-testid="banner-cta-button"
              >
                {currentBanner.cta_text || 'Shop Now'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevBanner}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all"
            data-testid="banner-prev-button"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextBanner}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all"
            data-testid="banner-next-button"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              data-testid={`banner-dot-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
