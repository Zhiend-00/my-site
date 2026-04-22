<template>
  <div class="home">
    <div class="container">
      <!-- Верхняя часть: заголовок и поиск -->
      <h1 class="page-title">Forgotten Team</h1>
      <div class="search-section">
        <input
          v-model="searchQuery"
          @keyup.enter="goToSearch"
          type="text"
          placeholder="Найти мангу..."
          class="search-input"
        />
        <button @click="goToSearch" class="search-btn">Найти</button>
      </div>

      <!-- Основной контент: боковая панель и центральная колонка на одном уровне -->
      <div class="home-layout">
        <!-- Левая боковая панель (уже) -->
        <aside class="home-sidebar">
          <!-- Прогресс чтения (только для авторизованных) -->
          <div v-if="authStore.isLoggedIn" class="sidebar-block">
            <h3>Прогресс чтения</h3>
            <div v-if="recentProgress.length === 0" class="empty-block">Нет недавней активности</div>
            <div v-else class="progress-list">
              <div v-for="item in recentProgress" :key="item.mangaId" class="progress-item">
                <router-link :to="`/manga/${item.mangaId}`" class="progress-link">
                  <img :src="getCoverUrl(item.cover)" class="progress-thumb" />
                  <div class="progress-info">
                    <span class="manga-title">{{ item.mangaTitle }}</span>
                    <span class="chapter-info">Гл. {{ item.chapterNumber }} · стр. {{ item.pageNumber }}</span>
                  </div>
                </router-link>
              </div>
            </div>
          </div>

          <!-- Новые сообщения форума -->
          <div class="sidebar-block">
            <h3>Новые на форуме</h3>
            <div v-if="latestForumPosts.length === 0" class="empty-block">Нет сообщений</div>
            <div v-else class="forum-posts-list">
              <div v-for="post in latestForumPosts" :key="post.id" class="forum-post-item">
                <router-link :to="`/forum/topic/${post.topicId}`" class="post-link">
                  <span class="post-topic">{{ post.topicTitle }}</span>
                  <span class="post-author">{{ post.authorName }}</span>
                  <span class="post-time">{{ formatTimeAgo(post.createdAt) }}</span>
                </router-link>
              </div>
            </div>
          </div>

          <!-- Популярные темы форума -->
          <div class="sidebar-block">
            <h3>Популярные темы</h3>
            <div v-if="popularTopics.length === 0" class="empty-block">Нет тем</div>
            <div v-else class="popular-topics-list">
              <div v-for="topic in popularTopics" :key="topic.id" class="topic-item">
                <router-link :to="`/forum/topic/${topic.id}`" class="topic-link">
                  <span class="topic-title">{{ topic.title }}</span>
                  <span class="topic-stats">{{ topic.postsCount }} отв.</span>
                </router-link>
              </div>
            </div>
          </div>
        </aside>

        <!-- Центральная колонка с контентом -->
        <div class="home-main">
          <section class="manga-section">
            <h2>Популярное сейчас</h2>
            <div v-if="isLoading" class="skeleton-grid">
              <div v-for="n in 5" :key="n" class="skeleton-card"></div>
            </div>
            <div v-else-if="error" class="error-message">
              <p>Ошибка загрузки</p>
              <button @click="retryLoading" class="retry-btn">Повторить</button>
            </div>
            <div v-else class="manga-grid">
              <div v-for="manga in popularManga" :key="manga.id" class="manga-card">
                <router-link :to="`/manga/${manga.slug || manga.id}`" class="manga-link">
                  <div class="manga-cover">
                    <img :src="getCoverUrl(manga.cover_image)" :alt="manga.title" @error="handleImageError" />
                  </div>
                  <div class="manga-info">
                    <h3>{{ manga.title }}</h3>
                    <div class="manga-meta">
                      <span class="rating">{{ formatRating(manga.rating) }}</span>
                      <span class="views">{{ formatNumber(manga.views) }}</span>
                    </div>
                  </div>
                </router-link>
              </div>
            </div>
          </section>

          <section class="manga-section">
            <h2>Новинки</h2>
            <div v-if="isLoading" class="skeleton-grid">
              <div v-for="n in 5" :key="n" class="skeleton-card"></div>
            </div>
            <div v-else-if="error" class="error-message">
              <p>Ошибка загрузки</p>
              <button @click="retryLoading" class="retry-btn">Повторить</button>
            </div>
            <div v-else class="manga-grid">
              <div v-for="manga in newManga" :key="manga.id" class="manga-card">
                <router-link :to="`/manga/${manga.slug || manga.id}`" class="manga-link">
                  <div class="manga-cover">
                    <img :src="getCoverUrl(manga.cover_image)" :alt="manga.title" @error="handleImageError" />
                  </div>
                  <div class="manga-info">
                    <h3>{{ manga.title }}</h3>
                    <p class="new-date">{{ formatDate(manga.created_at) }}</p>
                  </div>
                </router-link>
              </div>
            </div>
          </section>

          <div class="catalog-link">
            <router-link to="/catalog" class="btn-primary">Весь каталог</router-link>
          </div>
        </div>
      </div>

      <!-- Форма обратной связи (широкая, по центру) -->
      <div class="feedback-section">
        <div class="feedback-card">
          <h3>Связь с администрацией</h3>
          <form @submit.prevent="submitFeedback" class="feedback-form">
            <div class="form-row">
              <input v-model="feedback.name" type="text" placeholder="Ваше имя" required />
              <input v-model="feedback.email" type="email" placeholder="Email" required />
            </div>
            <textarea v-model="feedback.message" placeholder="Сообщение" rows="4" required></textarea>
            <button type="submit" :disabled="feedbackSending" class="submit-btn">
              {{ feedbackSending ? 'Отправка...' : 'Отправить' }}
            </button>
          </form>
          <p v-if="feedbackSuccess" class="success-msg">Сообщение отправлено!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMangaStore } from '@/stores/manga'
