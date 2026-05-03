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
              type="text" 
              placeholder="Поиск по форуму..." 
              class="search-input" 
              @keyup.enter="performSearch" 
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
    <div v-if="showNewTopicModal" class="modal-overlay" @click.self="showNewTopicModal = false">
      <div class="modal-content">
        <h2>Создание новой темы</h2>
        <form @submit.prevent="handleCreateTopic">
          <div class="form-group">
            <label>Заголовок темы *</label>
            <input v-model="newTopicTitle" required placeholder="Введите заголовок" maxlength="200" />
          </div>
          <div class="form-group">
            <label>Категория *</label>
            <select v-model="newTopicCategoryId" required>
              <option value="">Выберите категорию</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Содержимое *</label>
            <textarea v-model="newTopicContent" required placeholder="Опишите вашу тему..." rows="6"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="showNewTopicModal = false" class="cancel-btn">Отмена</button>
            <button type="submit" :disabled="!newTopicTitle.trim() || !newTopicContent.trim()" class="submit-btn">Создать тему</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { forumAPI } from '@/api';
import Pagination from '@/components/catalog/Pagination.vue';

const router = useRouter();
const authStore = useAuthStore();

const searchQuery = ref('');
const viewMode = ref('categories');
const sortBy = ref('recent');
const currentPage = ref(1);
const itemsPerPage = 10;
const showNewTopicModal = ref(false);
const newTopicTitle = ref('');
const newTopicCategoryId = ref('');
const newTopicContent = ref('');

const categories = ref([]);
const topics = ref([]);
const loading = ref(false);
const totalTopics = computed(() => topics.value.length);
const totalPosts = computed(() => categories.value.reduce((sum, cat) => sum + (cat.posts_count || 0), 0));
const totalUsers = ref(89);
const onlineUsers = ref([
  { id: 1, username: 'Admin', role: 'admin' },
  { id: 2, username: 'МангаЛюб', role: 'moderator' },
  { id: 3, username: 'Читатель_42', role: 'user' },
]);

const popularTopics = ref([]);
const totalPages = computed(() => Math.ceil(topics.value.length / itemsPerPage));

const getCategoryIcon = (name) => {
  const icons = { 'Обсуждение манги': '📚', 'Новости и анонсы': '📰' };
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
    const params = { page: currentPage.value, limit: itemsPerPage, sort: sortBy.value };
    if (searchQuery.value) params.search = searchQuery.value;
    const data = await forumAPI.getTopics(params);
    topics.value = data.topics || [];
  } catch (err) {
    console.error('Ошибка загрузки тем:', err);
  } finally {
    loading.value = false;
  }
};

const performSearch = () => {
  currentPage.value = 1;
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

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'categories' ? 'topics' : 'categories';
  if (viewMode.value === 'topics') loadTopics();
};

const goToCategory = (id) => {
  router.push(`/forum/category/${id}`);
};

const goToTopic = (id) => {
  router.push(`/forum/topic/${id}`);
};

const handleCreateTopic = async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  if (!authStore.user.emailVerified) {
    alert('Подтвердите email для создания темы');
    return;
  }
  try {
    await forumAPI.createTopic({
      title: newTopicTitle.value,
      content: newTopicContent.value,
      categoryId: newTopicCategoryId.value
    });
    showNewTopicModal.value = false;
    viewMode.value = 'topics';
    newTopicTitle.value = '';
    newTopicContent.value = '';
    newTopicCategoryId.value = '';
    await loadTopics();
  } catch (err) {
    console.error('Ошибка создания темы:', err);
    alert('Ошибка создания темы');
  }
};

onMounted(() => {
  loadCategories();
  if (viewMode.value === 'topics') loadTopics();
  // загружаем популярные темы (просто первые 3 из API для демо)
  forumAPI.getPopularTopics(3).then(data => popularTopics.value = data || []).catch(() => {});
});
</script>

<style scoped>
/* Использованы глобальные переменные, цвета стали светлее */
.forum-page { background: var(--color-background); color: var(--color-text); min-height: 100vh; padding: 30px 0; }
.container { max-width: 1400px; margin: 0 auto; padding: 0 20px; }
.forum-header { margin-bottom: 30px; }
.forum-header h1 { color: var(--color-primary); text-align: center; font-size: 2.5rem; margin-bottom: 10px; }
.forum-description { text-align: center; color: var(--color-secondary); margin-bottom: 20px; font-size: 1.1rem; }
.forum-controls { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 20px; }
.search-container { flex: 1; max-width: 500px; display: flex; gap: 8px; }
.search-input { flex: 1; padding: 10px 15px; background: var(--color-panel); border: 1px solid var(--color-secondary); border-radius: 20px; color: white; }
.search-btn { background: var(--color-primary); border: none; color: white; border-radius: 20px; padding: 10px 20px; cursor: pointer; }
.controls-right { display: flex; gap: 10px; }
.new-topic-btn, .view-toggle { background: var(--color-panel-light); border: 1px solid var(--color-secondary); color: white; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background 0.2s; }
.new-topic-btn { background: var(--color-primary); border-color: var(--color-primary); }
.new-topic-btn:hover { background: var(--color-primary-hover); }
.view-toggle:hover { background: var(--color-secondary); color: var(--color-background); }

