import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const signup = (data) => api.post('/api/auth/signup', data);
export const login = (data) => api.post('/api/auth/login', data);
export const getMe = () => api.get('/api/auth/me');

// Users
export const searchUsers = (q) => api.get('/api/users/search', { params: { q } });
export const getUser = (id) => api.get(`/api/users/${id}`);
export const toggleFollow = (id) => api.post(`/api/users/${id}/follow`);
export const getUserProfile = (id) => api.get(`/api/users/${id}/profile`);
export const updateMe = (data) => api.patch('/api/users/me', data);

// Stories
export const getStories = () => api.get('/api/stories');
export const getUserStories = (id) => api.get(`/api/stories/${id}`);
export const createStory = (data) => api.post('/api/stories', data);
export const viewStory = (id) => api.post(`/api/stories/${id}/view`);

// Posts
export const getFeed = () => api.get('/api/posts/feed');
export const createPost = (data) => api.post('/api/posts', data);
export const likePost = (id) => api.post(`/api/posts/${id}/like`);
export const commentOnPost = (id, text) => api.post(`/api/posts/${id}/comment`, { text });
export const sharePost = (id) => api.post(`/api/posts/${id}/share`);
export const deletePost = (id) => api.delete(`/api/posts/${id}`);

// Messages
export const getConversations = () => api.get('/api/messages');
export const getMessages = (otherId) => api.get(`/api/messages/${otherId}`);
export const sendMessage = (otherId, body) => api.post(`/api/messages/${otherId}`, body);
export const markMessagesRead = (otherId) => api.post(`/api/messages/${otherId}/read`);

// Admin
export const getAdminStats = () => api.get('/api/admin/stats');

export default api;