import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';

class ModerationService {
  constructor() {
    this.reports = new Map();
    this.blockedUsers = new Set();
    this.contentFilters = new Map();
    this.listeners = new Set();
    this.autoModerationCache = new Map();
  }

  // Add listener for moderation updates
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  notifyListeners(type, data) {
    this.listeners.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('Error in moderation listener:', error);
      }
    });
  }

  // Report content (post, comment, user, etc.)
  async reportContent(contentId, contentType, reason, details = {}) {
    try {
      const reportData = {
        contentId,
        contentType, // 'post', 'comment', 'user', 'recipe'
        reason, // 'spam', 'harassment', 'inappropriate', 'copyright', 'other'
        details,
        timestamp: new Date().toISOString(),
        additionalInfo: details.additionalInfo || ''
      };

      const response = await axiosInstance.post('/api/moderation/report', reportData);

      if (response.data.success) {
        // Update local cache
        this.reports.set(response.data.reportId, {
          ...reportData,
          reportId: response.data.reportId,
          status: 'pending'
        });

        // Show success message
        const contentTypes = {
          post: 'post',
          comment: 'comment',
          user: 'user',
          recipe: 'recipe'
        };

        toast.success(`${contentTypes[contentType] || 'Content'} reported successfully. Thank you for helping keep our community safe! 🛡️`);

        // Notify listeners
        this.notifyListeners('report', {
          reportId: response.data.reportId,
          contentId,
          contentType,
          reason
        });

        return {
          success: true,
          reportId: response.data.reportId,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('Error reporting content:', error);
      toast.error('Failed to submit report. Please try again.');
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to submit report'
      };
    }
  }

  // Block/unblock user
  async blockUser(userId, userData = {}, action = 'block') {
    try {
      const response = await axiosInstance.post(`/api/moderation/users/${userId}/${action}`, {
        userData,
        reason: userData.reason || 'user_request'
      });

      if (response.data.success) {
        if (action === 'block') {
          this.blockedUsers.add(userId);
          toast.success(`User blocked. You won't see their content anymore. 🚫`);
        } else {
          this.blockedUsers.delete(userId);
          toast.success(`User unblocked. 👋`);
        }

        // Notify listeners
        this.notifyListeners(action, { userId, userData });

        return {
          success: true,
          isBlocked: action === 'block'
        };
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast.error(`Failed to ${action} user. Please try again.`);
      
      return {
        success: false,
        error: error.response?.data?.message || `Failed to ${action} user`
      };
    }
  }

  // Get blocked users list
  async getBlockedUsers(page = 1, limit = 20) {
    try {
      const response = await axiosInstance.get('/api/moderation/blocked-users', {
        params: { page, limit }
      });

      const blockedUsers = response.data.users || [];
      
      // Update local cache
      blockedUsers.forEach(user => {
        this.blockedUsers.add(user.userId);
      });

      return {
        success: true,
        users: blockedUsers,
        total: response.data.total || 0,
        page,
        totalPages: response.data.totalPages || 1
      };
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load blocked users',
        users: [],
        total: 0
      };
    }
  }

  // Auto-moderate content using AI/ML
  async autoModerateContent(content, contentType = 'text') {
    try {
      // Check cache first
      const cacheKey = `${contentType}_${this.hashContent(content)}`;
      if (this.autoModerationCache.has(cacheKey)) {
        return this.autoModerationCache.get(cacheKey);
      }

      const response = await axiosInstance.post('/api/moderation/auto-moderate', {
        content,
        contentType
      });

      const result = {
        success: true,
        isAllowed: response.data.isAllowed !== false,
        confidence: response.data.confidence || 0,
        flags: response.data.flags || [],
        suggestions: response.data.suggestions || [],
        filteredContent: response.data.filteredContent || content
      };

      // Cache result for 5 minutes
      this.autoModerationCache.set(cacheKey, result);
      setTimeout(() => {
        this.autoModerationCache.delete(cacheKey);
      }, 5 * 60 * 1000);

      return result;
    } catch (error) {
      console.error('Error in auto-moderation:', error);
      
      // Default to allowing content if moderation fails
      return {
        success: false,
        isAllowed: true,
        confidence: 0,
        flags: [],
        suggestions: [],
        filteredContent: content,
        error: error.response?.data?.message || 'Moderation service unavailable'
      };
    }
  }

  // Generate hash for content caching
  hashContent(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  // Get community guidelines
  async getCommunityGuidelines() {
    try {
      const response = await axiosInstance.get('/api/moderation/guidelines');
      return {
        success: true,
        guidelines: response.data.guidelines || {}
      };
    } catch (error) {
      console.error('Error fetching community guidelines:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load guidelines',
        guidelines: {}
      };
    }
  }

  // Get moderation history for user
  async getModerationHistory(page = 1, limit = 20) {
    try {
      const response = await axiosInstance.get('/api/moderation/history', {
        params: { page, limit }
      });

      return {
        success: true,
        history: response.data.history || [],
        total: response.data.total || 0,
        page,
        totalPages: response.data.totalPages || 1
      };
    } catch (error) {
      console.error('Error fetching moderation history:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load history',
        history: [],
        total: 0
      };
    }
  }

  // Appeal a moderation decision
  async appealDecision(reportId, appealReason, evidence = {}) {
    try {
      const response = await axiosInstance.post(`/api/moderation/appeals/${reportId}`, {
        appealReason,
        evidence,
        timestamp: new Date().toISOString()
      });

      if (response.data.success) {
        toast.success('Appeal submitted successfully. Our team will review it within 24-48 hours. ⚖️');
        
        // Notify listeners
        this.notifyListeners('appeal', {
          reportId,
          appealReason,
          appealId: response.data.appealId
        });

        return {
          success: true,
          appealId: response.data.appealId,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('Error submitting appeal:', error);
      toast.error('Failed to submit appeal. Please try again.');
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to submit appeal'
      };
    }
  }

  // Get content filters
  async getContentFilters() {
    try {
      const response = await axiosInstance.get('/api/moderation/filters');
      
      const filters = response.data.filters || {};
      
      // Update local cache
      Object.entries(filters).forEach(([key, value]) => {
        this.contentFilters.set(key, value);
      });

      return {
        success: true,
        filters
      };
    } catch (error) {
      console.error('Error fetching content filters:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load filters',
        filters: {}
      };
    }
  }

  // Update content filters (user preferences)
  async updateContentFilters(filters) {
    try {
      const response = await axiosInstance.patch('/api/moderation/filters', { filters });

      if (response.data.success) {
        // Update local cache
        Object.entries(filters).forEach(([key, value]) => {
          this.contentFilters.set(key, value);
        });

        toast.success('Content filter preferences updated! 🔧');
        
        // Notify listeners
        this.notifyListeners('filters-updated', filters);

        return { success: true };
      }
    } catch (error) {
      console.error('Error updating content filters:', error);
      toast.error('Failed to update filters. Please try again.');
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update filters'
      };
    }
  }

  // Check if user is blocked
  isUserBlocked(userId) {
    return this.blockedUsers.has(userId);
  }

  // Apply content filters to text
  applyContentFilters(content, filterType = 'default') {
    try {
      const filters = this.contentFilters.get(filterType);
      if (!filters || !filters.enabled) {
        return content;
      }

      let filteredContent = content;

      // Apply profanity filter
      if (filters.profanity) {
        filteredContent = this.filterProfanity(filteredContent);
      }

      // Apply spam detection
      if (filters.spam) {
        const spamScore = this.detectSpam(filteredContent);
        if (spamScore > filters.spamThreshold || 0.7) {
          return '[Content filtered - potential spam]';
        }
      }

      // Apply personal info filter
      if (filters.personalInfo) {
        filteredContent = this.filterPersonalInfo(filteredContent);
      }

      return filteredContent;
    } catch (error) {
      console.error('Error applying content filters:', error);
      return content; // Return original content if filtering fails
    }
  }

  // Basic profanity filter
  filterProfanity(content) {
    // This is a simple implementation - in production, use a more sophisticated service
    const profanityWords = ['spam', 'scam', 'fake', 'fraud']; // Add actual words
    let filtered = content;
    
    profanityWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    });
    
    return filtered;
  }

  // Basic spam detection
  detectSpam(content) {
    const spamIndicators = [
      /click here/gi,
      /buy now/gi,
      /limited time/gi,
      /urgent/gi,
      /act now/gi,
      /guarantee/gi,
      /free money/gi,
      /work from home/gi
    ];

    let score = 0;
    const words = content.split(/\s+/);
    
    // Check for spam patterns
    spamIndicators.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        score += matches.length * 0.2;
      }
    });

    // Check for excessive caps
    const capsWords = words.filter(word => word === word.toUpperCase() && word.length > 2);
    if (capsWords.length / words.length > 0.5) {
      score += 0.3;
    }

    // Check for excessive punctuation
    const punctuationCount = (content.match(/[!?]{2,}/g) || []).length;
    if (punctuationCount > 3) {
      score += 0.2;
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  // Filter personal information
  filterPersonalInfo(content) {
    // Email addresses
    content = content.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email filtered]');
    
    // Phone numbers (basic patterns)
    content = content.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone filtered]');
    
    // URLs
    content = content.replace(/https?:\/\/[^\s]+/g, '[link filtered]');
    
    return content;
  }

  // Get moderation statistics
  async getModerationStats() {
    try {
      const response = await axiosInstance.get('/api/moderation/statistics');
      return {
        success: true,
        stats: response.data.stats || {}
      };
    } catch (error) {
      console.error('Error fetching moderation statistics:', error);
      return {
        success: false,
        stats: {}
      };
    }
  }

  // Clear cache
  clearCache() {
    this.reports.clear();
    this.blockedUsers.clear();
    this.contentFilters.clear();
    this.autoModerationCache.clear();
  }
}

// Create singleton instance
const moderationService = new ModerationService();

// Export both the service and individual methods
export default moderationService;

export const {
  reportContent,
  blockUser,
  getBlockedUsers,
  autoModerateContent,
  getCommunityGuidelines,
  getModerationHistory,
  appealDecision,
  getContentFilters,
  updateContentFilters,
  isUserBlocked,
  applyContentFilters,
  getModerationStats,
  addListener,
  clearCache
} = moderationService;
