const API_BASE = 'http://localhost:3000/api';

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
};

export const mangaAPI = {
  list: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/manga${query ? `?${query}` : ''}`);
  },
  get: (id) => request(`/manga/${id}`),
  getChapters: (mangaId) => request(`/manga/${mangaId}/chapters`),
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
  createTopic: (data) => request('/forum_topics', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createPost: (data) => request('/forum_posts', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  likePost: (postId) => request(`/forum_posts/${postId}/like`, {
    method: 'POST'
  })
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
};

export const favoritesAPI = {
  list: () => request('/favorites'),
  toggle: (mangaId) => request('/favorites/toggle', { method: 'POST', body: JSON.stringify({ mangaId }) }),
};

export const feedbackAPI = {
  send: (data) => request('/feedback', { method: 'POST', body: JSON.stringify(data) }),
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
};

export const getCoverUrl = (coverPath) => {
  if (!coverPath) return 'http://localhost:3000/api/cover/default';
  if (coverPath.startsWith('http')) return coverPath;
  if (coverPath.startsWith('/api/cover')) {
    return `http://localhost:3000${coverPath}`;
  }
  if (!isNaN(parseInt(coverPath))) {
    return `http://localhost:3000/api/cover/${coverPath}`;
  }
  return 'http://localhost:3000/api/cover/default';
};