// src/utils/imageHelper.js

const API_BASE = 'http://localhost:3000';

export function getCoverUrl(cover) {
  if (!cover) return `${API_BASE}/api/cover/default`;
  if (cover.startsWith('http')) return cover;
  if (cover.startsWith('/api/cover')) {
    return `${API_BASE}${cover}`;
  }
  // Если пришел ID манги
  if (!isNaN(parseInt(cover))) {
    return `${API_BASE}/api/cover/${cover}`;
  }
  // Если путь начинается с /uploads, конвертируем
  if (cover.includes('cover-')) {
    const match = cover.match(/cover-(\d+)\.png/);
    if (match) {
      return `${API_BASE}/api/cover/${match[1]}`;
    }
  }
  return `${API_BASE}/api/cover/default`;
}

export function handleImageError(event) {
  console.error('🖼️ Ошибка загрузки изображения:', event.target.src);
  event.target.src = `${API_BASE}/api/cover/default`;
  event.target.onerror = null;
}

export const getPageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/api')) {
    return `${API_BASE}${url}`;
  }
  return `${API_BASE}${url}`;
};