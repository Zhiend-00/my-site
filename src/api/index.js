// src/api/index.js
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE
})

function getToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Ошибка ${res.status}`);
  }
  return res.json();
}

export const authAPI = {
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/api/auth/profile'),
  verifyEmail: (token) => request(`/api/auth/verify-email?token=${token}`),
  forgotPassword: (email) => request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, password) => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  resendVerification: () => request('/api/auth/resend-verification', { method: 'POST' }),
};

export const mangaAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/manga${query ? `?${query}` : ''}`);
  },
  get: (id) => request(`/api/manga/${id}`),
  getChapters: (mangaId) => request(`/api/manga/${mangaId}/chapters`),
  rate: (mangaId, rating) => request(`/api/manga/${mangaId}/rate`, { method: 'POST', body: JSON.stringify({ rating }) }),
  getComments: (mangaId) => request(`/api/manga/${mangaId}/comments`),
  addComment: (mangaId, content) => request(`/api/manga/${mangaId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
};

export const chaptersAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/chapters${query ? `?${query}` : ''}`);
  },
  get: (id) => request(`/api/chapters/${id}`),
  getChapter: (id) => request(`/api/chapters/${id}`),
  getPages: (id) => request(`/api/chapters/${id}/pages`),
  create: (data) => request('/api/chapters', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/chapters/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/chapters/${id}`, { method: 'DELETE' }),
};

export const forumAPI = {
  getCategories: () => request('/api/forum_categories'),
  getTopics: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/forum_topics${query ? `?${query}` : ''}`);
  },
  getTopic: (id) => request(`/api/forum_topics/${id}`),
  createTopic: (data) => request('/api/forum_topics', { method: 'POST', body: JSON.stringify(data) }),
  createPost: (data) => request('/api/forum_posts', { method: 'POST', body: JSON.stringify(data) }),
  likePost: (postId) => request(`/api/forum_posts/${postId}/like`, { method: 'POST' }),
  unlikePost: (postId) => request(`/api/forum_posts/${postId}/like`, { method: 'DELETE' }),
  getRecentPosts: (limit = 5) => request(`/api/forum/posts/recent?limit=${limit}`),
  getPopularTopics: (limit = 5) => request(`/api/forum/topics/popular?limit=${limit}`),
};

export const userMangaStatusAPI = {
  set: (userId, mangaId, status) => request(`/api/user/${userId}/status`, {
    method: 'POST',
    body: JSON.stringify({ mangaId, status })
  }),
  get: (userId) => request(`/api/user/${userId}/status`),
};

export const progressAPI = {
  save: (data) => request('/api/progress', { method: 'POST', body: JSON.stringify(data) }),
  get: (mangaId) => request(`/api/progress/${mangaId}`),
  list: () => request('/api/progress'),
};

export const favoritesAPI = {
  list: () => request('/api/favorites'),
  toggle: (mangaId) => request('/api/favorites/toggle', { method: 'POST', body: JSON.stringify({ mangaId }) }),
};

export const feedbackAPI = {
  send: (data) => request('/api/feedback', { method: 'POST', body: JSON.stringify(data) }),
};

export const notificationsAPI = {
  getAll: () => request('/api/notifications'),
  markAsRead: (id) => request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
};

export const adminAPI = {
  getUsers: () => request('/api/admin/users'),
  updateUserRole: (id, role) => request(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  deleteUser: (id) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  syncAll: () => request('/api/admin/sync', { method: 'POST' }),
  syncPages: () => request('/api/admin/sync-pages', { method: 'POST' }),
  createManga: (data) => request('/api/manga', { method: 'POST', body: JSON.stringify(data) }),
  updateManga: (id, data) => request(`/api/manga/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteManga: (id) => request(`/api/manga/${id}`, { method: 'DELETE' }),
  getForumCategories: () => request('/api/admin/forum/categories'),
  createForumCategory: (data) => request('/api/admin/forum/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateForumCategory: (id, data) => request(`/api/admin/forum/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteForumCategory: (id) => request(`/api/admin/forum/categories/${id}`, { method: 'DELETE' }),
  getForumTopics: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/admin/forum/topics${query ? `?${query}` : ''}`);
  },
  updateForumTopic: (id, data) => request(`/api/admin/forum/topics/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteForumTopic: (id) => request(`/api/admin/forum/topics/${id}`, { method: 'DELETE' }),
  getForumPosts: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/admin/forum/posts${query ? `?${query}` : ''}`);
  },
  deleteForumPost: (id) => request(`/api/admin/forum/posts/${id}`, { method: 'DELETE' }),
  getFeedback: () => request('/api/admin/feedback'),
  updateFeedback: (id, data) => request(`/api/admin/feedback/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteFeedback: (id) => request(`/api/admin/feedback/${id}`, { method: 'DELETE' }),
  replyFeedback: (id, message) => request(`/api/admin/feedback/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) }),
};

export const getCoverUrl = (coverPath) => {
  if (!coverPath) return `${API_BASE}/api/cover/default`;
  if (coverPath.startsWith('http')) return coverPath;
  if (coverPath.startsWith('/api/cover')) {
    return `${API_BASE}${coverPath}`;
  }
  if (!isNaN(parseInt(coverPath))) {
    return `${API_BASE}/api/cover/${coverPath}`;
  }
  return `${API_BASE}/api/cover/default`;
};