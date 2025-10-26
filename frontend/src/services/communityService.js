import axiosInstance from '../utils/axiosInstance';
import axios from 'axios';

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

const apiBaseRaw = import.meta.env.VITE_SOCKET_SERVER || '';
const apiBase = apiBaseRaw.replace(/\/+$/, ''); // strip trailing slash

export async function addComment(postId, content, parentId = null) {
  if (!postId) throw new Error('postId is required');
  if (!content || !content.trim()) throw new Error('content is required');

  const payload = {
    content: content.trim(),
    ...(parentId ? { parentId } : {})
  };

  // Backend route: POST /api/community/:id/comment
  try {
    // use axiosInstance so authentication, baseURL and interceptors are applied
    const res = await axiosInstance.post(`${API_URL}/${postId}/comment`, payload, {
      timeout: 10000
    });
    return res.data;
  } catch (err) {
    console.error(`addComment failed for post ${postId}:`, err?.response?.status, err?.response?.data || err.message);
    const status = err?.response?.status;
    const resp = err?.response?.data;
    const msg = resp?.error || resp?.message || err.message || 'Unknown error';
    const error = new Error(`Add comment failed: ${msg} (status: ${status || 'no-status'})`);
    error._raw = err;
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