import { useAuthStore } from '@/stores/auth'
import { getCoverUrl, handleImageError } from '@/utils/imageHelper'
import { forumAPI, feedbackAPI, progressAPI, mangaAPI } from '@/api'

const router = useRouter()
const mangaStore = useMangaStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const isLoading = computed(() => mangaStore.isLoading)
const error = computed(() => mangaStore.error)
const mangaList = computed(() => mangaStore.mangaList)

const popularManga = computed(() =>
  [...mangaList.value].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
)
const newManga = computed(() =>
  [...mangaList.value]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
)

// Данные боковой панели
const recentProgress = ref([])
const latestForumPosts = ref([])
const popularTopics = ref([])

// Обратная связь
const feedback = ref({ name: '', email: '', message: '' })
const feedbackSending = ref(false)
const feedbackSuccess = ref(false)

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K'
  return num.toString()
}
const formatRating = (rating) => (rating ? rating.toFixed(1) : '0.0')
const formatDate = (date) => (date ? new Date(date).toLocaleDateString('ru-RU') : '')
const formatTimeAgo = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'сегодня'
  if (days === 1) return 'вчера'
  return `${days} дн. назад`
}

const goToSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/catalog', query: { search: searchQuery.value.trim() } })
  }
}
const retryLoading = () => mangaStore.fetchAllManga()

// Загрузка данных для боковой панели
const loadSidebarData = async () => {
  // Прогресс чтения (если авторизован)
  if (authStore.isLoggedIn) {
    try {
      const progressData = await progressAPI.list()
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const filtered = (progressData || []).filter((p) => new Date(p.updatedAt) >= threeDaysAgo)
      const enriched = await Promise.all(
        filtered.slice(0, 3).map(async (p) => {
          try {
            const manga = await mangaAPI.get(p.mangaId)
            return {
              ...p,
              mangaTitle: manga.title,
              cover: manga.coverImage || manga.cover_image,
            }
          } catch {
            return { ...p, mangaTitle: 'Манга', cover: null }
          }
        })
      )
      recentProgress.value = enriched
    } catch (e) {
      console.warn('Прогресс не загружен', e)
    }
  }

  // Новые сообщения форума
  try {
    const posts = await forumAPI.getRecentPosts(5)
    latestForumPosts.value = posts || []
  } catch (e) {
    console.warn('Сообщения форума не загружены', e)
  }

  // Популярные темы
  try {
    const topics = await forumAPI.getPopularTopics(5)
    popularTopics.value = topics || []
  } catch (e) {
    console.warn('Популярные темы не загружены', e)
  }
}

const submitFeedback = async () => {
  feedbackSending.value = true
  feedbackSuccess.value = false
  try {
    await feedbackAPI.send(feedback.value)
    feedbackSuccess.value = true
    feedback.value = { name: '', email: '', message: '' }
  } catch (e) {
    alert('Ошибка отправки')
  } finally {
    feedbackSending.value = false
  }
}

onMounted(() => {
  mangaStore.fetchAllManga()
  loadSidebarData()
})
</script>

