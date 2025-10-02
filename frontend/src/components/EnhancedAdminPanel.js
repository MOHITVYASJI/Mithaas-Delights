import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, Eye, Package, Users, BarChart, Settings, Star, Check, X, 
  MessageSquare, Palette, Bell, Image, Upload, Save, RefreshCw, Send, 
  Megaphone, Calendar, MapPin, TrendingUp, FileText, Zap
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Textarea } from './ui/textarea';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Get auth token
const getAuthToken = () => localStorage.getItem('token');
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`
});

// Enhanced Theme Manager Component
const ThemeManager = () => {
  const [themes, setThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchThemes();
    fetchActiveTheme();
  }, []);

  const fetchThemes = async () => {
    try {
      const response = await axios.get(`${API}/themes/enhanced/all`);
      setThemes(response.data);
    } catch (error) {
      console.error('Error fetching themes:', error);
      toast.error('Failed to fetch themes');
    }
  };

  const fetchActiveTheme = async () => {
    try {
      const response = await axios.get(`${API}/themes/enhanced/active`);
      setActiveTheme(response.data);
    } catch (error) {
      console.error('Error fetching active theme:', error);
    }
  };

  const activateTheme = async (themeId) => {
    try {
      setLoading(true);
      await axios.put(`${API}/themes/enhanced/${themeId}/activate`, {}, {
        headers: getAuthHeaders()
      });
      
      toast.success('Theme activated successfully');
      fetchActiveTheme();
      
      // Force page reload to apply new theme
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error activating theme:', error);
      toast.error('Failed to activate theme');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Theme Management</h3>
        <Button onClick={fetchThemes} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <Card 
            key={theme.id} 
            className={`cursor-pointer transition-all duration-200 ${
              activeTheme?.id === theme.id 
                ? 'ring-2 ring-orange-500 bg-orange-50' 
                : 'hover:shadow-md'
            }`}
            data-testid="theme-card"
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{theme.display_name}</h4>
                  {activeTheme?.id === theme.id && (
                    <Badge className="bg-green-500">
                      <Check className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                
                {theme.description && (
                  <p className="text-sm text-gray-600">{theme.description}</p>
                )}
                
                {/* Color Preview */}
                <div className="flex space-x-2">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: theme.colors?.primary }}
                    title="Primary Color"
                  ></div>
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: theme.colors?.secondary }}
                    title="Secondary Color"
                  ></div>
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: theme.colors?.accent }}
                    title="Accent Color"
                  ></div>
                </div>
                
                {theme.festival_mode && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    Festival: {theme.festival_name}
                  </Badge>
                )}
                
                <Button 
                  onClick={() => activateTheme(theme.id)}
                  disabled={activeTheme?.id === theme.id || loading}
                  className="w-full"
                  size="sm"
                  data-testid="activate-theme-button"
                >
                  {loading ? 'Activating...' : activeTheme?.id === theme.id ? 'Current Theme' : 'Activate Theme'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Enhanced Banner Manager Component
const BannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    festival_name: '',
    description: '',
    cta_text: 'Shop Now',
    cta_link: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${API}/banners/enhanced?active_only=false`);
      setBanners(response.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to fetch banners');
    }
  };

  const createBanner = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/banners/enhanced`, formData, {
        headers: getAuthHeaders()
      });
      
      toast.success('Banner created successfully');
      setShowCreateDialog(false);
      setFormData({
        title: '',
        subtitle: '',
        image_url: '',
        festival_name: '',
        description: '',
        cta_text: 'Shop Now',
        cta_link: '',
        display_order: 0,
        is_active: true
      });
      fetchBanners();
    } catch (error) {
      console.error('Error creating banner:', error);
      toast.error('Failed to create banner');
    } finally {
      setLoading(false);
    }
  };

  const deleteBanner = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      await axios.delete(`${API}/banners/enhanced/${bannerId}`, {
        headers: getAuthHeaders()
      });
      
      toast.success('Banner deleted successfully');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Banner Management</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-banner-button">
              <Plus className="w-4 h-4 mr-2" />
              Create Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Banner title"
                    data-testid="banner-title-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subtitle</label>
                  <Input 
                    value={formData.subtitle}
                    onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                    placeholder="Banner subtitle"
                    data-testid="banner-subtitle-input"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Image URL *</label>
                <Input 
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  data-testid="banner-image-url-input"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Festival Name</label>
                  <Input 
                    value={formData.festival_name}
                    onChange={(e) => setFormData({...formData, festival_name: e.target.value})}
                    placeholder="e.g., Diwali, Holi"
                    data-testid="banner-festival-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CTA Text</label>
                  <Input 
                    value={formData.cta_text}
                    onChange={(e) => setFormData({...formData, cta_text: e.target.value})}
                    placeholder="Shop Now"
                    data-testid="banner-cta-text-input"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Banner description"
                  rows={3}
                  data-testid="banner-description-input"
                />
              </div>
              
              <div className="flex space-x-4">
                <Button onClick={createBanner} disabled={loading} data-testid="save-banner-button">
                  {loading ? 'Creating...' : 'Create Banner'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map((banner) => (
          <Card key={banner.id} data-testid="banner-card">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={banner.image_url} 
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/300/200';
                    }}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold truncate">{banner.title}</h4>
                    <Badge className={banner.is_active ? 'bg-green-500' : 'bg-gray-500'}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  {banner.subtitle && (
                    <p className="text-sm text-gray-600 truncate">{banner.subtitle}</p>
                  )}
                  
                  {banner.festival_name && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {banner.festival_name}
                    </Badge>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    data-testid="edit-banner-button"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => deleteBanner(banner.id)}
                    data-testid="delete-banner-button"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Notification Manager Component
const NotificationManager = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    notification_type: 'general',
    target_audience: 'all',
    is_push_notification: true,
    is_in_app_notification: true,
    priority: 'normal'
  });

  const createNotification = async () => {
    try {
      setLoading(true);
      
      // Create notification
      const createResponse = await axios.post(`${API}/notifications/enhanced`, formData, {
        headers: getAuthHeaders()
      });
      
      // Broadcast notification immediately
      await axios.post(`${API}/notifications/${createResponse.data.id}/broadcast`, {}, {
        headers: getAuthHeaders()
      });
      
      toast.success('Notification created and broadcasted successfully');
      setShowCreateDialog(false);
      setFormData({
        title: '',
        message: '',
        notification_type: 'general',
        target_audience: 'all',
        is_push_notification: true,
        is_in_app_notification: true,
        priority: 'normal'
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notification System</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="create-notification-button">
              <Megaphone className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create & Send Notification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Notification title"
                  data-testid="notification-title-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Message *</label>
                <Textarea 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Notification message"
                  rows={3}
                  data-testid="notification-message-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <Select 
                    value={formData.notification_type}
                    onValueChange={(value) => setFormData({...formData, notification_type: value})}
                  >
                    <SelectTrigger data-testid="notification-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="festival">Festival</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Target Audience</label>
                  <Select 
                    value={formData.target_audience}
                    onValueChange={(value) => setFormData({...formData, target_audience: value})}
                  >
                    <SelectTrigger data-testid="notification-audience-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="users">Customers Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <Select 
                  value={formData.priority}
                  onValueChange={(value) => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger data-testid="notification-priority-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-4">
                <Button onClick={createNotification} disabled={loading} data-testid="send-notification-button">
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Sending...' : 'Create & Send'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-lg">Notification Broadcasting</h4>
              <p className="text-gray-600">Send instant notifications to all users about offers, festivals, and important updates.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="font-semibold text-orange-600">In-App</div>
                <div className="text-sm text-gray-500">Real-time alerts</div>
              </div>
              <div>
                <div className="font-semibold text-orange-600">Push</div>
                <div className="text-sm text-gray-500">Browser notifications</div>
              </div>
              <div>
                <div className="font-semibold text-orange-600">Targeted</div>
                <div className="text-sm text-gray-500">Audience selection</div>
              </div>
              <div>
                <div className="font-semibold text-orange-600">Instant</div>
                <div className="text-sm text-gray-500">Immediate delivery</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// System Status Component
const SystemStatus = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/system/enhanced/status`);
      setSystemStatus(response.data);
    } catch (error) {
      console.error('Error fetching system status:', error);
      toast.error('Failed to fetch system status');
    } finally {
      setLoading(false);
    }
  };

  const initializeEnhancedSystems = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/init-enhanced-systems`, {}, {
        headers: getAuthHeaders()
      });
      toast.success('Enhanced systems initialized successfully');
      fetchSystemStatus();
    } catch (error) {
      console.error('Error initializing systems:', error);
      toast.error('Failed to initialize enhanced systems');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !systemStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">System Status</h3>
        <div className="flex space-x-2">
          <Button onClick={initializeEnhancedSystems} disabled={loading} variant="outline" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Initialize Enhanced Systems
          </Button>
          <Button onClick={fetchSystemStatus} disabled={loading} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {systemStatus && (
        <>
          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  systemStatus.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                System Status: {systemStatus.status}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Last Updated: {new Date(systemStatus.timestamp).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Service Status */}
          <Card>
            <CardHeader>
              <CardTitle>Service Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(systemStatus.services || {}).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium capitalize">{service.replace('_', ' ')}</div>
                    </div>
                    <Badge className={{
                      'healthy': 'bg-green-500',
                      'available': 'bg-green-500',
                      'fallback_mode': 'bg-yellow-500',
                      'unavailable': 'bg-red-500'
                    }[status] || 'bg-gray-500'}>
                      {status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feature Status */}
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(systemStatus.features || []).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// Main Enhanced Admin Panel Component
export const EnhancedAdminPanel = () => {
  const [selectedTab, setSelectedTab] = useState('themes');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mithaas Delights</h1>
                <p className="text-sm text-gray-500">Enhanced Admin Dashboard</p>
              </div>
            </div>
            <Badge className="bg-green-500">
              <Zap className="w-3 h-3 mr-1" />
              Enhanced Mode
            </Badge>
          </div>
        </div>
      </div>

      {/* Enhanced Admin Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="themes" data-testid="themes-tab">
              <Palette className="w-4 h-4 mr-2" />
              Themes
            </TabsTrigger>
            <TabsTrigger value="banners" data-testid="banners-tab">
              <Image className="w-4 h-4 mr-2" />
              Banners
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="notifications-tab">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="system" data-testid="system-tab">
              <Settings className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="themes" className="mt-8">
            <ThemeManager />
          </TabsContent>

          <TabsContent value="banners" className="mt-8">
            <BannerManager />
          </TabsContent>

          <TabsContent value="notifications" className="mt-8">
            <NotificationManager />
          </TabsContent>

          <TabsContent value="system" className="mt-8">
            <SystemStatus />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedAdminPanel;
