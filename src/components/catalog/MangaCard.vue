			<!-- components/catalog/MangaCard.vue -->
<template>
  <router-link :to="`/manga/${manga.slug}`" class="manga-card" :class="viewMode">
    <!-- Обложка -->
    <div class="manga-cover">
      <img 
        :src="manga.cover_url || '/images/default-cover.jpg'" 
        :alt="manga.title_ru"
        @error="handleImageError"
        loading="lazy"
      />
      <!-- Бейдж статуса -->
      <span class="status-badge" :class="manga.status">
        {{ statusText[manga.status] }}
      </span>
      <!-- Рейтинг -->
      <div v-if="manga.rating" class="rating-badge">
        ⭐ {{ manga.rating.toFixed(1) }}
      </div>
    </div>
    
    <!-- Информация -->
    <div class="manga-info">
      <h3 class="manga-title">{{ manga.title_ru }}</h3>
      <p v-if="manga.title_en && viewMode === 'list'" class="manga-title-en">
        {{ manga.title_en }}
      </p>
      
      <!-- Жанры -->
      <div class="manga-genres">
        <span 
          v-for="genre in displayGenres" 
          :key="genre.id"
          class="genre-tag"
        >
          {{ genre.name }}
        </span>
        <span v-if="extraGenresCount > 0" class="more-genres">
          +{{ extraGenresCount }}
        </span>
      </div>
      
      <!-- Статистика -->
      <div class="manga-stats">
        <span class="stat-item" title="Главы">
          📖 {{ manga.chaptersCount || 0 }}
        </span>
        <span class="stat-item" title="Просмотры">
          👁 {{ formatNumber(manga.views_count || 0) }}
        </span>
        <span class="stat-item" title="В избранном">
          ❤ {{ formatNumber(manga.favorites_count || 0) }}
        </span>
      </div>
      
      <!-- Описание (только в списке) -->
      <p v-if="viewMode === 'list' && manga.description" class="manga-description">
        {{ truncateText(manga.description, 150) }}
      </p>
      
      <!-- Последняя глава -->
      <div v-if="manga.last_chapter && viewMode === 'list'" class="last-chapter">
        <span class="chapter-label">Последняя глава:</span>
        <span class="chapter-info">{{ manga.last_chapter.number }} - {{ manga.last_chapter.title }}</span>
        <span class="chapter-date">{{ formatDate(manga.last_chapter.date) }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  manga: {
    type: Object,
    required: true
  },
  viewMode: {
    type: String,
    default: 'grid',
    validator: value => ['grid', 'list'].includes(value)
  }
})

// Статусы
const statusText = {
  ongoing: 'Онгоинг',
  completed: 'Завершена',
  hiatus: 'Перерыв',
  cancelled: 'Отменена'
}

// Жанры для отображения
const displayGenres = computed(() => {
  return props.manga.genres?.slice(0, props.viewMode === 'grid' ? 2 : 3) || []
})

const extraGenresCount = computed(() => {
  const total = props.manga.genres?.length || 0
  const displayed = displayGenres.value.length
  return Math.max(0, total - displayed)
})

// Методы
const handleImageError = (event) => {
  event.target.src = '/images/default-cover.jpg'
  event.target.onerror = null
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num
}

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Сегодня'
  if (days === 1) return 'Вчера'
  if (days < 7) return `${days} дня назад`
  if (days < 30) return `${Math.floor(days / 7)} недели назад`
  if (days < 365) return `${Math.floor(days / 30)} месяца назад`
  return date.toLocaleDateString('ru-RU')
}
</script>

<style scoped>
.manga-card {
  display: block;
  background: var(--color-panel);
  border-radius: 12px;
  overflow: hidden;
  transition: all var(--transition-normal);
  text-decoration: none;
  color: inherit;
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 100%;
}

.manga-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-heavy);
  border-color: var(--color-primary);
}

/* Режим сетки */
.manga-card.grid {
  display: flex;
  flex-direction: column;
}

.manga-card.grid .manga-cover {
  height: 300px;
  position: relative;
}

.manga-card.grid .manga-info {
  padding: var(--spacing-md);
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Режим списка */
.manga-card.list {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.manga-card.list .manga-cover {
  height: 160px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.manga-card.list .manga-info {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.manga-cover {
  position: relative;
  overflow: hidden;
}

.manga-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.manga-card:hover .manga-cover img {
  transform: scale(1.05);
}

.status-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.ongoing {
  background: rgba(0, 255, 0, 0.2);
  color: #00cc44;
  border: 1px solid #00cc44;
}

.status-badge.completed {
  background: rgba(0, 100, 255, 0.2);
  color: #0066ff;
  border: 1px solid #0066ff;
}

.status-badge.hiatus {
  background: rgba(255, 165, 0, 0.2);
  color: #ffaa00;
  border: 1px solid #ffaa00;
}

.status-badge.cancelled {
  background: rgba(255, 0, 0, 0.2);
  color: #ff4444;
  border: 1px solid #ff4444;
}

.rating-badge {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: #ffaa00;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.manga-title {
  font-size: 1.1rem;
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.manga-card.list .manga-title {
  font-size: 1.2rem;
  -webkit-line-clamp: 1;
}

.manga-title-en {
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.7;
  margin: 0 0 var(--spacing-sm) 0;
  font-style: italic;
}

.manga-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: var(--spacing-sm);
}

.genre-tag {
  background: rgba(128, 131, 42, 0.2);
  color: var(--color-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
}

.more-genres {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  opacity: 0.7;
}

.manga-stats {
  display: flex;
  gap: var(--spacing-md);
  margin-top: auto;
  padding-top: var(--spacing-sm);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  font-size: 0.8rem;
  color: var(--color-text);
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 4px;
}

.manga-description {
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.8;
  line-height: 1.5;
  margin: var(--spacing-sm) 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.last-chapter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  font-size: 0.85rem;
  padding-top: var(--spacing-sm);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.chapter-label {
  color: var(--color-text);
  opacity: 0.6;
}

.chapter-info {
  color: var(--color-primary);
  font-weight: 500;
}

.chapter-date {
  color: var(--color-text);
  opacity: 0.7;
  font-size: 0.8rem;
  margin-left: auto;
}

/* Адаптивность */
@media (max-width: 768px) {
  .manga-card.list {
    grid-template-columns: 100px 1fr;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
  }
  
  .manga-card.list .manga-cover {
    height: 140px;
  }
  
  .manga-card.grid .manga-cover {
    height: 250px;
  }
}

@media (max-width: 480px) {
  .manga-card.list {
    grid-template-columns: 1fr;
  }
  
  .manga-card.list .manga-cover {
    height: 200px;
  }
  
  .manga-genres {
    display: none;
  }
}
</style>