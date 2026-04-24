<template>
  <div class="home">
    <div class="container">
      <h1 class="page-title">Forgotten Team</h1>
      <div class="search-section">
        <div class="search-wrapper">
          <input
            v-model="searchQuery"
            @input="onSearchInput"
            @keyup.enter="goToSearch"
            type="text"
            placeholder="Найти мангу..."
            class="search-input"
            @focus="onSearchFocus"
            @blur="hideSuggestions"
          />
          <ul v-if="showSuggestions && searchSuggestions.length > 0" class="suggestions-dropdown">
            <li
              v-for="manga in searchSuggestions"
              :key="manga.id"
              @mousedown.prevent="selectSuggestion(manga)"
              class="suggestion-card"
            >
              <div class="suggestion-cover">
                <img :src="getCoverUrl(manga.cover_image)" :alt="manga.title" @error="handleImageError" />
              </div>
              <div class="suggestion-info">
                <span class="suggestion-title">{{ manga.title }}</span>
                <span class="suggestion-status" :class="manga.status">
                  {{ getStatusText(manga.status) }}
                </span>
              </div>
            </li>
          </ul>
        </div>
        <button @click="goToSearch" class="search-btn">Найти</button>
      </div>

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
            <div
              v-for="manga in popularManga"
              :key="manga.id"
              class="manga-card"
              @click="goToManga(manga)"
            >
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
            <div
              v-for="manga in newManga"
              :key="manga.id"
              class="manga-card"
              @click="goToManga(manga)"
            >
              <div class="manga-cover">
                <img :src="getCoverUrl(manga.cover_image)" :alt="manga.title" @error="handleImageError" />
              </div>
              <div class="manga-info">
                <h3>{{ manga.title }}</h3>
                <p class="new-date">{{ formatDate(manga.created_at) }}</p>
              </div>
            </div>
          </div>
        </section>

        <div class="forum-wide-row">
          <div class="forum-wide-block">
            <h3>Новые на форуме</h3>
            <div v-if="latestForumPosts.length === 0" class="empty-block">Нет сообщений</div>
            <div v-else class="wide-list">
              <div v-for="post in latestForumPosts.slice(0, 2)" :key="post.id" class="wide-list-item">
                <router-link :to="`/forum/topic/${post.topicId}`" class="wide-link">
                  <span class="wide-title">{{ post.topicTitle }}</span>
                  <span class="wide-meta">
                    {{ post.authorName }} · {{ formatTimeAgo(post.createdAt) }}
                  </span>
                </router-link>
              </div>
            </div>
          </div>
          <div class="forum-wide-block">
            <h3>Популярные темы</h3>
            <div v-if="popularTopics.length === 0" class="empty-block">Нет тем</div>
            <div v-else class="wide-list">
              <div v-for="topic in popularTopics.slice(0, 2)" :key="topic.id" class="wide-list-item">
                <router-link :to="`/forum/topic/${topic.id}`" class="wide-link">
                  <span class="wide-title">{{ topic.title }}</span>
                  <span class="wide-meta">{{ topic.postsCount }} отв.</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <div class="catalog-link">
          <router-link to="/catalog" class="btn-primary">Весь каталог</router-link>
        </div>
      </div>

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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMangaStore } from '@/stores/manga'
import { useAuthStore } from '@/stores/auth'
import { getCoverUrl, handleImageError } from '@/utils/imageHelper'
import { formatTimeAgo, formatDate, formatNumber } from '@/utils/helpers'
import { forumAPI, feedbackAPI, mangaAPI } from '@/api'

const router = useRouter()
const mangaStore = useMangaStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const searchSuggestions = ref([])
const showSuggestions = ref(false)
let searchTimeout = null

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

const latestForumPosts = ref([])
const popularTopics = ref([])

const feedback = ref({ name: '', email: '', message: '' })
const feedbackSending = ref(false)
const feedbackSuccess = ref(false)

const formatRating = (rating) => (rating ? rating.toFixed(1) : '0.0')

