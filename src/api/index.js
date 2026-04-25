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
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/profile'),
  verifyEmail: (token) => request(`/auth/verify-email?token=${token}`),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, password) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  resendVerification: () => request('/auth/resend-verification', { method: 'POST' }),
};

export const mangaAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/manga${query ? `?${query}` : ''}`);
  },
  get: (id) => request(`/manga/${id}`),
  getChapters: (mangaId) => request(`/manga/${mangaId}/chapters`),
  rate: (mangaId, rating) => request(`/manga/${mangaId}/rate`, { method: 'POST', body: JSON.stringify({ rating }) }),
  getComments: (mangaId) => request(`/manga/${mangaId}/comments`),
  addComment: (mangaId, content) => request(`/manga/${mangaId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
};

export const chaptersAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/chapters${query ? `?${query}` : ''}`);
  },
  get: (id) => request(`/chapters/${id}`),
  getChapter: (id) => request(`/chapters/${id}`),
  getPages: (id) => request(`/chapters/${id}/pages`),
  create: (data) => request('/chapters', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/chapters/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/chapters/${id}`, { method: 'DELETE' }),
};

export const forumAPI = {
  getCategories: () => request('/forum_categories'),
  getTopics: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/forum_topics${query ? `?${query}` : ''}`);
  },
  getTopic: (id) => request(`/forum_topics/${id}`),
  createTopic: (data) => request('/forum_topics', { method: 'POST', body: JSON.stringify(data) }),
  createPost: (data) => request('/forum_posts', { method: 'POST', body: JSON.stringify(data) }),
  likePost: (postId) => request(`/forum_posts/${postId}/like`, { method: 'POST' }),
  unlikePost: (postId) => request(`/forum_posts/${postId}/like`, { method: 'DELETE' }),
  getRecentPosts: (limit = 5) => request(`/forum/posts/recent?limit=${limit}`),
  getPopularTopics: (limit = 5) => request(`/forum/topics/popular?limit=${limit}`),
};

export const userMangaStatusAPI = {
  set: (userId, mangaId, status) => request(`/user/${userId}/status`, {
    method: 'POST',
    body: JSON.stringify({ mangaId, status })
  }),
  get: (userId) => request(`/user/${userId}/status`),
};

export const progressAPI = {
  save: (data) => request('/progress', { method: 'POST', body: JSON.stringify(data) }),
  get: (mangaId) => request(`/progress/${mangaId}`),
  list: () => request('/progress'),
};

export const favoritesAPI = {
  list: () => request('/favorites'),
  toggle: (mangaId) => request('/favorites/toggle', { method: 'POST', body: JSON.stringify({ mangaId }) }),
};

export const feedbackAPI = {
  send: (data) => request('/feedback', { method: 'POST', body: JSON.stringify(data) }),
};

export const notificationsAPI = {
  getAll: () => request('/notifications'),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
};

export const adminAPI = {
  getUsers: () => request('/admin/users'),
  updateUserRole: (id, role) => request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  syncAll: () => request('/admin/sync', { method: 'POST' }),
  syncPages: () => request('/admin/sync-pages', { method: 'POST' }),
  createManga: (data) => request('/manga', { method: 'POST', body: JSON.stringify(data) }),
  updateManga: (id, data) => request(`/manga/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteManga: (id) => request(`/manga/${id}`, { method: 'DELETE' }),
  getForumCategories: () => request('/admin/forum/categories'),
  createForumCategory: (data) => request('/admin/forum/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateForumCategory: (id, data) => request(`/admin/forum/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteForumCategory: (id) => request(`/admin/forum/categories/${id}`, { method: 'DELETE' }),
  getForumTopics: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/forum/topics${query ? `?${query}` : ''}`);
  },
  updateForumTopic: (id, data) => request(`/admin/forum/topics/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteForumTopic: (id) => request(`/admin/forum/topics/${id}`, { method: 'DELETE' }),
  getForumPosts: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/forum/posts${query ? `?${query}` : ''}`);
  },
  deleteForumPost: (id) => request(`/admin/forum/posts/${id}`, { method: 'DELETE' }),
  getFeedback: () => request('/admin/feedback'),
  updateFeedback: (id, data) => request(`/admin/feedback/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteFeedback: (id) => request(`/admin/feedback/${id}`, { method: 'DELETE' }),
  replyFeedback: (id, message) => request(`/admin/feedback/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) }),
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