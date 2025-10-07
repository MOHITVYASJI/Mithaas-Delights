import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Volume2, Megaphone } from 'lucide-react';
import { Button } from './ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const MarqueeAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
    // Load dismissed announcements from localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
    setDismissedAnnouncements(dismissed);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/announcements/active?page=home`);
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const recordDisplay = async (announcementId) => {
    try {
      await axios.post(`${API}/announcements/${announcementId}/display`);
    } catch (error) {
      console.error('Error recording display:', error);
    }
  };

  const recordClick = async (announcementId) => {
    try {
      await axios.post(`${API}/announcements/${announcementId}/click`);
    } catch (error) {
      console.error('Error recording click:', error);
    }
  };

  const dismissAnnouncement = (announcementId) => {
    const newDismissed = [...dismissedAnnouncements, announcementId];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  // Filter announcements by type and dismissed status
  const visibleMarqueeAnnouncements = announcements.filter(
    ann => ann.announcement_type === 'marquee' && !dismissedAnnouncements.includes(ann.id)
  );
  
  const visibleBannerAnnouncements = announcements.filter(
    ann => ann.announcement_type === 'banner' && !dismissedAnnouncements.includes(ann.id)
  );

  const visiblePopupAnnouncements = announcements.filter(
    ann => ann.announcement_type === 'popup' && !dismissedAnnouncements.includes(ann.id)
  );

  // Record display for all visible announcements
  useEffect(() => {
    announcements.forEach(ann => {
      if (!dismissedAnnouncements.includes(ann.id)) {
        recordDisplay(ann.id);
      }
    });
  }, [announcements, dismissedAnnouncements]);

  if (loading || announcements.length === 0) {
    return null;
  }

  return (
    <>
      {/* Scrolling Marquee Announcements */}
      {visibleMarqueeAnnouncements.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white py-2 relative overflow-hidden shadow-lg" data-testid="marquee-section">
          <div className="flex items-center">
            <div className="flex items-center space-x-2 px-4 flex-shrink-0 bg-black/20 py-1">
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span className="font-semibold text-sm">ANNOUNCEMENTS</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="animate-marquee flex whitespace-nowrap">
                {visibleMarqueeAnnouncements.map((announcement, index) => (
                  <span
                    key={announcement.id}
                    className="px-8 py-1 cursor-pointer hover:bg-white/10 transition-colors rounded"
                    onClick={() => {
                      recordClick(announcement.id);
                      if (announcement.action_url) {
                        window.open(announcement.action_url, '_blank');
                      }
                    }}
                    data-testid={`marquee-announcement-${announcement.id}`}
                  >
                    <Megaphone className="w-4 h-4 inline mr-2" />
                    {announcement.content}
                    {announcement.action_text && announcement.action_url && (
                      <span className="ml-2 underline font-medium">
                        {announcement.action_text}
                      </span>
                    )}
                    {index < visibleMarqueeAnnouncements.length - 1 && (
                      <span className="mx-4 text-white/70">•</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                visibleMarqueeAnnouncements.forEach(ann => dismissAnnouncement(ann.id));
              }}
              className="text-white hover:bg-white/20 px-2 mr-2 flex-shrink-0"
              data-testid="dismiss-marquee-button"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Banner Announcements */}
      {visibleBannerAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white py-3 px-4 mb-4 mx-4 rounded-lg shadow-lg relative"
          data-testid={`banner-announcement-${announcement.id}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="bg-white/20 p-2 rounded-full">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{announcement.title}</h3>
                <p className="text-sm opacity-90">{announcement.content}</p>
                {announcement.action_text && announcement.action_url && (
                  <Button
                    size="sm"
                    className="mt-2 bg-white text-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      recordClick(announcement.id);
                      window.open(announcement.action_url, '_blank');
                    }}
                  >
                    {announcement.action_text}
                  </Button>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissAnnouncement(announcement.id)}
              className="text-white hover:bg-white/20"
              data-testid={`dismiss-banner-${announcement.id}`}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      ))}

      {/* Popup Announcements */}
      {visiblePopupAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          data-testid={`popup-announcement-${announcement.id}`}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full relative overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Megaphone className="w-6 h-6" />
                  <h3 className="font-bold text-lg">{announcement.title}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAnnouncement(announcement.id)}
                  className="text-white hover:bg-white/20"
                  data-testid={`dismiss-popup-${announcement.id}`}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">{announcement.content}</p>
              {announcement.action_text && announcement.action_url && (
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  onClick={() => {
                    recordClick(announcement.id);
                    window.open(announcement.action_url, '_blank');
                    dismissAnnouncement(announcement.id);
                  }}
                >
                  {announcement.action_text}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default MarqueeAnnouncements;