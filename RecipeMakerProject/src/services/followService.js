import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';

class FollowService {
  constructor() {
    this.followers = new Map();
    this.following = new Map();
    this.listeners = new Set();
  }

  // Add listener for real-time updates
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of changes
  notifyListeners(type, data) {
    this.listeners.forEach(callback => callback(type, data));
  }

  // Follow a user
  async followUser(userId, userData = {}) {
    try {
      const response = await axiosInstance.post(`/api/users/${userId}/follow`, {
        notifyUser: true,
        userData
      });

      if (response.data.success) {
        // Update local state
        if (!this.following.has(userId)) {
          this.following.set(userId, {
            userId,
            followedAt: new Date(),
            userData
          });
        }

        // Notify listeners
        this.notifyListeners('follow', { userId, userData });

        toast.success(`You are now following ${userData.name || 'this user'}! 🎉`);
        
        return {
          success: true,
          isFollowing: true,
          followerCount: response.data.followerCount || 0
        };
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user. Please try again.');
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to follow user'
      };
    }
  }

  // Unfollow a user
  async unfollowUser(userId, userData = {}) {
    try {
      const response = await axiosInstance.delete(`/api/users/${userId}/follow`);

      if (response.data.success) {
        // Update local state
        this.following.delete(userId);

        // Notify listeners
        this.notifyListeners('unfollow', { userId, userData });

        toast.success(`Unfollowed ${userData.name || 'user'}`);
        
        return {
          success: true,
          isFollowing: false,
          followerCount: response.data.followerCount || 0
        };
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user. Please try again.');
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to unfollow user'
      };
    }
  }

  // Get user's followers
  async getFollowers(userId, page = 1, limit = 20) {
    try {
      const response = await axiosInstance.get(`/api/users/${userId}/followers`, {
        params: { page, limit }
      });

      const followers = response.data.followers || [];
      
      // Update local cache
      followers.forEach(follower => {
        this.followers.set(follower.userId, follower);
      });

      return {
        success: true,
        followers,
        total: response.data.total || 0,
        page,
        totalPages: response.data.totalPages || 1
      };
    } catch (error) {
      console.error('Error fetching followers:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load followers',
        followers: [],
        total: 0
      };
    }
  }

  // Get user's following
  async getFollowing(userId, page = 1, limit = 20) {
    try {
      const response = await axiosInstance.get(`/api/users/${userId}/following`, {
        params: { page, limit }
      });

      const following = response.data.following || [];
      
      // Update local cache
      following.forEach(user => {
        this.following.set(user.userId, user);
      });

      return {
        success: true,
        following,
        total: response.data.total || 0,
        page,
        totalPages: response.data.totalPages || 1
      };
    } catch (error) {
      console.error('Error fetching following:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load following',
        following: [],
        total: 0
      };
    }
  }

  // Check if current user is following another user
  async checkFollowStatus(userId) {
    try {
      const response = await axiosInstance.get(`/api/users/${userId}/follow-status`);
      
      const isFollowing = response.data.isFollowing || false;
      const followerCount = response.data.followerCount || 0;
      const followingCount = response.data.followingCount || 0;

      return {
        success: true,
        isFollowing,
        followerCount,
        followingCount
      };
    } catch (error) {
      console.error('Error checking follow status:', error);
      return {
        success: false,
        isFollowing: false,
        followerCount: 0,
        followingCount: 0
      };
    }
  }

  // Get recommended users to follow
  async getRecommendedUsers(limit = 10) {
    try {
      const response = await axiosInstance.get('/api/users/recommended', {
        params: { limit }
      });

      return {
        success: true,
        users: response.data.users || [],
        reasons: response.data.reasons || {}
      };
    } catch (error) {
      console.error('Error fetching recommended users:', error);
      return {
        success: false,
        users: [],
        reasons: {}
      };
    }
  }

  // Get follow activity for feed
  async getFollowActivity(page = 1, limit = 20) {
    try {
      const response = await axiosInstance.get('/api/users/follow-activity', {
        params: { page, limit }
      });

      return {
        success: true,
        activities: response.data.activities || [],
        total: response.data.total || 0,
        page,
        totalPages: response.data.totalPages || 1
      };
    } catch (error) {
      console.error('Error fetching follow activity:', error);
      return {
        success: false,
        activities: [],
        total: 0
      };
    }
  }

  // Bulk follow/unfollow operations
  async bulkFollow(userIds, action = 'follow') {
    try {
      const response = await axiosInstance.post('/api/users/bulk-follow', {
        userIds,
        action
      });

      const results = response.data.results || [];
      let successCount = 0;
      let failureCount = 0;

      results.forEach(result => {
        if (result.success) {
          successCount++;
          if (action === 'follow') {
            this.following.set(result.userId, result.data);
          } else {
            this.following.delete(result.userId);
          }
        } else {
          failureCount++;
        }
      });

      const actionText = action === 'follow' ? 'followed' : 'unfollowed';
      
      if (successCount > 0 && failureCount === 0) {
        toast.success(`Successfully ${actionText} ${successCount} users! 🎉`);
      } else if (successCount > 0 && failureCount > 0) {
        toast.success(`${actionText} ${successCount} users. ${failureCount} failed.`);
      } else {
        toast.error(`Failed to ${action} users. Please try again.`);
      }

      // Notify listeners
      this.notifyListeners('bulk-follow', { action, results });

      return {
        success: true,
        results,
        successCount,
        failureCount
      };
    } catch (error) {
      console.error('Error in bulk follow operation:', error);
      toast.error(`Failed to ${action} users. Please try again.`);
      
      return {
        success: false,
        error: error.response?.data?.message || 'Bulk follow operation failed'
      };
    }
  }

  // Clear local cache
  clearCache() {
    this.followers.clear();
    this.following.clear();
  }

  // Get cached following status
  getCachedFollowingStatus(userId) {
    return this.following.has(userId);
  }

  // Get cached follower data
  getCachedFollowerData(userId) {
    return this.followers.get(userId);
  }
}

// Create singleton instance
const followService = new FollowService();

// Export both the service and individual methods for easier usage
export default followService;

export const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
  getRecommendedUsers,
  getFollowActivity,
  bulkFollow,
  addListener,
  clearCache,
  getCachedFollowingStatus,
  getCachedFollowerData
} = followService;