<style scoped>
.home {
  background: #000000;
  color: #ffffff;
  min-height: 100vh;
  padding: 20px 0;
}
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}
.page-title {
  font-size: 2.5rem;
  color: #07660c;
  text-align: center;
  margin-bottom: 30px;
}
.search-section {
  display: flex;
  max-width: 500px;
  margin: 0 auto 30px;
  gap: 10px;
}
.search-input {
  flex: 1;
  padding: 12px 20px;
  background: #202020;
  border: 1px solid #2b2b2b;
  border-radius: 30px;
  color: #fff;
}
.search-btn {
  padding: 12px 24px;
  background: #07660c;
  border: none;
  border-radius: 30px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
.search-btn:hover {
  background: #0a7e0f;
}

/* Основная сетка: боковая панель + центральная колонка */
.home-layout {
  display: grid;
  grid-template-columns: 240px 1fr; /* левая колонка уже */
  gap: 30px;
  margin-bottom: 40px;
}

/* Левая боковая панель */
.home-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.sidebar-block {
  background: #202020;
  border-radius: 12px;
  padding: 15px;
}
.sidebar-block h3 {
  color: #07660c;
  margin-bottom: 15px;
  font-size: 1.1rem;
  border-bottom: 1px solid #2b2b2b;
  padding-bottom: 8px;
}
.empty-block {
  color: #80832a;
  text-align: center;
  padding: 10px;
  font-size: 0.9rem;
}
.progress-list,
.forum-posts-list,
.popular-topics-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.progress-item,
.forum-post-item,
.topic-item {
  padding: 8px;
  background: #2b2b2b;
  border-radius: 6px;
  transition: background 0.2s;
}
.progress-item:hover,
.forum-post-item:hover,
.topic-item:hover {
  background: #333;
}
.progress-link,
.post-link,
.topic-link {
  text-decoration: none;
  color: #fff;
  display: flex;
  flex-direction: column;
}
.progress-link {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}
.progress-thumb {
  width: 40px;
  height: 55px;
  object-fit: cover;
  border-radius: 4px;
}
.progress-info {
  display: flex;
  flex-direction: column;
}
.manga-title {
  font-weight: 600;
  font-size: 0.9rem;
}
.chapter-info {
  font-size: 0.8rem;
  color: #80832a;
}
.post-topic,
.topic-title {
  font-weight: 500;
  margin-bottom: 4px;
}
.post-author,
.post-time,
.topic-stats {
  font-size: 0.8rem;
  color: #80832a;
}

/* Центральная колонка */
.home-main {
  width: 100%;
}

.manga-section {
  margin-bottom: 50px;
}
.manga-section h2 {
  color: #07660c;
  margin-bottom: 20px;
  font-size: 1.8rem;
  text-align: center;
}
.manga-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  justify-content: center;
}
.manga-card {
  background: #202020;
  border: 1px solid #2b2b2b;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s;
}
.manga-card:hover {
  transform: translateY(-4px);
  border-color: #07660c;
}
.manga-link {
  text-decoration: none;
  color: inherit;
  display: block;
}
.manga-cover {
  height: 250px;
  overflow: hidden;
}
.manga-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.manga-info {
  padding: 15px;
}
.manga-info h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.manga-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #80832a;
}
.rating::before {
  content: '★';
  color: #ffd700;
  margin-right: 3px;
}
.new-date {
  color: #80832a;
  font-size: 0.85rem;
  margin: 5px 0 0;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}
.skeleton-card {
  height: 300px;
  background: #2b2b2b;
  border-radius: 10px;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
.error-message {
  text-align: center;
  padding: 40px;
  background: #202020;
  border-radius: 10px;
  color: #ff6b6b;
}
.retry-btn {
  background: #07660c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 15px;
}
.catalog-link {
  text-align: center;
  margin: 30px 0;
}
.btn-primary {
  display: inline-block;
  padding: 12px 30px;
  background: #07660c;
  color: white;
  text-decoration: none;
  border-radius: 30px;
  font-weight: 600;
}

/* Форма обратной связи (шире, по центру) */
.feedback-section {
  margin-top: 40px;
}
.feedback-card {
  background: #202020;
  border-radius: 12px;
  padding: 30px;
  max-width: 700px;
  margin: 0 auto;
}
.feedback-card h3 {
  color: #07660c;
  margin-bottom: 25px;
  text-align: center;
  font-size: 1.5rem;
}
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.feedback-form input,
.feedback-form textarea {
  padding: 14px 16px;
  background: #2b2b2b;
  border: 1px solid #80832a;
  border-radius: 8px;
  color: white;
  font-family: inherit;
  font-size: 1rem;
}
.feedback-form textarea {
  resize: vertical;
}
.feedback-form .submit-btn {
  background: #07660c;
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;
  align-self: center;
  min-width: 200px;
}
.feedback-form .submit-btn:hover {
  background: #0a7e0f;
}
.feedback-form .submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.success-msg {
  color: #00cc44;
  text-align: center;
  margin-top: 20px;
  font-size: 1rem;
}

/* Адаптивность */
@media (max-width: 992px) {
  .home-layout {
    grid-template-columns: 1fr;
  }
  .home-sidebar {
    order: 2;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>