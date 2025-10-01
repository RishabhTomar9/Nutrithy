import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';

class NotificationService {
  constructor() {
    this.notifications = new Map();
    this.listeners = new Set();
    this.unreadCount = 0;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.wsConnection = null;
  }

  // Initialize WebSocket connection for real-time notifications
  async initializeRealTime(userId, token) {
    try {
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        return; // Already connected
      }

      const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8080'}/notifications?userId=${userId}&token=${token}`;
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log('✅ Notification WebSocket connected');
        this.isConnected = true;
        this.retryCount = 0;
        this.notifyListeners('connection', { status: 'connected' });
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          this.handleRealTimeNotification(notification);
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      this.wsConnection.onerror = (error) => {
        console.error('Notification WebSocket error:', error);
        this.isConnected = false;
      };

      this.wsConnection.onclose = (event) => {
        console.log('Notification WebSocket closed:', event.code, event.reason);
        this.isConnected = false;
        this.notifyListeners('connection', { status: 'disconnected' });

        // Auto-reconnect with backoff
        if (!event.wasClean && this.retryCount < this.maxRetries) {
          const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
          setTimeout(() => {
            this.retryCount++;
            this.initializeRealTime(userId, token);
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error initializing real-time notifications:', error);
    }
  }

  // Handle real-time notification
  handleRealTimeNotification(notification) {
    // Add to local storage
    this.notifications.set(notification.id, {
      ...notification,
      receivedAt: new Date(),
      isNew: true
    });

    // Update unread count
    if (!notification.isRead) {
      this.unreadCount++;
    }

    // Show toast notification
    this.showToastNotification(notification);

    // Notify listeners
    this.notifyListeners('notification', notification);
  }

  // Show toast notification based on type
  showToastNotification(notification) {
    const { type, title, message, data } = notification;

    const toastOptions = {
      duration: type === 'urgent' ? 6000 : 4000,
      position: 'top-right',
      style: {
        background: '#1F2937',
        color: '#F3F4F6',
        border: '1px solid #374151',
        borderRadius: '12px',
      }
    };

    switch (type) {
      case 'follow':
        toast.success(`${data?.userName || 'Someone'} started following you! 👥`, toastOptions);
        break;
      case 'like':
        toast.success(`${data?.userName || 'Someone'} liked your ${data?.contentType || 'post'}! ❤️`, toastOptions);
        break;
      case 'comment':
        toast.success(`${data?.userName || 'Someone'} commented on your ${data?.contentType || 'post'}! 💬`, toastOptions);
        break;
      case 'recipe_shared':
        toast.success(`${data?.userName || 'Someone'} shared your recipe! 🍽️`, toastOptions);
        break;
      case 'mention':
        toast.success(`${data?.userName || 'Someone'} mentioned you in a post! @`, toastOptions);
        break;
      case 'achievement':
        toast.success(`🎉 Achievement unlocked: ${title}!`, {
          ...toastOptions,
          duration: 8000,
          style: {
            ...toastOptions.style,
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF',
            border: 'none'
          }
        });
        break;
      case 'system':
        if (notification.priority === 'high') {
          toast.error(message, toastOptions);
        } else {
          toast(message, toastOptions);
        }
        break;
      default:
        toast(title || message, toastOptions);
    }
  }

  // Add listener for notification updates
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(type, data) {
    this.listeners.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Get all notifications
  async getNotifications(page = 1, limit = 20, filters = {}) {
    try {
      const response = await axiosInstance.get('/api/notifications', {
        params: {
          page,
          limit,
          ...filters
        }
      });

      const notifications = response.data.notifications || [];
      
      // Update local cache
      notifications.forEach(notification => {
        this.notifications.set(notification.id, {
          ...notification,
          isNew: false
        });
      });

      this.unreadCount = response.data.unreadCount || 0;

      return {
        success: true,
        notifications,
        total: response.data.total || 0,
        unreadCount: this.unreadCount,
        page,
        totalPages: response.data.totalPages || 1
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load notifications',
        notifications: [],
        total: 0,
        unreadCount: 0
      };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      await axiosInstance.patch(`/api/notifications/${notificationId}/read`);

      // Update local cache
      const notification = this.notifications.get(notificationId);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.notifyListeners('read', { notificationId, unreadCount: this.unreadCount });
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to mark as read'
      };
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      await axiosInstance.patch('/api/notifications/read-all');

      // Update local cache
      this.notifications.forEach(notification => {
        notification.isRead = true;
      });

      this.unreadCount = 0;
      this.notifyListeners('read-all', { unreadCount: 0 });

      toast.success('All notifications marked as read! ✅');
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to mark all as read'
      };
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      await axiosInstance.delete(`/api/notifications/${notificationId}`);

      // Update local cache
      const notification = this.notifications.get(notificationId);
      if (notification && !notification.isRead) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      
      this.notifications.delete(notificationId);
      this.notifyListeners('delete', { notificationId, unreadCount: this.unreadCount });

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete notification'
      };
    }
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    try {
      await axiosInstance.patch('/api/notifications/preferences', preferences);

      toast.success('Notification preferences updated! ⚙️');
      this.notifyListeners('preferences', preferences);

      return { success: true };
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update preferences');
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update preferences'
      };
    }
  }

  // Get notification preferences
  async getPreferences() {
    try {
      const response = await axiosInstance.get('/api/notifications/preferences');
      return {
        success: true,
        preferences: response.data.preferences || {}
      };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load preferences',
        preferences: {}
      };
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      await axiosInstance.delete('/api/notifications/clear-all');

      // Clear local cache
      this.notifications.clear();
      this.unreadCount = 0;
      this.notifyListeners('clear-all', { unreadCount: 0 });

      toast.success('All notifications cleared! 🧹');
      return { success: true };
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      toast.error('Failed to clear notifications');
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to clear notifications'
      };
    }
  }

  // Get notification statistics
  async getStatistics() {
    try {
      const response = await axiosInstance.get('/api/notifications/statistics');
      return {
        success: true,
        statistics: response.data.statistics || {}
      };
    } catch (error) {
      console.error('Error fetching notification statistics:', error);
      return {
        success: false,
        statistics: {}
      };
    }
  }

  // Request permission for browser notifications
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Show browser notification
  showBrowserNotification(notification) {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: notification.icon || '/favicon.ico',
        tag: notification.id,
        data: notification.data
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        
        // Handle notification click action
        if (notification.action && notification.action.url) {
          window.location.href = notification.action.url;
        }
      };

      // Auto-close after 5 seconds
      setTimeout(() => browserNotification.close(), 5000);
    }
  }

  // Get unread count
  getUnreadCount() {
    return this.unreadCount;
  }

  // Check connection status
  isConnectionOpen() {
    return this.isConnected && this.wsConnection?.readyState === WebSocket.OPEN;
  }

  // Close WebSocket connection
  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.isConnected = false;
  }

  // Clear local cache
  clearCache() {
    this.notifications.clear();
    this.unreadCount = 0;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Export both the service and individual methods
export default notificationService;

export const {
  initializeRealTime,
  addListener,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updatePreferences,
  getPreferences,
  clearAllNotifications,
  getStatistics,
  requestPermission,
  getUnreadCount,
  isConnectionOpen,
  disconnect,
  clearCache
} = notificationService;
