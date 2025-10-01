import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Image, Video, Eye } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent } from '../components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const MediaGalleryPage = () => {
  const [mediaItems, setMediaItems] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, image, video

  useEffect(() => {
    fetchMediaGallery();
  }, []);

  const fetchMediaGallery = async () => {
    try {
      const response = await axios.get(`${API}/media`);
      setMediaItems(response.data);
    } catch (error) {
      console.error('Error fetching media gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = filter === 'all' 
    ? mediaItems 
    : mediaItems.filter(item => item.media_type === filter);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Media Gallery</h1>
          <p className="text-lg text-gray-600 mb-6">
            Explore our delicious collection of sweets and treats
          </p>
          
          {/* Filter Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-full ${
                filter === 'all' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
              data-testid="filter-all"
            >
              All
            </button>
            <button
              onClick={() => setFilter('image')}
              className={`px-6 py-2 rounded-full flex items-center ${
                filter === 'image' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
              data-testid="filter-image"
            >
              <Image className="w-4 h-4 mr-2" />
              Photos
            </button>
            <button
              onClick={() => setFilter('video')}
              className={`px-6 py-2 rounded-full flex items-center ${
                filter === 'video' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
              data-testid="filter-video"
            >
              <Video className="w-4 h-4 mr-2" />
              Videos
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading gallery...</p>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No media items found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedia.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedMedia(item)}
                data-testid="media-item"
              >
                <div className="relative aspect-square">
                  {item.media_type === 'image' ? (
                    <img
                      src={item.media_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full bg-gray-200">
                      <video
                        src={item.media_url}
                        className="w-full h-full object-cover"
                        poster={item.thumbnail_url}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-orange-500" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-orange-500">
                      {item.media_type === 'image' ? 'Photo' : 'Video'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Media Viewer Dialog */}
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-4xl">
            {selectedMedia && (
              <div>
                <h2 className="text-2xl font-bold mb-4">{selectedMedia.title}</h2>
                {selectedMedia.media_type === 'image' ? (
                  <img
                    src={selectedMedia.media_url}
                    alt={selectedMedia.title}
                    className="w-full rounded-lg"
                  />
                ) : (
                  <video
                    src={selectedMedia.media_url}
                    controls
                    className="w-full rounded-lg"
                    autoPlay
                  />
                )}
                {selectedMedia.description && (
                  <p className="mt-4 text-gray-600">{selectedMedia.description}</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MediaGalleryPage;