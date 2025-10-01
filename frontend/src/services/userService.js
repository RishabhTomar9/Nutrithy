import axiosInstance from '../utils/axiosInstance';

/**
 * Fetch the current user's profile
 * @returns {Promise<Object>} User profile data
 */
export const getCurrentUserProfile = async () => {
  const response = await axiosInstance.get('/api/users/me');
  return response.data;
};

/**
 * Fetch a specific user's profile by ID
 * @param {string} userId - The ID of the user to fetch
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const response = await axiosInstance.get(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update the current user's profile
 * @param {Object} profileData - The profile data to update
 * @returns {Promise<Object>} Updated user profile
 */
export const updateUserProfile = async (profileData) => {
  const response = await axiosInstance.put('/api/users/profile', profileData);
  return response.data;
};

/**
 * Follow a user
 * @param {string} userId - The ID of the user to follow
 * @returns {Promise<Object>} Updated follow status
 */
export const followUser = async (userId) => {
  const response = await axiosInstance.post(`/api/users/${userId}/follow`);
  return response.data;
};

/**
 * Unfollow a user
 * @param {string} userId - The ID of the user to unfollow
 * @returns {Promise<Object>} Updated follow status
 */
export const unfollowUser = async (userId) => {
  const response = await axiosInstance.post(`/api/users/${userId}/unfollow`);
  return response.data;
};

/**
 * Get user's followers
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} List of followers
 */
export const getUserFollowers = async (userId) => {
  const response = await axiosInstance.get(`/api/users/${userId}/followers`);
  return response.data;
};

/**
 * Get users that a user is following
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} List of users being followed
 */
export const getUserFollowing = async (userId) => {
  const response = await axiosInstance.get(`/api/users/${userId}/following`);
  return response.data;
};