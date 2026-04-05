<!-- components/forum/ForumCategoryCard.vue -->
<template>
  <div @click="$emit('click')" class="category-card">
    <!-- Заголовок категории -->
    <div class="category-header">
      <div class="category-icon">
        {{ getCategoryIcon(category.name) }}
      </div>
      <div class="category-info">
        <h3 class="category-name">{{ category.name }}</h3>
        <p v-if="category.description" class="category-description">
          {{ truncateText(category.description, 100) }}
        </p>
      </div>
    </div>
    
    <!-- Статистика категории -->
    <div class="category-stats">
      <div class="stat-item">
        <span class="stat-icon">💬</span>
        <span class="stat-value">{{ category.topics_count || 0 }}</span>
        <span class="stat-label">Тем</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">📝</span>
        <span class="stat-value">{{ category.posts_count || 0 }}</span>
        <span class="stat-label">Сообщений</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">👁</span>
        <span class="stat-value">{{ formatNumber(category.views_count || 0) }}</span>
        <span class="stat-label">Просмотров</span>
      </div>
    </div>
    
    <!-- Последняя активность -->
    <div v-if="category.last_topic" class="last-activity">
      <div class="activity-label">Последняя активность:</div>
      <div class="activity-content">
        <router-link 
          :to="`/forum/topic/${category.last_topic.id}`" 
          class="last-topic"
          @click.stop
        >
          {{ truncateText(category.last_topic.title, 50) }}
        </router-link>
        <div class="activity-meta">
          <span class="author">
            👤 {{ category.last_topic.author?.username || 'Аноним' }}
          </span>
          <span class="time">
            🕐 {{ formatTimeAgo(category.last_topic.created_at) }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Теги категории -->
    <div v-if="category.tags && category.tags.length > 0" class="category-tags">
      <span 
        v-for="tag in category.tags.slice(0, 3)" 
        :key="tag"
        class="tag"
      >
        #{{ tag }}
      </span>
      <span v-if="category.tags.length > 3" class="more-tags">
        +{{ category.tags.length - 3 }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue'

const props = defineProps({
  category: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

// Методы
const getCategoryIcon = (categoryName) => {
  const icons = {
    'Манга': '📚',
    'Аниме': '🎬',
    'Новости': '📰',
    'Обсуждения': '💬',
    'Рекомендации': '⭐',
    'Помощь': '❓',
    'Технические вопросы': '🔧',
    'Оффтоп': '🎭'
  }
  
  return icons[categoryName] || '📁'
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num
}

const formatTimeAgo = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 60) return `${diffMins} мин назад`
  if (diffHours < 24) return `${diffHours} ч назад`
  if (diffDays < 7) return `${diffDays} д назад`
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: diffDays < 365 ? undefined : 'numeric'
  })
}
</script>

<style scoped>
.category-card {
  background: var(--color-panel);
  border-radius: 12px;
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 2px solid transparent;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-heavy);
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-panel) 90%, var(--color-primary));
}

.category-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.category-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-name {
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 1.3rem;
  line-height: 1.3;
}

.category-description {
  color: var(--color-text);
  opacity: 0.7;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.category-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-icon {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.stat-value {
  color: var(--color-text);
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 2px;
}

.stat-label {
  color: var(--color-text);
  opacity: 0.7;
  font-size: 0.8rem;
}

.last-activity {
  margin-top: auto;
  padding-top: var(--spacing-md);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.activity-label {
  color: var(--color-text);
  opacity: 0.7;
  font-size: 0.85rem;
  margin-bottom: 6px;
}

.last-topic {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  display: block;
  margin-bottom: 4px;
  transition: color var(--transition-normal);
}

.last-topic:hover {
  color: color-mix(in srgb, var(--color-primary) 90%, white);
  text-decoration: underline;
}

.activity-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--color-text);
  opacity: 0.7;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--spacing-md);
}

.tag {
  background: rgba(128, 131, 42, 0.2);
  color: var(--color-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.more-tags {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  opacity: 0.7;
}

/* Адаптивность */
@media (max-width: 768px) {
  .category-header {
    flex-direction: column;
    text-align: center;
  }
  
  .category-icon {
    margin: 0 auto;
  }
  
  .category-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .activity-meta {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
}
</style>