const getStatusText = (status) => {
  const map = {
    ongoing: 'Онгоинг',
    completed: 'Завершена',
    hiatus: 'Перерыв',
    cancelled: 'Отменена',
  }
  return map[status] || status || ''
}

const goToManga = (manga) => {
  const id = manga.id || manga.slug
  if (id) router.push(`/manga/${id}`)
}

const selectSuggestion = (manga) => {
  showSuggestions.value = false
  searchQuery.value = manga.title
  goToManga(manga)
}

const goToSearch = () => {
  if (searchQuery.value.trim())
    router.push({ path: '/catalog', query: { search: searchQuery.value.trim() } })
}

const retryLoading = () => mangaStore.fetchAllManga()

const fetchSuggestions = async (query) => {
  if (!query || query.length < 2) {
    searchSuggestions.value = []
    return
  }
  try {
    const data = await mangaAPI.list({ search: query, limit: 5 })
    searchSuggestions.value = data.manga || []
    showSuggestions.value = searchSuggestions.value.length > 0
  } catch (e) {
    searchSuggestions.value = []
    showSuggestions.value = false
  }
}

const onSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchSuggestions(searchQuery.value), 300)
}

const onSearchFocus = () => {
  if (searchSuggestions.value.length > 0) showSuggestions.value = true
}

const hideSuggestions = () => {
  setTimeout(() => { showSuggestions.value = false }, 150)
}

