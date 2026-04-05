<!-- components/forum/ForumTopicCard.vue -->
<template>
  <div @click="$emit('click')" class="forum-topic-card">
    <!-- Иконки статуса -->
    <div class="topic-status">
      <span v-if="topic.is_pinned" title="Закреплено" class="status-icon pinned">📌</span>
      <span v-if="topic.is_locked" title="Закрыто" class="status-icon locked">🔒</span>
      <span v-if="topic.is_archived" title="Архив" class="status-icon archived">📁</span>
      <span v-else class="status-icon default">💬</span>
    </div>
    
    <!-- Основная информация -->
    <div class="topic-main">
      <!-- Заголовок и автор -->
      <div class="topic-header">
        <h4 class="topic-title">{{ topic.title }}</h4>
        <div class="topic-author">
          <img 
            v-if="topic.author?.avatar_url"
            :src="topic.author.avatar_url"
            :alt="topic.author.username"
            class="author-avatar"
          />
          <span class="author-name">{{ topic.author?.username || 'Аноним' }}</span>
          <span class="author-role" :class="topic.author?.role">{{ topic.author?.role }}</span>
        </div>
      </div>
      
      <!-- Категория и дата -->
      <div class="topic-meta">
        <router-link 
          :to="`/forum/category/${topic.category?.slug}`"
          class="topic-category"
          @click.stop
        >
          📁 {{ topic.category?.name || 'Без категории' }}
        </router-link>
        <span class="topic-date">📅 {{ formatDate(topic.created_at) }}</span>
      </div>
      
      <!-- Теги -->
      <div v-if="topic.tags && topic.tags.length > 0" class="topic-tags">
        <span 
          v-for="tag in topic.tags.slice(0, 3)" 
          :key="tag"
          class="tag"
        >
          #{{ tag }}
        </span>
        <span v-if="topic.tags.length > 3" class="more-tags">
          +{{ topic.tags.length - 3 }}
        </span>
      </div>
      
      <!-- Краткое содержание -->
      <p v-if="topic.content" class="topic-excerpt">
        {{ truncateText(topic.content, 150) }}
      </p>
    </div>
    
    <!-- Статистика -->
    <div class="topic-stats">
      <div class="stat-item">
        <span class="stat-icon">👁</span>
        <span class="stat-value">{{ topic.views_count || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">💬</span>
        <span class="stat-value">{{ topic.posts_count || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">❤</span>
        <span class="stat-value">{{ topic.likes_count || 0 }}</span>
      </div>
    </div>
    
    <!-- Последний пост -->
    <div v-if="topic.last_post" class="last-post">
      <div class="last-post-avatar">
        <img 
          v-if="topic.last_post.author?.avatar_url"
          :src="topic.last_post.author.avatar_url"
          :alt="topic.last_post.author.username"
        />
      </div>
      <div class="last-post-info">
        <div class="last-post-author">
          {{ topic.last_post.author?.username || 'Аноним' }}
        </div>
        <div class="last-post-date">
          {{ formatTimeAgo(topic.last_post.created_at) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  topic: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

// Методы
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatTimeAgo = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'только что'
  if (diffMins < 60) return `${diffMins} мин назад`
  if (diffHours < 24) return `${diffHours} ч назад`
  if (diffDays < 7) return `${diffDays} д назад`
  
  return formatDate(dateString)
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<style scoped>
.forum-topic-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-panel);
  border-radius: 12px;
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 2px solid transparent;
  margin-bottom: var(--spacing-md);
}

.forum-topic-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-medium);
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-panel) 90%, var(--color-primary));
}

.topic-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.status-icon {
  font-size: 1.5rem;
  opacity: 0.8;
}

.status-icon.pinned {
  color: #ffaa00;
}

.status-icon.locked {
  color: #ff4444;
}

.status-icon.archived {
  color: #80832A;
}

.topic-main {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.topic-title {
  color: var(--color-text);
  margin: 0;
  font-size: 1.1rem;
  flex: 1;
}

.topic-author {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.9rem;
}

.author-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  color: var(--color-text);
  opacity: 0.9;
}

.author-role {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  text-transform: uppercase;
}

.author-role.admin {
  background: rgba(255, 0, 0, 0.2);
  color: #ff4444;
}

.author-role.moderator {
  background: rgba(255, 165, 0, 0.2);
  color: #ffaa00;
}

.author-role.translator {
  background: rgba(0, 100, 255, 0.2);
  color: #0066ff;
}

.topic-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.8;
}

.topic-category {
  color: var(--color-secondary);
  text-decoration: none;
  font-weight: 600;
}

.topic-category:hover {
  text-decoration: underline;
}

.topic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  background: rgba(128, 131, 42, 0.2);
  color: var(--color-secondary);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.more-tags {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  opacity: 0.7;
}

.topic-excerpt {
  color: var(--color-text);
  opacity: 0.8;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.topic-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 1rem;
  opacity: 0.8;
}

.stat-value {
  color: var(--color-text);
  font-weight: 600;
  font-size: 0.9rem;
}

.last-post {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: var(--spacing-sm);
}

.last-post-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
}

.last-post-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.last-post-info {
  flex: 1;
}

.last-post-author {
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 500;
}

.last-post-date {
  color: var(--color-text);
  opacity: 0.7;
  font-size: 0.8rem;
}

/* Адаптивность */
@media (max-width: 768px) {
  .forum-topic-card {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .topic-status {
    flex-direction: row;
    justify-content: flex-start;
  }
  
  .topic-stats {
    flex-direction: row;
    justify-content: flex-start;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: var(--spacing-sm);
    margin-top: var(--spacing-sm);
  }
  
  .last-post {
    grid-column: auto;
  }
}
</style>