.verification-banner { background: rgba(255,165,0,0.15); border: 1px solid #ffaa00; padding: 10px 15px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
.verify-link { background: var(--color-primary); color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; }

.forum-content { display: grid; grid-template-columns: 280px 1fr; gap: 25px; }
.forum-sidebar { display: flex; flex-direction: column; gap: 20px; }
.stats-card, .online-card, .popular-topics { background: var(--color-panel); padding: 20px; border-radius: 10px; }
.stats-card h3, .online-card h3, .popular-topics h3 { color: var(--color-primary); margin-bottom: 15px; font-size: 1.2rem; }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.stat-item { background: var(--color-panel-light); padding: 10px; border-radius: 8px; text-align: center; }
.stat-label { color: var(--color-text-muted); font-size: 0.8rem; display: block; }
.stat-value { font-size: 1.2rem; font-weight: 600; }
.online-users { margin-bottom: 10px; }
.online-user { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--color-border); }
.user-avatar { width: 30px; height: 30px; background: var(--color-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; }
.username { flex: 1; }
.user-role { font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; }
.user-role.admin { background: #ff4444; color: white; }
.user-role.moderator { background: #ffaa00; color: black; }
.user-role.user { background: var(--color-secondary); color: white; }
.online-count { text-align: center; color: var(--color-text-muted); font-size: 0.9rem; }
.popular-topic { padding: 8px 10px; background: var(--color-panel-light); border-radius: 6px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s; }
.popular-topic:hover { background: var(--color-secondary); }
.topic-title { display: block; margin-bottom: 4px; }
.topic-stats { display: flex; gap: 10px; font-size: 0.8rem; color: var(--color-text-muted); }

.forum-main { background: var(--color-panel); border-radius: 10px; padding: 20px; }
.forum-navigation { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.breadcrumbs { display: flex; gap: 8px; }
.breadcrumb { color: var(--color-secondary); text-decoration: none; }
.breadcrumb.active { color: white; font-weight: 600; }
.sort-select { background: var(--color-panel-light); border: 1px solid var(--color-secondary); border-radius: 6px; color: white; padding: 8px 12px; }

.categories-grid { display: flex; flex-direction: column; gap: 15px; }
.category-card { background: var(--color-panel-light); border-radius: 10px; padding: 15px 20px; cursor: pointer; transition: transform 0.2s; border: 1px solid transparent; }
.category-card:hover { transform: translateY(-2px); border-color: var(--color-primary); }
.category-header { display: flex; gap: 15px; align-items: center; margin-bottom: 10px; }
.category-icon { font-size: 2rem; }
.category-name { color: var(--color-primary); margin: 0 0 5px; }
.category-description { color: var(--color-text-muted); font-size: 0.9rem; }
.category-stats { display: flex; gap: 20px; }
.category-stats .stat-item { background: none; padding: 0; display: flex; gap: 5px; align-items: center; }
.category-stats .stat-value { font-size: 1rem; }

.topics-list-container { }
.topics-header h2 { color: var(--color-primary); margin-bottom: 15px; }
.topics-list { display: flex; flex-direction: column; gap: 10px; }
.topic-card { background: var(--color-panel-light); border-radius: 8px; padding: 12px 15px; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: background 0.2s; }
.topic-card:hover { background: var(--color-panel); }
.topic-status { font-size: 1.5rem; }
.topic-main { flex: 1; }
.topic-title { font-size: 1rem; margin-bottom: 5px; }
.topic-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 0.8rem; color: var(--color-text-muted); }
.topic-stats { display: flex; gap: 15px; color: var(--color-text-muted); font-size: 0.9rem; }

.loading-state, .empty-state { text-align: center; padding: 40px; }
.spinner { border: 3px solid var(--color-panel-light); border-top: 3px solid var(--color-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite; margin: 0 auto 15px; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 3rem; margin-bottom: 10px; }
.create-topic-btn { background: var(--color-primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 15px; }

.cta-banner { margin-top: 40px; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%); border-radius: 12px; padding: 30px; text-align: center; }
.cta-buttons { display: flex; gap: 15px; justify-content: center; margin-top: 20px; }
.btn-primary { background: white; color: var(--color-primary); padding: 10px 24px; border-radius: 20px; text-decoration: none; font-weight: 600; }
.btn-secondary { background: transparent; border: 2px solid white; color: white; padding: 10px 24px; border-radius: 20px; text-decoration: none; font-weight: 600; }

/* Модальное окно */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: var(--color-panel); padding: 25px; border-radius: 10px; width: 90%; max-width: 600px; }
.modal-content h2 { color: var(--color-primary); margin-bottom: 20px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; color: var(--color-secondary); }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; background: var(--color-panel-light); border: 1px solid var(--color-secondary); border-radius: 6px; color: white; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.cancel-btn { background: transparent; border: 1px solid var(--color-secondary); color: var(--color-secondary); padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.submit-btn { background: var(--color-primary); border: none; color: white; padding: 8px 20px; border-radius: 6px; cursor: pointer; }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 768px) {
  .forum-content { grid-template-columns: 1fr; }
  .forum-controls { flex-direction: column; }
  .search-container { max-width: 100%; }
}
</style>