const loadSidebarData = async () => {
  try {
    const posts = await forumAPI.getRecentPosts(5)
    latestForumPosts.value = posts || []
  } catch (e) {
    console.warn('Сообщения форума не загружены', e)
  }
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

watch(() => router.currentRoute.value, () => { showSuggestions.value = false })

onMounted(() => {
  mangaStore.fetchAllManga()
  loadSidebarData()
})
</script>

<style scoped>
.home { background: #000000; color: #ffffff; min-height: 100vh; padding: 20px 0; }
.container { max-width: 1400px; margin: 0 auto; padding: 0 16px; }
.page-title { font-size: 2.5rem; color: #07660c; text-align: center; margin-bottom: 30px; }
.search-section { display: flex; max-width: 500px; margin: 0 auto 30px; gap: 10px; align-items: flex-start; }
.search-wrapper { position: relative; flex: 1; }
.search-input { width: 100%; padding: 12px 20px; background: #202020; border: 1px solid #2b2b2b; border-radius: 30px; color: #fff; box-sizing: border-box; }
.search-btn { padding: 12px 24px; background: #07660c; border: none; border-radius: 30px; color: white; font-weight: 600; cursor: pointer; white-space: nowrap; }
.search-btn:hover { background: #0a7e0f; }

.suggestions-dropdown {
  position: absolute; top: calc(100% + 8px); left: 0; background: #202020;
  border: 1px solid #333; border-radius: 12px; padding: 8px 6px; list-style: none;
  z-index: 100; display: flex; gap: 10px; overflow-x: auto; max-width: 480px; margin: 0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.6); scrollbar-width: thin; scrollbar-color: #07660c #2b2b2b;
}
.suggestions-dropdown::-webkit-scrollbar { height: 6px; }
.suggestions-dropdown::-webkit-scrollbar-track { background: #2b2b2b; border-radius: 3px; }
.suggestions-dropdown::-webkit-scrollbar-thumb { background: #07660c; border-radius: 3px; }
.suggestion-card { flex: 0 0 110px; cursor: pointer; border-radius: 8px; overflow: hidden; transition: transform 0.2s; }
.suggestion-card:hover { transform: scale(1.05); }
.suggestion-cover { width: 100%; height: 130px; background: #2b2b2b; border-radius: 8px 8px 0 0; overflow: hidden; }
.suggestion-cover img { width: 100%; height: 100%; object-fit: cover; }
.suggestion-info { background: #2b2b2b; padding: 8px 6px; border-radius: 0 0 8px 8px; }
.suggestion-title { font-size: 0.75rem; font-weight: 500; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; color: #ffffff; }
.suggestion-status { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.suggestion-status.ongoing { background: rgba(0, 204, 68, 0.2); color: #00cc44; }
.suggestion-status.completed { background: rgba(0, 102, 255, 0.2); color: #0066ff; }
.suggestion-status.hiatus { background: rgba(255, 170, 0, 0.2); color: #ffaa00; }
.suggestion-status.cancelled { background: rgba(255, 68, 68, 0.2); color: #ff4444; }

.home-main { max-width: 1200px; margin: 0 auto; width: 100%; }
.manga-section { margin-bottom: 50px; }
.manga-section h2 { color: #07660c; margin-bottom: 20px; font-size: 1.8rem; text-align: center; }
.manga-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; justify-content: center; }
.manga-card { background: #202020; border: 1px solid #2b2b2b; border-radius: 10px; overflow: hidden; cursor: pointer; transition: transform 0.2s, border-color 0.2s; }
.manga-card:hover { transform: translateY(-4px); border-color: #07660c; }
.manga-cover { height: 250px; overflow: hidden; }
.manga-cover img { width: 100%; height: 100%; object-fit: cover; pointer-events: none; background: #1a1a1a; }
.manga-info { padding: 15px; }
.manga-info h3 { margin: 0 0 8px; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.manga-meta { display: flex; justify-content: space-between; font-size: 0.9rem; color: #80832a; }
.rating::before { content: '★'; color: #ffd700; margin-right: 3px; }
.new-date { color: #80832a; font-size: 0.85rem; margin: 5px 0 0; }

.skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
.skeleton-card { height: 300px; background: #2b2b2b; border-radius: 10px; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
.error-message { text-align: center; padding: 40px; background: #202020; border-radius: 10px; color: #ff6b6b; }
.retry-btn { background: #07660c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 15px; }
.catalog-link { text-align: center; margin: 30px 0; }
.btn-primary { display: inline-block; padding: 12px 30px; background: #07660c; color: white; text-decoration: none; border-radius: 30px; font-weight: 600; }

.forum-wide-row { display: flex; gap: 30px; margin-bottom: 40px; max-width: 1200px; margin-left: auto; margin-right: auto; }
.forum-wide-block { flex: 1; background: #202020; border-radius: 12px; padding: 20px; }
.forum-wide-block h3 { color: #07660c; margin-bottom: 15px; font-size: 1.1rem; border-bottom: 1px solid #2b2b2b; padding-bottom: 8px; }
.empty-block { color: #80832a; text-align: center; padding: 10px; font-size: 0.9rem; }
.wide-list { display: flex; flex-direction: column; gap: 12px; }
.wide-list-item { background: #2b2b2b; border-radius: 6px; transition: background 0.2s; }
.wide-list-item:hover { background: #333; }
.wide-link { display: block; text-decoration: none; color: inherit; padding: 12px; }
.wide-title { font-weight: 500; display: block; margin-bottom: 4px; }
.wide-meta { font-size: 0.8rem; color: #80832a; }

.feedback-section { margin-top: 40px; }
.feedback-card { background: #202020; border-radius: 12px; padding: 30px; max-width: 700px; margin: 0 auto; }
.feedback-card h3 { color: #07660c; margin-bottom: 25px; text-align: center; font-size: 1.5rem; }
.feedback-form { display: flex; flex-direction: column; gap: 20px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.feedback-form input, .feedback-form textarea { padding: 14px 16px; background: #2b2b2b; border: 1px solid #80832a; border-radius: 8px; color: white; font-family: inherit; font-size: 1rem; }
.feedback-form textarea { resize: vertical; }
.feedback-form .submit-btn { background: #07660c; color: white; border: none; padding: 14px 24px; border-radius: 8px; font-weight: 600; font-size: 1.1rem; cursor: pointer; transition: background 0.2s; align-self: center; min-width: 200px; }
.feedback-form .submit-btn:hover { background: #0a7e0f; }
.feedback-form .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.success-msg { color: #00cc44; text-align: center; margin-top: 20px; font-size: 1rem; }

@media (max-width: 768px) { .forum-wide-row { flex-direction: column; } }
</style>