<template>
  <div class="forum-category-page">
    <div class="container">
      <!-- Заголовок категории -->
      <div class="category-header">
        <button class="back-btn" @click="$router.back()">← Назад</button>
        <h1>{{ category?.name || 'Категория' }}</h1>
        <p class="category-description">{{ category?.description }}</p>
      </div>

      <!-- Управление -->
      <div class="category-controls">
        <div class="search-container">
          <input v-model="searchQuery" @input="onSearch" placeholder="Поиск в категории..." class="search-input" />
          <button @click="searchTopics" class="search-btn">🔍</button>
        </div>
        <button v-if="authStore.isLoggedIn" @click="showNewTopicModal = true" class="new-topic-btn">
          📝 Создать тему
        </button>
      </div>

      <!-- Список тем -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка тем...</p>
      </div>

      <div v-else-if="topics.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>В этой категории пока нет тем</h3>
        <p>Будьте первым, кто создаст тему!</p>
      </div>

      <div v-else class="topics-list">
        <div v-for="topic in topics" :key="topic.id" class="topic-card" @click="goToTopic(topic.id)">
          <div class="topic-status">
            <span v-if="topic.is_pinned" class="status-icon pinned">📌</span>
            <span v-else-if="topic.is_locked" class="status-icon locked">🔒</span>
            <span v-else class="status-icon default">💬</span>
          </div>
          <div class="topic-main">
            <h3 class="topic-title">{{ topic.title }}</h3>
            <div class="topic-meta">
              <span>👤 {{ topic.author_name || 'Аноним' }}</span>
              <span>📅 {{ formatDate(topic.created_at) }}</span>
              <span>👁 {{ topic.views || 0 }} просмотров</span>
            </div>
          </div>
          <div class="topic-stats">
            <div class="stat">💬 {{ topic.posts_count || 0 }}</div>
            <div class="stat">❤ {{ topic.likes_count || 0 }}</div>
          </div>
        </div>
      </div>

      <!-- Пагинация -->
      <Pagination v-if="totalPages > 1" :current-page="currentPage" :total-pages="totalPages" @page-change="changePage" />

      <!-- Модальное окно создания темы -->
      <NewTopicModal v-if="showNewTopicModal" :categories="[category]" @close="showNewTopicModal = false" @create="handleCreateTopic" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { forumAPI } from '@/api';
import Pagination from '@/components/catalog/Pagination.vue';
import NewTopicModal from '@/components/forum/NewTopicModal.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const category = ref(null);
const topics = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(20);
const showNewTopicModal = ref(false);
const totalTopics = ref(0);
const totalPages = ref(1);

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

const loadCategory = async () => {
  try {
    const categories = await forumAPI.getCategories();
    const id = parseInt(route.params.id);
    category.value = categories.find(c => c.id === id);
  } catch (err) {
    console.error(err);
  }
};

const loadTopics = async () => {
  loading.value = true;
  try {
    const params = {
      categoryId: route.params.id,
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value
    };
    const data = await forumAPI.getTopics(params);
    topics.value = data.topics || [];
    totalTopics.value = data.total || 0;
    totalPages.value = Math.ceil(totalTopics.value / itemsPerPage.value);
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const goToTopic = (id) => {
  router.push(`/forum/topic/${id}`);
};

const changePage = (page) => {
  currentPage.value = page;
  loadTopics();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const onSearch = () => {
  currentPage.value = 1;
  loadTopics();
};

const searchTopics = () => {
  loadTopics();
};

const handleCreateTopic = async (data) => {
  try {
    await forumAPI.createTopic({ ...data, categoryId: route.params.id });
    showNewTopicModal.value = false;
    await loadTopics();
  } catch (err) {
    console.error(err);
    alert('Ошибка создания темы');
  }
};

onMounted(() => {
  loadCategory();
  loadTopics();
});
</script>

<style scoped>
.forum-category-page {
  background: #000000;
  color: #ffffff;
  min-height: 100vh;
  padding: 40px 0;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
.back-btn {
  background: none;
  border: none;
  color: #80832A;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 20px;
}
.back-btn:hover {
  color: #07660C;
}
.category-header h1 {
  font-size: 2rem;
  color: #07660C;
  margin-bottom: 10px;
}
.category-description {
  color: #80832A;
  margin-bottom: 30px;
}
.category-controls {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}
.search-container {
  flex: 1;
  max-width: 400px;
  position: relative;
}
.search-input {
  width: 100%;
  padding: 10px 15px;
  padding-right: 45px;
  background: #202020;
  border: 1px solid #80832A;
  border-radius: 30px;
  color: #fff;
}
.search-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #80832A;
  cursor: pointer;
  font-size: 1.2rem;
}
.new-topic-btn {
  background: #07660C;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
}
.topics-list {
  background: #202020;
  border-radius: 12px;
  overflow: hidden;
}
.topic-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid #2B2B2B;
  cursor: pointer;
  transition: background 0.2s;
}
.topic-card:hover {
  background: #2B2B2B;
}
.topic-status {
  font-size: 1.5rem;
}
.topic-main {
  flex: 1;
}
.topic-title {
  margin: 0 0 8px;
  font-size: 1.1rem;
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
  text-align: center;
}
.loading-state, .empty-state {
  text-align: center;
  padding: 60px;
  background: #202020;
  border-radius: 12px;
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
</style>