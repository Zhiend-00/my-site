// src/utils/imageHelper.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function getCoverUrl(cover) {
  if (!cover) return `${API_BASE}/api/cover/default`;
  if (cover.startsWith('http')) return cover;
  if (cover.startsWith('/api/cover/')) return `${API_BASE}${cover}`;
  if (!isNaN(parseInt(cover))) return `${API_BASE}/api/cover/${cover}`;
  return `${API_BASE}/api/cover/default`;
}

export function handleImageError(event) {
  event.target.src = `${API_BASE}/api/cover/default`;
}

export default {
  getCoverUrl,
  handleImageError
};