<template>
  <div class="forum-page">
    <div class="forum-container">
      <!-- Заголовок по центру -->
      <div class="forum-header">
        <h1 class="forum-title">Форум</h1>
      </div>

      <!-- Поиск -->
      <div class="search-section">
        <input 
          type="text" 
          v-model="searchQuery" 
          @keyup.enter="searchTopics"
          placeholder="Поиск по темам..."
          class="search-input"
        />
        <button @click="searchTopics" class="search-btn">Найти</button>
      </div>

      <!-- Категории форума -->
      <div class="categories-section">
        <div class="section-header">
          <h2 class="section-title">📁 Категории</h2>
        </div>
        <div class="categories-grid">
          <div 
            v-for="category in categories" 
            :key="category.id" 
            class="category-card"
            :class="{ active: selectedCategory?.id === category.id }"
            @click="selectCategory(category)"
          >
            <div class="category-icon">{{ category.icon || '📚' }}</div>
            <div class="category-info">
              <h3>{{ category.name }}</h3>
              <p>{{ category.description || 'Обсуждение манги и новинок' }}</p>
              <span class="topics-count">{{ getCategoryTopicsCount(category.id) }} тем</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Список тем -->
      <div class="topics-section">
        <div class="section-header topics-header">
          <h2 class="section-title">{{ selectedCategory ? selectedCategory.name : '📖 Все темы' }}</h2>
          <button @click="openCreateTopicModal" class="create-topic-btn">+ Создать тему</button>
        </div>

        <div v-if="loadingTopics" class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка тем...</p>
        </div>

        <div v-else-if="filteredTopics.length === 0" class="empty-state">
          <p>😔 Тем не найдено</p>
          <button @click="openCreateTopicModal" class="create-first-btn">Создать первую тему</button>
        </div>

        <div v-else class="topics-list">
          <div 
            v-for="topic in filteredTopics" 
            :key="topic.id" 
            class="topic-item"
            @click="goToTopic(topic.id)"
          >
            <div class="topic-left">
              <div class="topic-icon">💬</div>
              <div class="topic-details">
                <h3 class="topic-title">{{ topic.title }}</h3>
                <div class="topic-meta">
                  <span class="topic-author">👤 {{ topic.author?.username || 'Пользователь' }}</span>
                  <span class="topic-date">📅 {{ formatDate(topic.created_at) }}</span>
                  <span class="topic-category" v-if="!selectedCategory">📁 {{ getCategoryName(topic.category_id) }}</span>
                </div>
              </div>
            </div>
            <div class="topic-right">
              <div class="topic-stats">
                <div class="stat-replies">
                  <span class="stat-number">{{ getPostsCount(topic.id) }}</span>
                  <span class="stat-label">ответов</span>
                </div>
                <div class="stat-views">
                  <span class="stat-number">{{ topic.views || 0 }}</span>
                  <span class="stat-label">просмотров</span>
                </div>
              </div>
              <div v-if="getLastPost(topic.id)" class="topic-last">
                <span class="last-time">{{ formatDate(getLastPost(topic.id).created_at) }}</span>
                <span class="last-author">от {{ getLastPost(topic.id).author?.username?.slice(0, 15) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания темы -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Создать новую тему</h3>
          <button @click="showCreateModal = false" class="close-modal">&times;</button>
        </div>
        <form @submit.prevent="createTopic">
          <div class="form-group">
            <label>Категория</label>
            <select v-model="newTopic.category_id" class="form-select" required>
              <option value="">Без категории</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Заголовок темы</label>
            <input type="text" v-model="newTopic.title" class="form-input" required placeholder="Введите заголовок темы" />
          </div>
          <div class="form-group">
            <label>Сообщение</label>
            <textarea v-model="newTopic.content" class="form-textarea" rows="6" required placeholder="Введите текст сообщения..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showCreateModal = false" class="btn-cancel">Отмена</button>
            <button type="submit" :disabled="creatingTopic" class="btn-submit">{{ creatingTopic ? 'Создание...' : 'Создать тему' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { forumAPI } from '@/api';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const categories = ref([
  { id: 1, name: 'Обсуждение манги', icon: '📖', description: 'Обсуждаем сюжеты, персонажей и новинки' },
  { id: 2, name: 'Новости и анонсы', icon: '📰', description: 'Самые свежие новости мира манги' },
]);

// Хранилище постов для каждой темы
const postsStore = ref({});

// Загрузка постов из localStorage
const loadPostsFromStorage = () => {
  const saved = localStorage.getItem('forum_posts_store');
  if (saved) {
    postsStore.value = JSON.parse(saved);
  } else {
    postsStore.value = {};
  }
};

// Сохранение постов в localStorage
const savePostsToStorage = () => {
  localStorage.setItem('forum_posts_store', JSON.stringify(postsStore.value));
};

const topics = ref([]);

// Загрузка тем из localStorage
const loadTopicsFromStorage = () => {
  const saved = localStorage.getItem('forum_topics');
  if (saved) {
    topics.value = JSON.parse(saved);
  } else {
    // Начальные темы
    topics.value = [
      {
        id: 1,
        category_id: 1,
        title: 'Ирума',
        author: { username: 'zhiend00' },
        created_at: new Date(Date.now() - 6 * 60000).toISOString(),
        views: 1
      },
      {
        id: 2,
        category_id: null,
        title: 'Вышел новый том Берсерка!',
        author: { username: 'admin' },
        created_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
        views: 128
      },
      {
        id: 3,
        category_id: null,
        title: 'Обсуждение новинок',
        author: { username: 'zhiend00' },
        created_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        views: 32
      },
      {
        id: 4,
        category_id: null,
        title: 'Любимая манга и почему?',
        author: { username: 'admin' },
        created_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
        views: 49
      }
    ];
    saveTopicsToStorage();
  }
  
  // Убеждаемся, что для всех тем есть записи в postsStore
  topics.value.forEach(topic => {
    if (!postsStore.value[topic.id]) {
      postsStore.value[topic.id] = [];
    }
  });
  savePostsToStorage();
};

// Сохранение тем в localStorage
const saveTopicsToStorage = () => {
  localStorage.setItem('forum_topics', JSON.stringify(topics.value));
};

// Получить количество постов в теме
const getPostsCount = (topicId) => {
  const posts = postsStore.value[topicId];
  return posts?.length || 0;
};

// Получить последний пост в теме
const getLastPost = (topicId) => {
  const posts = postsStore.value[topicId];
  if (!posts || posts.length === 0) return null;
  return posts[posts.length - 1];
};

const selectedCategory = ref(null);
const searchQuery = ref('');
const loadingTopics = ref(false);
const creatingTopic = ref(false);
const showCreateModal = ref(false);

const newTopic = ref({
  category_id: '',
  title: '',
  content: ''
});

const filteredTopics = computed(() => {
  let result = [...topics.value];
  
  if (selectedCategory.value) {
    result = result.filter(t => t.category_id === selectedCategory.value.id);
  }
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(t => t.title.toLowerCase().includes(query));
  }
  
  return result;
});

const getCategoryName = (categoryId) => {
  const cat = categories.value.find(c => c.id === categoryId);
  return cat ? cat.name : 'Без категории';
};

const getCategoryTopicsCount = (categoryId) => {
  return topics.value.filter(t => t.category_id === categoryId).length;
};

const selectCategory = (category) => {
  if (selectedCategory.value?.id === category.id) {
    selectedCategory.value = null;
  } else {
    selectedCategory.value = category;
  }
};

const searchTopics = () => {
  if (searchQuery.value.trim()) {
    selectedCategory.value = null;
  }
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes === 0 ? 'только что' : `${minutes} мин`;
    }
    return `${hours} ч`;
  } else if (days === 1) {
    return 'вчера';
  } else if (days < 7) {
    return `${days} дн`;
  }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const goToTopic = (topicId) => {
  router.push(`/forum/topic/${topicId}`);
};

const openCreateTopicModal = () => {
  if (!authStore.isLoggedIn) {
    alert('Для создания темы необходимо авторизоваться');
    return;
  }
  showCreateModal.value = true;
};

const createTopic = async () => {
  if (!authStore.isLoggedIn) {
    alert('Необходимо авторизоваться');
    return;
  }
  
  if (!newTopic.value.title.trim()) {
    alert('Введите заголовок темы');
    return;
  }
  
  if (!newTopic.value.content.trim()) {
    alert('Введите текст сообщения');
    return;
  }
  
  creatingTopic.value = true;
  
  try {
    const newTopicId = Date.now();
    const currentUser = authStore.user?.username || authStore.user?.email || 'Пользователь';
    
    const newTopicData = {
      id: newTopicId,
      category_id: newTopic.value.category_id || null,
      title: newTopic.value.title,
      author: { username: currentUser },
      created_at: new Date().toISOString(),
      views: 0
    };
    
    // Добавляем тему в начало списка
    topics.value = [newTopicData, ...topics.value];
    saveTopicsToStorage();
    
    // Создаем первый пост
    postsStore.value[newTopicId] = [
      {
        id: newTopicId + 1,
        author: { username: currentUser },
        content: newTopic.value.content,
        created_at: new Date().toISOString(),
        likes: 0,
        is_liked: false
      }
    ];
    savePostsToStorage();
    
    alert('Тема успешно создана!');
    showCreateModal.value = false;
    newTopic.value = { category_id: '', title: '', content: '' };
    
  } catch (error) {
    console.error('Ошибка создания темы:', error);
    alert('Ошибка создания темы: ' + (error.message || 'Попробуйте позже'));
  } finally {
    creatingTopic.value = false;
  }
};

// Обновление данных при фокусе
let refreshTimer = null;
const refreshData = () => {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    loadTopicsFromStorage();
    loadPostsFromStorage();
  }, 100);
};

