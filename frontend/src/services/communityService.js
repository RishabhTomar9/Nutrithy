import axiosInstance from '../utils/axiosInstance';

const API_URL = '/api/community';

export const fetchPosts = async (page = 1, limit = 10, filter = 'all') => {
  try {
    const response = await axiosInstance.get(`${API_URL}?page=${page}&limit=${limit}&filter=${filter}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

export const fetchPostById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
};

export const createPost = async (postData) => {
  try {
    const response = await axiosInstance.post(API_URL, postData);
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const updatePost = async (id, postData) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/${id}`, postData);
    return response.data;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

export const deletePost = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

export const likePost = async (id) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/${id}/like`);
    return response.data;
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

export const addComment = async (id, content, parentId = null) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/${id}/comment`, { content, parentId });
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const fetchComments = async (postId, page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/${postId}/comments?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const fetchCommentReplies = async (commentId) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/comments/${commentId}/replies`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comment replies:', error);
    throw error;
  }
};

export const likeComment = async (commentId) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/comments/${commentId}/like`);
    return response.data;
  } catch (error) {
    console.error('Error liking comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

export const sharePost = async (id) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/${id}/share`);
    return response.data;
  } catch (error) {
    console.error('Error sharing post:', error);
    throw error;
  }
};

export const fetchUserPosts = async (uid, page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/user/${uid}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
};

export const searchPosts = async (query, page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error searching posts:', error);
    throw error;
  }
};