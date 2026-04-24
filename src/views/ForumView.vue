<template>
  <div class="forum-page">
    <div class="container">
      <!-- Заголовок -->
      <div class="forum-header">
        <h1>📚 Форум Forgotten Team</h1>
        <p class="forum-description">Обсуждайте мангу, делитесь мнениями и находите единомышленников</p>
        
        <div class="forum-controls">
          <div class="search-container">
            <input 
              v-model="searchQuery" 
              @input="onSearchInput"
              @keyup.enter="performSearch"
              type="text" 
              placeholder="Поиск по форуму..." 
              class="search-input"
            />
            <button @click="performSearch" class="search-btn">🔍</button>
          </div>
          
          <div class="controls-right">
            <button 
              v-if="authStore.isLoggedIn" 
              @click="showNewTopicModal = true"
              class="new-topic-btn"
            >
              📝 Новая тема
            </button>
            <button @click="toggleViewMode" class="view-toggle">
              {{ viewMode === 'categories' ? '📋 Последние темы' : '📁 Категории' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Баннер верификации email -->
      <div v-if="authStore.isLoggedIn && !authStore.user?.emailVerified" class="verification-banner">
        <span>⚠️ Чтобы создавать темы, подтвердите Email.</span>
        <router-link to="/verify-email" class="verify-link">Подтвердить</router-link>
      </div>
      
      <!-- Основной контент -->
      <div class="forum-content">
        <!-- Боковая панель -->
        <aside class="forum-sidebar">
          <div class="stats-card">
            <h3>📊 Статистика форума</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Категорий</span>
                <span class="stat-value">{{ categories.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Тем</span>
                <span class="stat-value">{{ totalTopics }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Сообщений</span>
                <span class="stat-value">{{ totalPosts }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Пользователей</span>
                <span class="stat-value">{{ totalUsers }}</span>
              </div>
            </div>
          </div>
          
          <div class="online-card">
            <h3>👥 Онлайн сейчас</h3>
            <div class="online-users">
              <div v-for="user in onlineUsers" :key="user.id" class="online-user">
                <div class="user-avatar">{{ getInitials(user.username) }}</div>
                <span class="username">{{ user.username }}</span>
                <span class="user-role" :class="user.role">{{ user.role }}</span>
              </div>
            </div>
            <div class="online-count">
              Всего онлайн: <strong>{{ onlineUsers.length }}</strong>
            </div>
          </div>
          
          <div class="popular-topics">
            <h3>🔥 Популярные темы</h3>
            <div class="topics-list">
              <div 
                v-for="topic in popularTopics" 
                :key="topic.id"
                @click="goToTopic(topic.id)"
                class="popular-topic"
              >
                <span class="topic-title">{{ truncateText(topic.title, 40) }}</span>
                <div class="topic-stats">
                  <span class="stat">👁 {{ topic.views || 0 }}</span>
                  <span class="stat">💬 {{ topic.posts_count || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
        
        <!-- Основная область -->
        <main class="forum-main">
          <!-- Навигация -->
          <div class="forum-navigation">
            <nav class="breadcrumbs">
              <router-link to="/" class="breadcrumb">Главная</router-link>
              <span class="separator">/</span>
              <span class="breadcrumb active">Форум</span>
            </nav>
            
            <div class="sort-controls">
              <select v-model="sortBy" @change="changeSort" class="sort-select">
                <option value="recent">Сначала новые</option>
                <option value="popular">Популярные</option>
                <option value="updated">Обновлённые</option>
              </select>
            </div>
          </div>
          
          <!-- Категории -->
          <div v-if="viewMode === 'categories'" class="categories-grid">
            <div 
              v-for="category in categories" 
              :key="category.id" 
              class="category-card"
              @click="goToCategory(category.id)"
            >
              <div class="category-header">
                <div class="category-icon">{{ getCategoryIcon(category.name) }}</div>
                <div class="category-info">
                  <h3 class="category-name">{{ category.name }}</h3>
                  <p class="category-description">{{ category.description || 'Обсуждение' }}</p>
                </div>
              </div>
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
              </div>
            </div>
          </div>
          
          <!-- Список тем -->
          <div v-else class="topics-list-container">
            <div class="topics-header">
              <h2>Последние обсуждения</h2>
            </div>
            
            <div v-if="loading" class="loading-state">
              <div class="spinner"></div>
              <p>Загрузка тем...</p>
            </div>
            
            <div v-else-if="topics.length === 0" class="empty-state">
              <div class="empty-icon">💬</div>
              <h3>Темы не найдены</h3>
              <p>Будьте первым, кто создаст тему!</p>
              <button 
                v-if="authStore.isLoggedIn"
                @click="showNewTopicModal = true"
                class="create-topic-btn"
              >
                Создать тему
              </button>
            </div>
            
            <div v-else class="topics-list">
              <div 
                v-for="topic in topics" 
                :key="topic.id" 
                class="topic-card"
                @click="goToTopic(topic.id)"
              >
                <div class="topic-status">
                  <span v-if="topic.is_pinned" class="status-icon pinned">📌</span>
                  <span v-else class="status-icon default">💬</span>
                </div>
                <div class="topic-main">
                  <h4 class="topic-title">{{ topic.title }}</h4>
                  <div class="topic-meta">
                    <span class="topic-author">👤 {{ topic.author_name || 'Аноним' }}</span>
                    <span class="topic-date">📅 {{ formatDate(topic.created_at) }}</span>
                    <span class="topic-category">📁 {{ topic.category_name || 'Без категории' }}</span>
                  </div>
                </div>
                <div class="topic-stats">
                  <div class="stat">👁 {{ topic.views || 0 }}</div>
                  <div class="stat">💬 {{ topic.posts_count || 0 }}</div>
                </div>
              </div>
            </div>
            
            <!-- Пагинация -->
            <Pagination 
              v-if="totalPages > 1"
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-change="changePage"
            />
          </div>
        </main>
      </div>
      
      <!-- Баннер для неавторизованных -->
      <div v-if="!authStore.isLoggedIn" class="cta-banner">
        <div class="cta-content">
          <h3>Присоединяйтесь к обсуждению!</h3>
          <p>Зарегистрируйтесь, чтобы создавать темы и отвечать на сообщения</p>
          <div class="cta-buttons">
            <router-link to="/register" class="btn-primary">Зарегистрироваться</router-link>
            <router-link to="/login" class="btn-secondary">Войти</router-link>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно создания темы -->
    <NewTopicModal 
      v-if="showNewTopicModal"
      :categories="categories"
      @close="showNewTopicModal = false"
      @create="handleCreateTopic"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { forumAPI } from '@/api';
import Pagination from '@/components/catalog/Pagination.vue';
import NewTopicModal from '@/components/forum/NewTopicModal.vue';

const router = useRouter();
const authStore = useAuthStore();

const categories = ref([]);
const topics = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const viewMode = ref('categories');
const sortBy = ref('recent');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showNewTopicModal = ref(false);

// Статистика (заглушка)
const totalTopics = ref(42);
const totalPosts = ref(156);
const totalUsers = ref(89);
const onlineUsers = ref([
  { id: 1, username: 'Admin', role: 'admin' },
  { id: 2, username: 'МангаЛюб', role: 'moderator' },
  { id: 3, username: 'Читатель_42', role: 'user' },
]);

const popularTopics = ref([
  { id: 1, title: 'Любимая манга и почему?', views: 450, posts_count: 89 },
  { id: 2, title: 'Новинки этой недели', views: 320, posts_count: 45 },
  { id: 3, title: 'Проблемы с загрузкой глав', views: 189, posts_count: 23 },
]);

const totalPages = computed(() => Math.ceil(totalTopics.value / itemsPerPage.value));

const getCategoryIcon = (name) => {
  const icons = { Манга: '📚', Аниме: '🎬', Новости: '📰', Обсуждения: '💬' };
  return icons[name] || '📁';
};

const getInitials = (name) => name?.charAt(0).toUpperCase() || '?';

const truncateText = (text, max) => text?.length > max ? text.slice(0, max) + '…' : text;

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн. назад`;
  return d.toLocaleDateString('ru-RU');
};

const loadCategories = async () => {
  try {
    const data = await forumAPI.getCategories();
    categories.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Ошибка загрузки категорий:', err);
  }
};

const loadTopics = async () => {
  loading.value = true;
  try {
    const params = { page: currentPage.value, limit: itemsPerPage.value, sort: sortBy.value };
    if (searchQuery.value) params.search = searchQuery.value;
    const data = await forumAPI.getTopics(params);
    topics.value = data.topics || [];
    totalTopics.value = data.total || topics.value.length;
  } catch (err) {
    console.error('Ошибка загрузки тем:', err);
  } finally {
    loading.value = false;
  }
};

const goToCategory = (id) => {
  router.push(`/forum/category/${id}`);
};

const goToTopic = (id) => {
  router.push(`/forum/topic/${id}`);
};

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'categories' ? 'topics' : 'categories';
  if (viewMode.value === 'topics') loadTopics();
};

const changeSort = () => {
  currentPage.value = 1;
  loadTopics();
};

const changePage = (page) => {
  currentPage.value = page;
  loadTopics();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const performSearch = () => {
  currentPage.value = 1;
  if (viewMode.value === 'topics') loadTopics();
};

const onSearchInput = () => {
  if (searchQuery.value.length > 2) performSearch();
};

const handleCreateTopic = async (data) => {
  if (!authStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  if (!authStore.user.emailVerified) {
    alert('Подтвердите email для создания темы');
    return;
  }
  try {
    await forumAPI.createTopic(data);
    showNewTopicModal.value = false;
    viewMode.value = 'topics';
    await loadTopics();
  } catch (err) {
    console.error('Ошибка создания темы:', err);
  }
};

onMounted(() => {
  loadCategories();
  if (viewMode.value === 'topics') loadTopics();
});
</script>

<style scoped>
.forum-page {
  background: #000000;
  color: #ffffff;
  min-height: 100vh;
  padding: 40px 0;
}
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}
.forum-header {
  margin-bottom: 40px;
}
.forum-header h1 {
  font-size: 2.5rem;
  color: #07660C;
  text-align: center;
  margin-bottom: 10px;
}
.forum-description {
  text-align: center;
  color: #80832A;
  margin-bottom: 30px;
  font-size: 1.1rem;
}
.forum-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
}
.search-container {
  flex: 1;
  max-width: 500px;
  position: relative;
}
.search-input {
  width: 100%;
  padding: 12px 20px;
  padding-right: 60px;
  background: #202020;
  border: 2px solid #80832A;
  border-radius: 50px;
  color: #fff;
  font-size: 1rem;
}
.search-input:focus {
  outline: none;
  border-color: #07660C;
}
.search-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: #07660C;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
}
.controls-right {
  display: flex;
  gap: 15px;
}
.new-topic-btn, .view-toggle {
  background: rgba(255,255,255,0.1);
  border: 1px solid #80832A;
  color: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.new-topic-btn {
  background: #07660C;
  border-color: #07660C;
}
.new-topic-btn:hover, .view-toggle:hover {
  background: #80832A;
  color: black;
}

/* Баннер верификации */
.verification-banner {
  background: rgba(255,165,0,0.15);
  border: 1px solid #ffaa00;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.verify-link {
  background: #07660c;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  text-decoration: none;
}

.forum-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
}
.forum-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.stats-card, .online-card, .popular-topics {
  background: #202020;
  padding: 20px;
  border-radius: 12px;
}
.stats-card h3, .online-card h3, .popular-topics h3 {
  color: #07660C;
  margin-bottom: 15px;
  font-size: 1.2rem;
}
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
.stat-item {
  background: #2B2B2B;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
}
.stat-label {
  color: #80832A;
  font-size: 0.8rem;
  display: block;
}
.stat-value {
  font-size: 1.3rem;
  font-weight: 600;
}
.online-users {
  margin-bottom: 15px;
}
.online-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #2B2B2B;
}
.user-avatar {
  width: 32px;
  height: 32px;
  background: #07660C;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.username {
  flex: 1;
}
.user-role {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
}
.user-role.admin { background: #ff4444; }
.user-role.moderator { background: #ffaa00; }
.user-role.user { background: #80832A; }
.online-count {
  text-align: center;
  font-size: 0.9rem;
  color: #80832A;
}
.popular-topic {
  padding: 10px;
  background: #2B2B2B;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.popular-topic:hover {
  background: #333;
  transform: translateX(5px);
}
.topic-title {
  display: block;
  margin-bottom: 5px;
}
.topic-stats {
  display: flex;
  gap: 10px;
  font-size: 0.8rem;
  color: #80832A;
}
.forum-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.forum-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #202020;
  border-radius: 12px;
}
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
}
.breadcrumb {
  color: #80832A;
  text-decoration: none;
}
.breadcrumb.active {
  color: #fff;
  font-weight: 600;
}
.sort-select {
  background: #2B2B2B;
  border: 1px solid #80832A;
  border-radius: 6px;
  color: #fff;
  padding: 8px 12px;
}

/* ========== КАТЕГОРИИ В СТОЛБИК ========== */
.categories-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-card {
  background: #202020;
  border: 1px solid #2B2B2B;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}
.category-card:hover {
  transform: translateY(-4px);
  border-color: #07660C;
}
.category-header {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}
.category-icon {
  font-size: 2rem;
}
.category-name {
  color: #07660C;
  margin-bottom: 5px;
}
.category-description {
  color: #80832A;
  font-size: 0.9rem;
}
.category-stats {
  display: flex;
  gap: 20px;
  padding-top: 15px;
  border-top: 1px solid #2B2B2B;
}

.topics-list-container {
  background: #202020;
  border-radius: 12px;
  overflow: hidden;
}
.topics-header {
  padding: 20px;
  border-bottom: 2px solid #07660C;
}
.topics-list {
  padding: 10px;
}
.topic-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #2B2B2B;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.topic-card:hover {
  background: #333;
  transform: translateX(5px);
}
.topic-status {
  font-size: 1.5rem;
}
.topic-main {
  flex: 1;
}
.topic-title {
  margin: 0 0 8px;
  font-size: 1rem;
}
.topic-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 0.8rem;
  color: #80832A;
}
.topic-stats {
  display: flex;
  gap: 15px;
  color: #80832A;
  font-size: 0.9rem;
}
.loading-state, .empty-state {
  text-align: center;
  padding: 60px;
}
.spinner {
  border: 4px solid #2B2B2B;
  border-top: 4px solid #07660C;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}
.create-topic-btn {
  background: #07660C;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  margin-top: 20px;
  cursor: pointer;
}
.cta-banner {
  margin-top: 50px;
  background: linear-gradient(135deg, #07660C 0%, #80832A 100%);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
}
.cta-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 20px;
}
.btn-primary {
  background: white;
  color: #07660C;
  padding: 12px 24px;
  border-radius: 30px;
  text-decoration: none;
  font-weight: 600;
}
.btn-secondary {
  background: transparent;
  border: 2px solid white;
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
  text-decoration: none;
  font-weight: 600;
}
@media (max-width: 992px) {
  .forum-content { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .forum-controls { flex-direction: column; align-items: stretch; }
  .search-container { max-width: 100%; }
  .controls-right { justify-content: space-between; }
  .topic-card { flex-wrap: wrap; }
  .topic-stats { margin-left: auto; }
}
</style>