const loadCategories = async () => {
  try {
    const data = await forumAPI.getCategories();
    if (data && (data.categories || data.length)) {
      categories.value = data.categories || data;
    }
  } catch (error) {
    console.log('Используем локальные категории');
  }
};

onMounted(() => {
  loadPostsFromStorage();
  loadTopicsFromStorage();
  loadCategories();
  
  window.addEventListener('focus', refreshData);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refreshData();
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('focus', refreshData);
  document.removeEventListener('visibilitychange', refreshData);
  if (refreshTimer) clearTimeout(refreshTimer);
});
</script>

<style scoped>
.forum-page {
  min-height: calc(100vh - var(--header-height, 60px) - var(--footer-height, 60px));
  padding: 30px 0 50px;
  background: var(--color-background, #0a0a0a);
}

.forum-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}

.forum-header {
  text-align: center;
  margin-bottom: 30px;
}

.forum-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--color-primary, #07660c);
  margin: 0;
  letter-spacing: -0.5px;
}

.search-section {
  display: flex;
  gap: 12px;
  margin-bottom: 35px;
  justify-content: center;
}

.search-input {
  flex: 1;
  max-width: 360px;
  padding: 12px 18px;
  background: var(--color-panel, #1a1a1a);
  border: 1px solid rgba(128, 131, 42, 0.3);
  border-radius: 10px;
  color: var(--color-text, #ffffff);
  font-size: 0.95rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary, #07660c);
}

.search-btn {
  padding: 12px 28px;
  background: var(--color-primary, #07660c);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}

.search-btn:hover {
  background: var(--color-primary-hover, #0a8a10);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(128, 131, 42, 0.3);
}

.topics-header {
  padding: 16px 20px 12px 20px;
  margin: 0;
  background: rgba(7, 102, 12, 0.1);
  border-radius: 12px 12px 0 0;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-secondary, #9ea344);
  margin: 0;
}

.create-topic-btn {
  padding: 10px 22px;
  background: var(--color-primary, #07660c);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.create-topic-btn:hover {
  background: var(--color-primary-hover, #0a8a10);
}

.categories-section {
  margin-bottom: 40px;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: var(--color-panel, #1a1a1a);
  border-radius: 12px;
  border: 1px solid rgba(128, 131, 42, 0.2);
  cursor: pointer;
  transition: all 0.2s;
}

.category-card:hover {
  border-color: var(--color-primary, #07660c);
  background: rgba(7, 102, 12, 0.05);
}

.category-card.active {
  border-color: var(--color-primary, #07660c);
  background: rgba(7, 102, 12, 0.1);
}

.category-icon {
  font-size: 2.2rem;
  min-width: 52px;
  text-align: center;
}

.category-info {
  flex: 1;
}

.category-info h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary, #07660c);
  margin: 0 0 5px 0;
}

.category-info p {
  font-size: 0.75rem;
  color: var(--color-text-muted, #aaa);
  margin: 0 0 6px 0;
}

.topics-count {
  font-size: 0.7rem;
  color: var(--color-secondary, #9ea344);
}

.topics-section {
  background: var(--color-panel, #1a1a1a);
  border-radius: 12px;
  border: 1px solid rgba(128, 131, 42, 0.2);
  overflow: hidden;
}

.topics-list {
  display: flex;
  flex-direction: column;
}

.topic-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.2s;
}

.topic-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.topic-item:last-child {
  border-bottom: none;
}

.topic-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.topic-icon {
  font-size: 1.4rem;
  min-width: 36px;
  text-align: center;
}

.topic-details {
  flex: 1;
  min-width: 0;
}

.topic-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text, #ffffff);
  margin: 0 0 6px 0;
}

.topic-title:hover {
  color: var(--color-primary, #07660c);
}

.topic-meta {
  display: flex;
  gap: 16px;
  font-size: 0.7rem;
  color: var(--color-text-muted, #aaa);
  flex-wrap: wrap;
}

.topic-right {
  display: flex;
  align-items: center;
  gap: 28px;
  flex-shrink: 0;
}

.topic-stats {
  display: flex;
  gap: 20px;
}

.stat-replies, .stat-views {
  text-align: center;
  min-width: 60px;
}

.stat-number {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-secondary, #9ea344);
}

.stat-label {
  font-size: 0.6rem;
  color: var(--color-text-muted, #aaa);
}

.topic-last {
  min-width: 105px;
  text-align: right;
}

.last-time {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-muted, #aaa);
}

.last-author {
  display: block;
  font-size: 0.65rem;
  color: var(--color-primary, #07660c);
  margin-top: 3px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 50px;
  color: var(--color-text-muted, #aaa);
}

.spinner {
  width: 45px;
  height: 45px;
  border: 3px solid rgba(128, 131, 42, 0.2);
  border-top-color: var(--color-primary, #07660c);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 18px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.create-first-btn {
  margin-top: 18px;
  padding: 10px 24px;
  background: var(--color-primary, #07660c);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: var(--color-panel, #1a1a1a);
  border-radius: 16px;
  width: 90%;
  max-width: 540px;
  max-height: 85vh;
  overflow-y: auto;
  border: 1px solid rgba(128, 131, 42, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(128, 131, 42, 0.2);
}

.modal-header h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-primary, #07660c);
  margin: 0;
}

.close-modal {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: var(--color-text-muted, #aaa);
}

.close-modal:hover {
  color: #ff4444;
}

.modal-content form {
  padding: 22px 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-secondary, #9ea344);
  font-size: 0.9rem;
  font-weight: 600;
}

.form-select, .form-input {
  width: 100%;
  padding: 12px 14px;
  background: var(--color-panel-light, #2a2a2a);
  border: 1px solid rgba(128, 131, 42, 0.3);
  border-radius: 8px;
  color: var(--color-text, #ffffff);
  font-size: 0.9rem;
}

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  background: var(--color-panel-light, #2a2a2a);
  border: 1px solid rgba(128, 131, 42, 0.3);
  border-radius: 8px;
  color: var(--color-text, #ffffff);
  font-size: 0.9rem;
  resize: vertical;
  font-family: inherit;
}

.form-select:focus, .form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #07660c);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid rgba(128, 131, 42, 0.2);
}

.btn-cancel {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(128, 131, 42, 0.4);
  border-radius: 8px;
  color: var(--color-text-muted, #aaa);
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-cancel:hover {
  border-color: #ff4444;
  color: #ff4444;
}

.btn-submit {
  padding: 10px 24px;
  background: var(--color-primary, #07660c);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-submit:hover:not(:disabled) {
  background: var(--color-primary-hover, #0a8a10);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .topic-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  
  .topic-right {
    width: 100%;
    justify-content: flex-start;
  }
  
  .topic-last {
    text-align: left;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .forum-title {
    font-size: 1.8rem;
  }
  
  .search-section {
    flex-direction: column;
    align-items: center;
  }
  
  .search-input {
    max-width: none;
    width: 100%;
  }
  
  .topics-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>