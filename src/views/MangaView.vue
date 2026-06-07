<template>
  <div class="manga-page" v-if="manga">
    <div class="container">
      <div v-if="authStore.isLoggedIn && !authStore.user?.emailVerified" class="verification-banner">
        <span>⚠️ Ваш Email не подтверждён. Оценка, комментарии и рецензии недоступны.</span>
        <router-link to="/verify-email" class="verify-link">Подтвердить Email</router-link>
      </div>

      <div class="manga-header">
        <div class="manga-cover">
          <img :src="getCoverUrl(manga.coverImage || manga.cover_image)" :alt="manga.title" />
        </div>
        <div class="manga-info">
          <h1>{{ manga.title }}</h1>
          <p class="description">{{ manga.description }}</p>
          <div class="meta">
            <span>Автор: {{ manga.author }}</span>
            <span>Статус: {{ getStatusText(manga.status) }}</span>
            <span>Год: {{ manga.year }}</span>
          </div>
          <div class="rating-section">
            <span class="rating-label">Рейтинг:</span>
            <div class="rating-stars">
              <span v-for="n in 10" :key="n" class="star"
                :class="{ active: n <= userRating, filled: n <= manga.rating }"
                @click="rateManga(n)">★</span>
              <span class="rating-value">{{ manga.rating ? manga.rating.toFixed(1) : '0.0' }}</span>
            </div>
          </div>
          <div class="genres">
            <span v-for="genre in manga.genres" :key="genre" class="genre-tag">{{ genre }}</span>
          </div>
          <div class="action-buttons">
            <div class="dropdown" ref="dropdownRef">
              <button class="btn-bookmark" @click.stop="toggleDropdown">Добавить в закладки</button>
              <div class="dropdown-menu" v-if="dropdownOpen">
                <button @click="setStatus('reading')">Читаю</button>
                <button @click="setStatus('completed')">Прочитано</button>
                <button @click="setStatus('dropped')">Брошено</button>
                <button @click="setStatus('planned')">Запланировано</button>
              </div>
            </div>
            <button class="btn-read" @click="startReading">
              {{ hasProgress ? 'Продолжить читать' : 'Читать с начала' }}
            </button>
            <button class="btn-reviews" @click="toggleReviewsBlock">Рецензии</button>
          </div>
        </div>
      </div>

      <!-- Блок рецензий (появляется по клику) -->
      <div v-if="showReviews" class="reviews-section">
        <div class="reviews-header">
          <h2>Рецензии</h2>
          <button 
            v-if="authStore.isLoggedIn && authStore.user?.emailVerified" 
            class="add-review-btn" 
            @click="openReviewModal"
          >
            + Добавить рецензию
          </button>
        </div>
        <div v-if="reviewsLoading" class="loading">Загрузка рецензий...</div>
        <div v-else-if="reviewsList.length === 0" class="no-reviews">Пока нет рецензий. Будьте первым!</div>
        <div v-else class="reviews-list">
          <div v-for="review in reviewsList" :key="review.id" class="review-card">
            <div class="review-header">
              <span class="review-author">{{ review.authorName }}</span>
              <span class="review-date">{{ formatDate(review.createdAt) }}</span>
            </div>
            <div class="review-text">{{ review.text }}</div>
          </div>
        </div>
      </div>

      <!-- Главы -->
      <div class="chapters-section">
        <div class="chapters-header">
          <h2>Список глав</h2>
          <button class="btn-invert" @click="invertOrder">
            {{ orderAsc ? 'С начала' : 'С конца' }}
          </button>
        </div>
        <div class="chapters-list">
          <div v-for="chapter in orderedChapters" :key="chapter.id" class="chapter-item" @click="goToChapter(chapter.id)">
            <span>Глава {{ chapter.chapterNumber || chapter.chapter_number }}</span>
            <span class="chapter-title">{{ chapter.title }}</span>
            <span class="chapter-date">{{ formatDate(chapter.createdAt || chapter.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Комментарии -->
      <div class="comments-section">
        <h2>Комментарии</h2>
        <div v-if="authStore.isLoggedIn && !authStore.user?.emailVerified" class="verification-warning">
          <p>⚠️ Чтобы оставить комментарий, необходимо подтвердить Email.</p>
          <router-link to="/verify-email" class="verify-link">Подтвердить Email</router-link>
        </div>
        <div v-else-if="authStore.isLoggedIn" class="comment-form">
          <textarea v-model="newComment" placeholder="Оставьте комментарий..." rows="3"></textarea>
          <button @click="submitComment" :disabled="!newComment.trim() || commentSending">Отправить</button>
        </div>
        <div v-else class="login-prompt">
          <router-link to="/login">Войдите</router-link>, чтобы оставить комментарий
        </div>
        <div class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <span class="comment-author">{{ comment.authorName }}</span>
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
          </div>
          <div v-if="comments.length === 0" class="no-comments">Пока нет комментариев</div>
        </div>
      </div>
    </div>

    <!-- Модальное окно добавления рецензии -->
    <div v-if="showReviewModal" class="modal-overlay" @click.self="closeReviewModal">
      <div class="modal-content">
        <h3>Добавить рецензию</h3>
        <form @submit.prevent="submitReview">
          <div class="form-group">
            <label>Ваша рецензия (минимум 10 символов)</label>
            <textarea v-model="reviewText" rows="6" placeholder="Поделитесь мнением о манге..." required></textarea>
          </div>
          <div class="modal-actions">
            <button type="submit" :disabled="reviewSending" class="save-btn">
              {{ reviewSending ? 'Отправка...' : 'Отправить на модерацию' }}
            </button>
            <button type="button" class="cancel-btn" @click="closeReviewModal">Отмена</button>
          </div>
          <p v-if="reviewSubmitSuccess" class="success-msg">Рецензия отправлена на модерацию!</p>
        </form>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="loading">Загрузка...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMangaStore } from '@/stores/manga'
import { useAuthStore } from '@/stores/auth'
import { getCoverUrl } from '@/utils/imageHelper'
import { userMangaStatusAPI, progressAPI, mangaAPI } from '@/api'

const route = useRoute()
const router = useRouter()
const mangaStore = useMangaStore()
const authStore = useAuthStore()

const manga = ref(null)
const loading = ref(true)
const error = ref(null)
const orderAsc = ref(true)
const dropdownOpen = ref(false)
const hasProgress = ref(false)
const dropdownRef = ref(null)

const userRating = ref(0)
const comments = ref([])
const newComment = ref('')
const commentSending = ref(false)

// Рецензии
const showReviews = ref(false)
const reviewsList = ref([])
const reviewsLoading = ref(false)
const showReviewModal = ref(false)
const reviewText = ref('')
const reviewSending = ref(false)
const reviewSubmitSuccess = ref(false)

const orderedChapters = computed(() => {
  if (!manga.value?.chapters) return []
  const chapters = [...manga.value.chapters]
  return orderAsc.value
    ? chapters.sort((a, b) => (a.chapterNumber || a.chapter_number) - (b.chapterNumber || b.chapter_number))
    : chapters.sort((a, b) => (b.chapterNumber || b.chapter_number) - (a.chapterNumber || a.chapter_number))
})

const getStatusText = (status) => {
  const map = { ongoing: 'Онгоинг', completed: 'Завершена', hiatus: 'Перерыв' }
  return map[status] || status
}
const formatDate = (date) => new Date(date).toLocaleDateString('ru-RU')

const toggleDropdown = () => { dropdownOpen.value = !dropdownOpen.value }
const closeDropdown = () => { dropdownOpen.value = false }

const setStatus = async (status) => {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  try {
    await userMangaStatusAPI.set(authStore.user.id, manga.value.id, status)
    closeDropdown()
  } catch (err) { console.error(err) }
}

const startReading = async () => {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  let chapterId = null
  if (hasProgress.value) {
    try {
      const progress = await progressAPI.get(manga.value.id)
      if (progress && progress.chapter_id) chapterId = progress.chapter_id
    } catch (err) {}
  }
  if (!chapterId && manga.value.chapters?.length) chapterId = manga.value.chapters[0].id
  if (chapterId) router.push(`/chapter/${chapterId}`)
}

const goToChapter = (chapterId) => router.push(`/chapter/${chapterId}`)

const rateManga = async (rating) => {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  if (!authStore.user.emailVerified) { alert('Подтвердите email для оценки манги'); return; }
  userRating.value = rating
  try {
    await mangaAPI.rate(manga.value.id, rating)
    const updated = await mangaAPI.get(manga.value.id)
    manga.value.rating = updated.rating
  } catch (e) { alert('Ошибка при оценке') }
}

// Комментарии
const loadComments = async () => {
  try {
    const data = await mangaAPI.getComments(manga.value.id)
    comments.value = data || []
  } catch (e) {}
}
const submitComment = async () => {
  if (!newComment.value.trim()) return
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  if (!authStore.user.emailVerified) { alert('Подтвердите email для комментирования'); return; }
  commentSending.value = true
  try {
    const comment = await mangaAPI.addComment(manga.value.id, newComment.value)
    comments.value.unshift(comment)
    newComment.value = ''
  } catch (e) { alert('Ошибка отправки') }
  finally { commentSending.value = false }
}

// Рецензии
const loadReviews = async () => {
  if (!manga.value) return
  reviewsLoading.value = true
  try {
    const data = await reviewsAPI.getByManga(manga.value.id)
    reviewsList.value = data
  } catch (e) { console.error(e) }
  finally { reviewsLoading.value = false }
}
const toggleReviewsBlock = () => {
  showReviews.value = !showReviews.value
  if (showReviews.value && reviewsList.value.length === 0) {
    loadReviews()
  }
}
const openReviewModal = () => {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  if (!authStore.user.emailVerified) { alert('Подтвердите email для добавления рецензии'); return; }
  showReviewModal.value = true
  reviewText.value = ''
  reviewSubmitSuccess.value = false
}
const closeReviewModal = () => {
  showReviewModal.value = false
  reviewText.value = ''
  reviewSubmitSuccess.value = false
}
const submitReview = async () => {
  if (!reviewText.value.trim() || reviewText.value.trim().length < 10) {
    alert('Рецензия должна содержать минимум 10 символов')
    return
  }
  reviewSending.value = true
  try {
    await reviewsAPI.create(manga.value.id, reviewText.value)
    reviewSubmitSuccess.value = true
    setTimeout(() => {
      closeReviewModal()
    }, 2000)
  } catch (e) {
    alert('Ошибка отправки: ' + (e.message || 'Попробуйте позже'))
  } finally {
    reviewSending.value = false
  }
}

const loadData = async () => {
  loading.value = true; error.value = null
  try {
    const id = route.params.id
    const data = await mangaStore.fetchMangaById(id)
    if (!data) throw new Error('Манга не найдена')
    manga.value = data
    if (authStore.isLoggedIn) {
      try {
        const progress = await progressAPI.get(data.id)
        hasProgress.value = !!progress
      } catch (err) {}
    }
    await loadComments()
  } catch (err) { error.value = err.message }
  finally { loading.value = false }
}

const invertOrder = () => { orderAsc.value = !orderAsc.value }

const handleClickOutside = (event) => {
  if (dropdownOpen.value && dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadData()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* ===== ОСНОВНЫЕ СТИЛИ СТРАНИЦЫ (оставляем как было) ===== */
.manga-page {
  padding: 40px 0;
  background: #121212;
  color: #fff;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
.manga-header {
  display: flex;
  gap: 40px;
  margin-bottom: 50px;
  flex-wrap: wrap;
}
.manga-cover {
  flex: 0 0 250px;
}
.manga-cover img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
}
.manga-info {
  flex: 1;
}
h1 {
  font-size: 2rem;
  color: #07660c;
  margin-bottom: 15px;
}
.description {
  color: #ccc;
  line-height: 1.6;
  margin-bottom: 20px;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 15px;
  color: #80832a;
}
.rating-section {
  margin: 15px 0;
  display: flex;
  align-items: center;
  gap: 15px;
}
.rating-stars {
  display: flex;
  align-items: center;
  gap: 5px;
}
.star {
  font-size: 1.5rem;
  color: #555;
  cursor: pointer;
}
.star.filled {
  color: #ffd700;
}
.star.active {
  color: #ffaa00;
}
.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 25px;
}
.genre-tag {
  background: #2b2b2b;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
}
.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}
.btn-bookmark, .btn-read, .btn-reviews {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.btn-bookmark {
  background: #80832a;
  color: white;
}
.btn-read {
  background: #07660c;
  color: white;
}
.btn-reviews {
  background: #2b2b2b;
  border: 1px solid #80832a;
  color: white;
}
.btn-reviews:hover {
  background: #80832a;
}
.dropdown {
  position: relative;
}
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: #2b2b2b;
  border-radius: 8px;
  overflow: hidden;
  z-index: 10;
  margin-top: 5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 10px 20px;
  background: none;
  border: none;
  color: white;
  text-align: left;
  cursor: pointer;
}
.dropdown-menu button:hover {
  background: #07660c;
}

/* ===== РЕЦЕНЗИИ ===== */
.reviews-section {
  margin-top: 40px;
  background: #202020;
  border-radius: 12px;
  padding: 20px;
}
.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.reviews-header h2 {
  color: #07660c;
  margin: 0;
}
.add-review-btn {
  background: #80832a;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
}
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.review-card {
  background: #2b2b2b;
  border-radius: 10px;
  padding: 15px;
}
.review-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #80832a;
  font-size: 0.9rem;
}
.review-author {
  font-weight: 600;
  color: #07660c;
}
.review-text {
  line-height: 1.5;
  white-space: pre-wrap;
}
.no-reviews {
  text-align: center;
  padding: 30px;
  color: #80832a;
}

/* ===== ГЛАВЫ ===== */
.chapters-section {
  margin-top: 40px;
}
.chapters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.btn-invert {
  background: #2b2b2b;
  border: 1px solid #80832a;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
.chapters-list {
  background: #202020;
  border-radius: 12px;
  overflow: hidden;
}
.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #2b2b2b;
  cursor: pointer;
}
.chapter-item:hover {
  background: #2b2b2b;
}

/* ===== КОММЕНТАРИИ ===== */
.comments-section {
  margin-top: 50px;
}
.comments-section h2 {
  color: #07660c;
  margin-bottom: 20px;
}
.comment-form {
  margin-bottom: 30px;
}
.comment-form textarea {
  width: 100%;
  padding: 12px;
  background: #2b2b2b;
  border: 1px solid #80832a;
  border-radius: 8px;
  color: white;
  resize: vertical;
}
.comment-form button {
  margin-top: 10px;
  padding: 10px 20px;
  background: #07660c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.comment-item {
  background: #202020;
  padding: 15px;
  border-radius: 8px;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #80832a;
  font-size: 0.9rem;
}
.comment-author {
  font-weight: 600;
  color: #fff;
}
.loading, .error {
  text-align: center;
  padding: 50px;
  color: white;
}
.verification-banner, .verification-warning {
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
.login-prompt {
  text-align: center;
  padding: 20px;
  background: #202020;
  border-radius: 8px;
  margin-bottom: 20px;
}
.login-prompt a {
  color: #07660c;
}

/* ===== МОДАЛЬНОЕ ОКНО (стиль как на всём сайте) ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #202020;
  border-radius: 16px;
  width: 90%;
  max-width: 550px;
  padding: 25px;
  border: 1px solid #80832a;
}
.modal-content h3 {
  color: #07660c;
  margin-bottom: 20px;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #e0e0e0;
}
.form-group textarea {
  width: 100%;
  padding: 12px;
  background: #2b2b2b;
  border: 1px solid #80832a;
  border-radius: 8px;
  color: white;
  font-family: inherit;
  resize: vertical;
}
.modal-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}
.save-btn, .cancel-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.save-btn {
  background: #07660c;
  color: white;
}
.cancel-btn {
  background: #b91c1c;
  color: white;
}
.success-msg {
  color: #00cc44;
  margin-top: 15px;
  text-align: center;
}
</style>