<template>
  <div class="manga-page">
    <div class="container">
      <!-- Карточка манги на сером фоне -->
      <div class="manga-card-section">
        <div class="manga-header">
          <div class="manga-cover">
            <img :src="getCoverUrl(manga.coverImage || manga.cover_image)" :alt="manga.title" />
          </div>
          <div class="manga-info">
            <h1 class="manga-title">{{ manga.title }}</h1>
            <p class="manga-description">{{ manga.description }}</p>
            <div class="manga-meta">
              <div class="meta-item">
                <span class="meta-label">Автор:</span>
                <span class="meta-value">{{ manga.author || 'Неизвестен' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Статус:</span>
                <span class="meta-value">{{ getStatusText(manga.status) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Год:</span>
                <span class="meta-value">{{ manga.year || '—' }}</span>
              </div>
            </div>
            
            <!-- Рейтинг манги -->
            <div class="manga-rating">
              <div class="rating-stars">
                <span 
                  v-for="i in 10" 
                  :key="i" 
                  class="star" 
                  :class="{ active: i <= (userRating || Math.round(manga.rating || 0)) }"
                  @click="setRating(i)"
                  @mouseenter="hoverRating = i"
                  @mouseleave="hoverRating = null"
                >
                  ★
                </span>
              </div>
              <span class="rating-value">{{ manga.rating?.toFixed(1) || 'Нет оценок' }}</span>
              <span v-if="userRating" class="user-rating-badge">Ваша оценка: {{ userRating }}/10</span>
            </div>
            
            <div class="manga-genres">
              <span v-for="genre in manga.genres" :key="genre" class="genre-tag">{{ genre }}</span>
            </div>
            
            <div class="manga-actions">
              <div class="bookmark-wrapper" ref="bookmarkBtnRef">
                <button @click="toggleStatusDropdown" class="action-btn" :class="{ active: currentStatus }">
                  {{ currentStatus ? getStatusLabel(currentStatus) : 'Добавить в закладки' }}
                </button>
                
                <!-- Выпадающий список статуса -->
                <div v-if="showStatusDropdown" class="status-dropdown">
                  <div class="status-dropdown-list">
                    <button @click="setStatus('reading')" class="status-dropdown-item" :class="{ active: currentStatus === 'reading' }">
                      <span class="status-icon"></span>
                      <i class="fi fi-ts-book-arrow-right"></i>
                      <span>Читаю</span>
                    </button>
                    <button @click="setStatus('completed')" class="status-dropdown-item" :class="{ active: currentStatus === 'completed' }">
                      <span class="status-icon"></span>
                      <i class="fi fi-rs-check-circle"></i>
                      <span>Прочитано</span>
                    </button>
                    <button @click="setStatus('planned')" class="status-dropdown-item" :class="{ active: currentStatus === 'planned' }">
                      <span class="status-icon"></span>
                      <i class="fi fi-tr-blueprint"></i>
                      <span>Запланировано</span>
                    </button>
                    <button @click="setStatus('dropped')" class="status-dropdown-item" :class="{ active: currentStatus === 'dropped' }">
                      <span class="status-icon"></span>
                      <i class="fi fi-ts-person-dragging-bag"></i>
                      <span>Брошено</span>
                    </button>
                  </div>
                  <div v-if="currentStatus" class="status-dropdown-footer">
                    <span class="current-status-text">Текущий: {{ getStatusLabel(currentStatus) }}</span>
                    <button @click="removeFromBookmarks" class="remove-bookmark-link">Удалить</button>
                  </div>
                </div>
              </div>
              
              <button v-if="firstChapterId" @click="goToFirstChapter" class="action-btn primary">
                Читать с начала
              </button>
              <button @click="toggleView" class="action-btn" :class="{ active: showReviews }">
                {{ showReviews ? 'Показать главы' : 'Рецензии' }}
                <span v-if="!showReviews && approvedReviews.length > 0" class="reviews-count">({{ approvedReviews.length }})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Список глав -->
      <div v-if="!showReviews" class="chapters-section">
        <div class="section-header">
          <h2>Список глав</h2>
          <div class="chapter-filters">
            <button @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'" class="sort-btn">
              {{ sortOrder === 'asc' ? '↑ По возрастанию' : '↓ По убыванию' }}
            </button>
          </div>
        </div>
        <div class="chapters-list">
          <div v-for="chapter in sortedChapters" :key="chapter.id" class="chapter-item">
            <router-link :to="`/chapter/${chapter.id}`" class="chapter-link">
              <span class="chapter-number">Глава {{ chapter.chapterNumber || chapter.chapter_number }}</span>
              <span class="chapter-title">{{ chapter.title || `Глава ${chapter.chapterNumber || chapter.chapter_number}` }}</span>
              <span class="chapter-date">{{ formatDate(chapter.createdAt || chapter.created_at) }}</span>
            </router-link>
          </div>
          <div v-if="chapters.length === 0" class="empty-chapters">
            У этой манги пока нет глав
          </div>
        </div>
      </div>

      <!-- Рецензии -->
      <div v-else class="reviews-dropdown">
        <div class="reviews-header">
          <h3>Рецензии</h3>
          <button @click="openReviewModal" class="btn-add-review">+ Добавить рецензию</button>
        </div>
        
        <div v-if="approvedReviews.length === 0" class="empty-reviews">
          Пока нет рецензий. Будьте первым!
        </div>
        
        <div v-else class="reviews-list">
          <div v-for="review in approvedReviews" :key="review.id" class="review-card">
            <div class="review-header">
              <div class="review-author">
                <span class="author-name">{{ review.userName }}</span>
                <span class="review-date">{{ formatDate(review.createdAt) }}</span>
              </div>
              <div class="review-rating-display">
                <span v-for="i in 10" :key="i" class="star-small" :class="{ active: i <= review.rating }">★</span>
                <span class="rating-number">{{ review.rating }}/10</span>
              </div>
            </div>
            <div class="review-content-full">
              <p>{{ review.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно добавления рецензии -->
    <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Написать рецензию</h3>
          <button @click="showReviewModal = false" class="close-modal">&times;</button>
        </div>
        <form @submit.prevent="submitReview">
          <div class="form-group">
            <label>Оценка (1-10)</label>
            <input type="number" v-model.number="reviewForm.rating" min="1" max="10" required />
          </div>
          <div class="form-group">
            <label>Текст рецензии</label>
            <textarea v-model="reviewForm.content" rows="6" required placeholder="Поделитесь своим мнением..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showReviewModal = false" class="btn-cancel">Отмена</button>
            <button type="submit" :disabled="submittingReview" class="btn-submit">
              {{ submittingReview ? 'Отправка...' : 'Отправить на модерацию' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mangaAPI, chaptersAPI, userMangaStatusAPI } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { getCoverUrl } from '@/utils/imageHelper'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const manga = ref({})
const chapters = ref([])
const currentStatus = ref(null)
const sortOrder = ref('asc')
const showReviewModal = ref(false)
const showReviews = ref(false)
const showStatusDropdown = ref(false)
const submittingReview = ref(false)
const reviewForm = ref({ rating: 5, content: '' })
const approvedReviews = ref([])
const userRating = ref(null)
const hoverRating = ref(null)
const bookmarkBtnRef = ref(null)

const firstChapterId = computed(() => {
  if (chapters.value.length === 0) return null
  const sorted = [...chapters.value].sort((a, b) => {
    const numA = a.chapterNumber || a.chapter_number
    const numB = b.chapterNumber || b.chapter_number
    return numA - numB
  })
  return sorted[0]?.id
})

const sortedChapters = computed(() => {
  const sorted = [...chapters.value]
  return sorted.sort((a, b) => {
    const numA = a.chapterNumber || a.chapter_number
    const numB = b.chapterNumber || b.chapter_number
    return sortOrder.value === 'asc' ? numA - numB : numB - numA
  })
})

const getStatusText = (status) => {
  const statusMap = {
    ongoing: 'Онгоинг',
    completed: 'Завершена',
    hiatus: 'Перерыв',
    cancelled: 'Отменена'
  }
  return statusMap[status] || status
}

const getStatusLabel = (status) => {
  const labels = {
    reading: 'Читаю',
    completed: 'Прочитано',
    planned: 'Запланировано',
    dropped: 'Брошено'
  }
  return labels[status] || status
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('ru-RU')
}

// Закрыть dropdown при клике вне
const handleClickOutside = (event) => {
  if (showStatusDropdown.value && bookmarkBtnRef.value && !bookmarkBtnRef.value.contains(event.target)) {
    showStatusDropdown.value = false
  }
}

const toggleStatusDropdown = () => {
  if (!authStore.isLoggedIn) {
    alert('Войдите в аккаунт, чтобы добавлять в закладки')
    return
  }
  showStatusDropdown.value = !showStatusDropdown.value
}

// Функция для установки рейтинга
const setRating = async (rating) => {
  if (!authStore.isLoggedIn) {
    alert('Войдите в аккаунт, чтобы оценить мангу')
    return
  }
  try {
    const ratings = JSON.parse(localStorage.getItem('user_ratings') || '{}')
    ratings[manga.value.id] = rating
    localStorage.setItem('user_ratings', JSON.stringify(ratings))
    userRating.value = rating
    
    try {
      await mangaAPI.rate(manga.value.id, rating)
      const updatedManga = await mangaAPI.get(manga.value.id)
      manga.value.rating = updatedManga.rating
    } catch (serverError) {
      console.warn('Ошибка сервера, но оценка сохранена локально')
    }
  } catch (error) {
    console.error('Ошибка сохранения оценки:', error)
  }
}

const loadUserRating = async () => {
  if (!authStore.isLoggedIn) return
  try {
    const ratings = JSON.parse(localStorage.getItem('user_ratings') || '{}')
    if (ratings[manga.value.id]) {
      userRating.value = ratings[manga.value.id]
    }
  } catch (error) {
    console.error('Ошибка загрузки оценки:', error)
  }
}

// Функции для работы со статусом манги
const setStatus = async (status) => {
  if (!authStore.isLoggedIn) return
  
  try {
    const userStatuses = JSON.parse(localStorage.getItem('user_manga_status') || '{}')
    userStatuses[manga.value.id] = {
      status: status,
      mangaId: manga.value.id,
      mangaTitle: manga.value.title,
      cover: manga.value.coverImage || manga.value.cover_image,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem('user_manga_status', JSON.stringify(userStatuses))
    currentStatus.value = status
    
    try {
      await userMangaStatusAPI.set(authStore.user.id, manga.value.id, status)
    } catch (serverError) {
      console.warn('Ошибка сервера, но статус сохранен локально')
    }
    
    showStatusDropdown.value = false
  } catch (error) {
    console.error('Ошибка сохранения статуса:', error)
  }
}

const removeFromBookmarks = async () => {
  if (!authStore.isLoggedIn) return
  
  try {
    const userStatuses = JSON.parse(localStorage.getItem('user_manga_status') || '{}')
    delete userStatuses[manga.value.id]
    localStorage.setItem('user_manga_status', JSON.stringify(userStatuses))
    currentStatus.value = null
    
    try {
      await userMangaStatusAPI.set(authStore.user.id, manga.value.id, null)
    } catch (serverError) {
      console.warn('Ошибка сервера, но удаление сохранено локально')
    }
    
    showStatusDropdown.value = false
  } catch (error) {
    console.error('Ошибка удаления:', error)
  }
}

const loadUserStatus = async () => {
  if (!authStore.isLoggedIn) return
  
  try {
    const userStatuses = JSON.parse(localStorage.getItem('user_manga_status') || '{}')
    if (userStatuses[manga.value.id]) {
      currentStatus.value = userStatuses[manga.value.id].status
    }
    
    try {
      const statuses = await userMangaStatusAPI.get(authStore.user.id)
      if (statuses && Array.isArray(statuses)) {
        const userStatus = statuses.find(s => s.mangaId == manga.value.id || s.manga_id == manga.value.id)
        if (userStatus) {
          currentStatus.value = userStatus.status
          userStatuses[manga.value.id] = {
            status: userStatus.status,
            mangaId: manga.value.id,
            mangaTitle: manga.value.title,
            cover: manga.value.coverImage || manga.value.cover_image,
            updatedAt: new Date().toISOString()
          }
          localStorage.setItem('user_manga_status', JSON.stringify(userStatuses))
        }
      }
    } catch (serverError) {
      console.log('Используем локальный статус')
    }
  } catch (error) {
    console.error('Ошибка загрузки статуса:', error)
  }
}

const goToFirstChapter = () => {
  if (firstChapterId.value) {
    router.push(`/chapter/${firstChapterId.value}`)
  }
}

const toggleView = () => {
  showReviews.value = !showReviews.value
}

const openReviewModal = () => {
  if (!authStore.isLoggedIn) {
    alert('Войдите в аккаунт, чтобы оставить рецензию')
    return
  }
  showReviewModal.value = true
}

const loadApprovedReviews = () => {
  const approved = JSON.parse(localStorage.getItem('approved_reviews') || '[]')
  approvedReviews.value = approved.filter(r => r.mangaId == manga.value.id)
}

const submitReview = async () => {
  if (!reviewForm.value.content.trim()) {
    alert('Введите текст рецензии')
    return
  }
  submittingReview.value = true
  try {
    const currentUser = authStore.user?.username || 'Пользователь'
    const newReview = {
      id: Date.now(),
      mangaId: manga.value.id,
      mangaTitle: manga.value.title,
      userName: currentUser,
      rating: reviewForm.value.rating,
      content: reviewForm.value.content,
      createdAt: new Date().toISOString(),
      status: 'pending'
    }
    
    const existingReviews = JSON.parse(localStorage.getItem('pending_reviews') || '[]')
    existingReviews.unshift(newReview)
    localStorage.setItem('pending_reviews', JSON.stringify(existingReviews))
    
    window.dispatchEvent(new CustomEvent('reviewsUpdated'))
    
    showReviewModal.value = false
    reviewForm.value = { rating: 5, content: '' }
  } catch (err) {
    console.error('Ошибка:', err)
    alert('Ошибка при отправке рецензии')
  } finally {
    submittingReview.value = false
  }
}

const loadManga = async () => {
  try {
    const id = route.params.id
    manga.value = await mangaAPI.get(id)
    document.title = `${manga.value.title} | Forgotten Team`
    loadApprovedReviews()
    loadUserRating()
    loadUserStatus()
  } catch (e) {
    console.error('Ошибка загрузки манги:', e)
  }
}

const loadChapters = async () => {
  try {
    const id = route.params.id
    const data = await mangaAPI.getChapters(id)
    chapters.value = data || []
  } catch (e) {
    console.error('Ошибка загрузки глав:', e)
  }
}

onMounted(() => {
  loadManga()
  loadChapters()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.manga-page {
  min-height: calc(100vh - var(--header-height, 60px) - var(--footer-height, 60px));
  padding: 30px 0;
  background: var(--color-background, #0a0a0a);
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Карточка манги */
.manga-card-section {
  background: #202020;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 30px;
  border: 1px solid rgba(128, 131, 42, 0.2);
}

.manga-header {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.manga-cover {
  flex-shrink: 0;
  width: 220px;
  height: 310px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.manga-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.manga-info {
  flex: 1;
}

.manga-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #07660c;
  margin: 0 0 15px 0;
}

.manga-description {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #ccc;
  margin-bottom: 20px;
}

.manga-meta {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  gap: 8px;
}

.meta-label {
  color: #9ea344;
  font-weight: 500;
  font-size: 0.85rem;
}

.meta-value {
  color: #ddd;
  font-size: 0.85rem;
}

/* Рейтинг */
.manga-rating {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.rating-stars {
  display: flex;
  gap: 2px;
  cursor: pointer;
}

.star {
  font-size: 1.5rem;
  color: #444;
  transition: all 0.2s;
  cursor: pointer;
}

.star:hover {
  transform: scale(1.1);
}

.star.active {
  color: #ffcc00;
}

.rating-value {
  font-size: 1rem;
  font-weight: 600;
  color: #9ea344;
}

.user-rating-badge {
  font-size: 0.8rem;
  color: #07660c;
  background: rgba(7, 102, 12, 0.2);
  padding: 4px 10px;
  border-radius: 20px;
}

.manga-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.genre-tag {
  background: rgba(7, 102, 12, 0.2);
  border: 1px solid #9ea344;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  color: #9ea344;
}

/* Кнопки действий */
.manga-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  position: relative;
}

.bookmark-wrapper {
  position: relative;
}

.action-btn {
  padding: 10px 24px;
  background: rgba(128, 131, 42, 0.2);
  border: 1px solid #9ea344;
  border-radius: 8px;
  color: #9ea344;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.action-btn:hover {
  background: rgba(128, 131, 42, 0.4);
}

.action-btn.primary {
  background: #07660c;
  border-color: #07660c;
  color: white;
}

.action-btn.primary:hover {
  background: #0a8a10;
}

.action-btn.active {
  background: #07660c;
  border-color: #07660c;
  color: white;
}

.reviews-count {
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 20px;
}

/* Выпадающий список статуса - под кнопкой */
.status-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  min-width: 200px;
  background: #1a1a1a;
  border-radius: 10px;
  border: 1px solid rgba(128, 131, 42, 0.3);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  z-index: 100;
  animation: dropdownFadeIn 0.2s ease;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-dropdown-list {
  display: flex;
  flex-direction: column;
  padding: 5px 0;
}

.status-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-size: 0.85rem;
  color: #ddd;
  width: 100%;
}

.status-dropdown-item:hover {
  background: rgba(128, 131, 42, 0.15);
}

.status-dropdown-item.active {
  background: rgba(7, 102, 12, 0.2);
  color: #07660c;
}

.status-icon {
  font-size: 1rem;
}

.status-dropdown-footer {
  padding: 8px 12px;
  border-top: 1px solid rgba(128, 131, 42, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
}

.current-status-text {
  color: #aaa;
}

.remove-bookmark-link {
  background: none;
  border: none;
  color: #ff4444;
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.2s;
}

.remove-bookmark-link:hover {
  text-decoration: underline;
}

/* Список глав */
.chapters-section {
  background: #1a1a1a;
  border-radius: 12px;
  border: 1px solid rgba(128, 131, 42, 0.2);
  overflow: hidden;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(7, 102, 12, 0.1);
  border-bottom: 1px solid rgba(128, 131, 42, 0.2);
}

.section-header h2 {
  font-size: 1.2rem;
  color: #9ea344;
  margin: 0;
}

.sort-btn {
  background: rgba(128, 131, 42, 0.2);
  border: 1px solid #9ea344;
  padding: 6px 14px;
  border-radius: 6px;
  color: #9ea344;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-btn:hover {
  background: rgba(128, 131, 42, 0.4);
}

.chapters-list {
  display: flex;
  flex-direction: column;
}

.chapter-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.chapter-item:last-child {
  border-bottom: none;
}

.chapter-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  text-decoration: none;
  transition: background 0.2s;
}

.chapter-link:hover {
  background: rgba(255, 255, 255, 0.03);
}

.chapter-number {
  font-weight: 600;
  color: #07660c;
  min-width: 100px;
}

.chapter-title {
  flex: 1;
  color: white;
  margin-left: 20px;
}

.chapter-date {
  font-size: 0.7rem;
  color: #aaa;
}

.empty-chapters {
  text-align: center;
  padding: 40px;
  color: #aaa;
}

/* Рецензии */
.reviews-dropdown {
  background: #1a1a1a;
  border-radius: 12px;
  border: 1px solid rgba(128, 131, 42, 0.2);
  overflow: hidden;
  margin-bottom: 30px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(7, 102, 12, 0.1);
  border-bottom: 1px solid rgba(128, 131, 42, 0.2);
}

.reviews-header h3 {
  font-size: 1.2rem;
  color: #9ea344;
  margin: 0;
}

.btn-add-review {
  background: #07660c;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-add-review:hover {
  background: #0a8a10;
  transform: translateY(-1px);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.review-card {
  background: #2a2a2a;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid rgba(128, 131, 42, 0.2);
  transition: all 0.2s;
}

.review-card:hover {
  border-color: rgba(128, 131, 42, 0.5);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.review-author {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.author-name {
  font-weight: 600;
  color: #07660c;
  font-size: 0.9rem;
}

.review-date {
  font-size: 0.7rem;
  color: #aaa;
}

.review-rating-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.star-small {
  font-size: 0.9rem;
  color: #444;
}

.star-small.active {
  color: #ffcc00;
}

.rating-number {
  font-size: 0.8rem;
  font-weight: 600;
  color: #9ea344;
}

.review-content-full {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #ddd;
}

.empty-reviews {
  text-align: center;
  padding: 40px;
  color: #aaa;
}

/* Модальное окно */
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
  z-index: 3000;
}

.modal-content {
  background: #1a1a1a;
  border-radius: 16px;
  width: 90%;
  max-width: 520px;
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
  position: sticky;
  top: 0;
  background: #1a1a1a;
}

.modal-header h3 {
  color: #07660c;
  margin: 0;
  font-size: 1.3rem;
}

.close-modal {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #aaa;
  padding: 0;
  line-height: 1;
}

.close-modal:hover {
  color: #ff4444;
}

.modal-content form {
  padding: 20px 24px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #9ea344;
  font-size: 0.85rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  background: #2d2d2d;
  border: 1px solid rgba(128, 131, 42, 0.3);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9rem;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #07660c;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(128, 131, 42, 0.2);
}

.btn-cancel {
  padding: 8px 18px;
  background: transparent;
  border: 1px solid rgba(128, 131, 42, 0.4);
  border-radius: 6px;
  color: #aaa;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  border-color: #ff4444;
  color: #ff4444;
}

.btn-submit {
  padding: 8px 20px;
  background: #07660c;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: #0a8a10;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .manga-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .manga-cover {
    width: 180px;
    height: 255px;
  }
  
  .manga-title {
    font-size: 1.4rem;
  }
  
  .manga-meta {
    justify-content: center;
  }
  
  .meta-item {
    justify-content: center;
  }
  
  .manga-actions {
    justify-content: center;
  }
  
  .chapter-link {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .chapter-title {
    margin-left: 0;
  }
  
  .review-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .reviews-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .status-dropdown {
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>