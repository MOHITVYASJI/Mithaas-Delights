import React, { useState, useEffect, useContext, createContext } from 'react';
import axios from 'axios';
import { Bell, X, Check, AlertCircle, Gift, Calendar, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Notification Context
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Get auth token
  const getAuthToken = () => localStorage.getItem('token');
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${getAuthToken()}`
  });

  const fetchNotifications = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await axios.get(`${API}/notifications/my-notifications`, {
        headers: getAuthHeaders()
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await axios.get(`${API}/notifications/unread-count`, {
        headers: getAuthHeaders()
      });
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      await axios.put(`${API}/notifications/${notificationId}/read`, {}, {
        headers: getAuthHeaders()
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => {
          if (notification.id === notificationId) {
            return {
              ...notification,
              user_status: {
                ...notification.user_status,
                status: 'read',
                read_at: new Date().toISOString()
              }
            };
          }
          return notification;
        })
      );
      
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(
        n => n.user_status?.status !== 'read'
      );
      
      await Promise.all(
        unreadNotifications.map(n => markAsRead(n.id))
      );
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  // Initialize notifications on mount
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  // Polling for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Notification Bell Component
export const NotificationBell = () => {
  const { unreadCount, notifications, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'offer':
        return <Gift className="w-4 h-4 text-green-500" />;
      case 'festival':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'system':
        return <Zap className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
  };

  const getNotificationBadgeColor = (type) => {
    switch (type) {
      case 'offer':
        return 'bg-green-100 text-green-700';
      case 'festival':
        return 'bg-purple-100 text-purple-700';
      case 'system':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-orange-100 text-orange-700';
    }
  };

  const handleNotificationClick = async (notification) => {
    if (notification.user_status?.status !== 'read') {
      await markAsRead(notification.id);
    }
    
    // Handle action URL if present
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  return (
    <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          data-testid="notification-bell-button"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-xs p-0 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge className="bg-red-500">{unreadCount}</Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={markAllAsRead}
                data-testid="mark-all-read-button"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark All Read
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const isUnread = notification.user_status?.status !== 'read';
                
                return (
                  <Card 
                    key={notification.id}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      isUnread ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid="notification-item"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.notification_type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className={`text-sm font-medium truncate ${
                              isUnread ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {isUnread && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-1"></div>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getNotificationBadgeColor(notification.notification_type)}`}
                            >
                              {notification.notification_type}
                            </Badge>
                            
                            <span className="text-xs text-gray-500">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {notification.action_text && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                            >
                              {notification.action_text}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        <div className="mt-4 pt-4 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full"
            onClick={() => {
              fetchNotifications();
              toast.success('Notifications refreshed');
            }}
            data-testid="refresh-notifications-button"
          >
            <Bell className="w-4 h-4 mr-2" />
            Refresh Notifications
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// In-app notification toast component
export const NotificationToast = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg border border-orange-200 bg-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {notification.notification_type === 'offer' && <Gift className="w-5 h-5 text-green-500" />}
              {notification.notification_type === 'festival' && <Calendar className="w-5 h-5 text-purple-500" />}
              {notification.notification_type === 'system' && <Zap className="w-5 h-5 text-blue-500" />}
              {!['offer', 'festival', 'system'].includes(notification.notification_type) && 
                <AlertCircle className="w-5 h-5 text-orange-500" />}
            </div>
            
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              
              {notification.action_text && notification.action_url && (
                <Button 
                  size="sm" 
                  className="mt-2 bg-orange-500 hover:bg-orange-600"
                  onClick={() => {
                    window.location.href = notification.action_url;
                    onClose?.();
                  }}
                >
                  {notification.action_text}
                </Button>
              )}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default {
  NotificationProvider,
  NotificationBell,
  NotificationToast,
  useNotifications
};
