import axiosInstance from '../utils/axiosInstance';

/**
 * Activity Service for fetching real activity data from backend
 */
class ActivityService {
  // Activity endpoints
  static ENDPOINTS = {
    ACTIVITIES: '/api/activities',
    USER_ACTIVITIES: '/api/activities/user',
    ACTIVITY_STATS: '/api/activities/stats',
    ACTIVITY_SUMMARY: '/api/activities/summary',
    ACTIVITY_TIMELINE: '/api/activities/timeline',
    RECENT_ACTIVITIES: '/api/activities/recent',
  };

  /**
   * Get user's activity statistics
   * @param {string} userId - User ID (optional, defaults to current user)
   * @param {string} period - Time period ('week', 'month', 'year', 'all')
   * @returns {Promise<Object>} Activity statistics
   */
  static async getActivityStats(userId = null, period = 'month') {
    try {
      const url = userId 
        ? `${this.ENDPOINTS.ACTIVITY_STATS}/${userId}` 
        : this.ENDPOINTS.ACTIVITY_STATS;
      
      const response = await axiosInstance.get(url, {
        params: { period }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user's activity timeline
   * @param {Object} options - Query options
   * @param {string} options.userId - User ID (optional)
   * @param {string} options.type - Activity type filter
   * @param {number} options.limit - Number of activities to fetch
   * @param {number} options.offset - Offset for pagination
   * @param {string} options.startDate - Start date filter
   * @param {string} options.endDate - End date filter
   * @returns {Promise<Array>} Activity timeline
   */
  static async getActivityTimeline(options = {}) {
    try {
      const {
        userId,
        type = 'all',
        limit = 20,
        offset = 0,
        startDate,
        endDate
      } = options;

      const url = userId 
        ? `${this.ENDPOINTS.ACTIVITY_TIMELINE}/${userId}`
        : this.ENDPOINTS.ACTIVITY_TIMELINE;

      const params = {
        type,
        limit,
        offset,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      };

      const response = await axiosInstance.get(url, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity timeline:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get recent activities for current user
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise<Array>} Recent activities
   */
  static async getRecentActivities(limit = 10) {
    try {
      const response = await axiosInstance.get(this.ENDPOINTS.RECENT_ACTIVITIES, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get activity summary for dashboard
   * @param {string} period - Time period ('today', 'week', 'month')
   * @returns {Promise<Object>} Activity summary
   */
  static async getActivitySummary(period = 'month') {
    try {
      const response = await axiosInstance.get(this.ENDPOINTS.ACTIVITY_SUMMARY, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new activity record
   * @param {Object} activityData - Activity data
   * @param {string} activityData.type - Activity type
   * @param {string} activityData.title - Activity title
   * @param {string} activityData.description - Activity description
   * @param {Object} activityData.metadata - Additional metadata
   * @returns {Promise<Object>} Created activity
   */
  static async createActivity(activityData) {
    try {
      const response = await axiosInstance.post(this.ENDPOINTS.ACTIVITIES, {
        ...activityData,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update activity engagement (likes, comments, shares)
   * @param {string} activityId - Activity ID
   * @param {string} action - Action type ('like', 'comment', 'share')
   * @param {Object} data - Additional data for the action
   * @returns {Promise<Object>} Updated activity
   */
  static async updateActivityEngagement(activityId, action, data = {}) {
    try {
      const response = await axiosInstance.post(
        `${this.ENDPOINTS.ACTIVITIES}/${activityId}/engagement`,
        { action, ...data }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating activity engagement:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user achievements and badges
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Array>} User achievements
   */
  static async getUserAchievements(userId = null) {
    try {
      const url = userId 
        ? `/api/users/${userId}/achievements`
        : '/api/users/me/achievements';
      
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get activity leaderboard
   * @param {string} type - Leaderboard type ('weekly', 'monthly', 'alltime')
   * @param {number} limit - Number of entries
   * @returns {Promise<Array>} Leaderboard data
   */
  static async getActivityLeaderboard(type = 'monthly', limit = 10) {
    try {
      const response = await axiosInstance.get('/api/activities/leaderboard', {
        params: { type, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity leaderboard:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Refresh activity data from external sources
   * @returns {Promise<Object>} Refresh status
   */
  static async refreshActivityData() {
    try {
      const response = await axiosInstance.post('/api/activities/refresh');
      return response.data;
    } catch (error) {
      console.error('Error refreshing activity data:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - The error object
   * @returns {Object} Formatted error
   */
  static handleError(error) {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const status = error.response?.status || 500;
    
    return {
      message,
      status,
      code: error.code,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Format activity data for consistent display
   * @param {Object} activity - Raw activity data
   * @returns {Object} Formatted activity
   */
  static formatActivity(activity) {
    return {
      id: activity._id || activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      content: activity.content,
      image: activity.image,
      stats: {
        likes: activity.engagement?.likes || 0,
        comments: activity.engagement?.comments || 0,
        shares: activity.engagement?.shares || 0
      },
      user: activity.user ? {
        id: activity.user._id || activity.user.id,
        name: activity.user.displayName || activity.user.name,
        avatar: activity.user.photoURL || activity.user.avatar
      } : null,
      timestamp: activity.createdAt || activity.timestamp,
      timeAgo: this.getTimeAgo(activity.createdAt || activity.timestamp),
      metadata: activity.metadata || {}
    };
  }

  /**
   * Get human-readable time ago string
   * @param {string|Date} timestamp - Timestamp
   * @returns {string} Time ago string
   */
  static getTimeAgo(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }
}

export default ActivityService;
