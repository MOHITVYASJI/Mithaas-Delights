import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdvertisementSection = () => {
  const [advertisements, setAdvertisements] = useState([]);
  const [dismissedAds, setDismissedAds] = useState([]);

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

  const dismissAd = (adId) => {
    const newDismissed = [...dismissedAds, adId];
    setDismissedAds(newDismissed);
    localStorage.setItem('dismissedAds', JSON.stringify(newDismissed));
  };

  const visibleAds = advertisements.filter(ad => !dismissedAds.includes(ad.id));

  if (visibleAds.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-orange-50 to-amber-50" data-testid="advertisement-section">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleAds.map((ad) => (
            <Card
              key={ad.id}
              className="relative overflow-hidden hover:shadow-xl transition-shadow duration-300 border-2 border-orange-200"
              data-testid={`advertisement-card-${ad.id}`}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAd(ad.id)}
                className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white rounded-full w-8 h-8 p-0"
                data-testid={`dismiss-ad-${ad.id}`}
              >
                <X className="w-4 h-4" />
              </Button>
              
              {ad.image_url && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="mb-2">
                  <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {ad.ad_type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2" data-testid="ad-title">
                  {ad.title}
                </h3>
                {ad.description && (
                  <p className="text-gray-600 mb-4 line-clamp-3">{ad.description}</p>
                )}
                {ad.link_url && (
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                    onClick={() => window.location.href = ad.link_url}
                    data-testid="ad-cta-button"
                  >
                    {ad.link_text || 'Learn More'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvertisementSection;
