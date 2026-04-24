// src/utils/helpers.js
/**
 * Форматирует число с разделением разрядов
 */
export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num || 0);
};

/**
 * Обрезает текст до maxLength и добавляет '…' при необходимости
 */
export const truncateText = (text, max = 100) => {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '…' : text;
};

/**
 * Возвращает дату в формате "день.месяц.год" (русская локаль)
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ru-RU');
};

/**
 * Дружественное отображение времени: "только что", "5 мин. назад", "вчера" и т.д.
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffHour < 24) return `${diffHour} ч. назад`;
  if (diffDay === 1) return 'вчера';
  if (diffDay < 7) return `${diffDay} дн. назад`;
  return formatDate(dateString);
};

/**
 * Возвращает иконку категории форума по имени
 */
export const getCategoryIcon = (name) => {
  const icons = {
    'Обсуждение манги': '📚',
    'Новости и анонсы': '📰',
    default: '📁'
  };
  return icons[name] || icons.default;
};