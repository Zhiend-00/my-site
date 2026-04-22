<template>
  <div class="profile-page">
    <div class="container">
      <!-- Заголовок -->
      <div class="page-header">
        <h1>Профиль пользователя</h1>
        <p>Управление вашим аккаунтом</p>
      </div>

      <!-- Основной контент -->
      <div class="profile-wrapper">
        <!-- Боковая панель -->
        <div class="profile-sidebar">
          <div class="user-card">
            <div class="user-avatar-container">
              <div
                class="user-avatar"
                :style="{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none' }"
                @click="triggerAvatarUpload"
              >
                <span v-if="!avatarUrl">{{ getInitials(authStore.user?.username) }}</span>
                <input
                  type="file"
                  ref="avatarInput"
                  accept="image/*"
                  style="display: none"
                  @change="handleAvatarChange"
                />
              </div>
              <button class="avatar-edit-btn" @click="triggerAvatarUpload" title="Изменить аватар">
                📷
              </button>
            </div>
            <div class="user-info">
              <h3>{{ authStore.user?.username || 'Гость' }}</h3>
              <p class="user-email">{{ authStore.user?.email }}</p>
              <p class="user-status" :class="{ verified: authStore.isEmailVerified }">
                {{ authStore.isEmailVerified ? '✓ Email подтвержден' : '✗ Email не подтвержден' }}
              </p>
            </div>
          </div>

          <nav class="profile-nav">
            <a
              href="#"
              @click.prevent="activeTab = 'general'"
              class="nav-item"
              :class="{ active: activeTab === 'general' }"
            >
              <span class="nav-icon">👤</span>
              <span>Общая информация</span>
            </a>
            <a
              href="#"
              @click.prevent="activeTab = 'activity'"
              class="nav-item"
              :class="{ active: activeTab === 'activity' }"
            >
              <span class="nav-icon">📊</span>
              <span>Активность</span>
            </a>
            <a
              href="#"
              @click.prevent="activeTab = 'settings'"
              class="nav-item"
              :class="{ active: activeTab === 'settings' }"
            >
              <span class="nav-icon">⚙️</span>
              <span>Настройки</span>
            </a>
          </nav>

          <div class="profile-stats">
            <h4>Статистика</h4>
            <div class="stat-item">
              <span class="stat-label">Прочитано глав:</span>
              <span class="stat-value">{{ totalChaptersRead }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">В избранном:</span>
              <span class="stat-value">{{ favoriteMangaList.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">На сайте:</span>
              <span class="stat-value">{{ daysSinceRegistration }} дн.</span>
            </div>
          </div>
        </div>

        <!-- Основное содержимое -->
        <div class="profile-content">
          <!-- Вкладка: Общая информация -->
          <div v-if="activeTab === 'general'" class="content-section">
            <h2>Общая информация</h2>

            <div class="info-grid">
              <div class="info-item">
                <label>Имя пользователя:</label>
                <div class="info-value">{{ authStore.user?.username }}</div>
              </div>

              <div class="info-item">
                <label>Email:</label>
                <div class="info-value">
                  {{ authStore.user?.email }}
                  <span class="email-status" :class="{ verified: authStore.isEmailVerified }">
                    {{ authStore.isEmailVerified ? '✓' : '✗' }}
                  </span>
                </div>
              </div>

              <div class="info-item">
                <label>Дата регистрации:</label>
                <div class="info-value">
                  {{ formatDate(authStore.user?.createdAt) }}
                </div>
              </div>

              <div class="info-item">
                <label>ID пользователя:</label>
                <div class="info-value">
                  <code>{{ authStore.user?.id }}</code>
                </div>
              </div>
            </div>
          </div>

          <!-- Вкладка: Активность -->
          <div v-if="activeTab === 'activity'" class="content-section">
            <h2>Активность</h2>

            <!-- Прогресс чтения за последние 3 дня -->
            <div class="activity-block">
              <h3>📖 Прогресс чтения (последние 3 дня)</h3>
              <div v-if="recentProgress.length === 0" class="empty-activity">
                Нет недавней активности
              </div>
              <div v-else class="recent-progress-list">
                <div v-for="item in recentProgress" :key="item.mangaId" class="progress-item">
                  <router-link :to="`/manga/${item.mangaId}`" class="manga-link">
                    <img :src="getCoverUrl(item.cover)" class="manga-thumb" />
                    <div class="progress-info">
                      <span class="manga-title">{{ item.mangaTitle }}</span>
                      <span class="chapter-info"
                        >Глава {{ item.chapterNumber }} · стр. {{ item.pageNumber }}</span
                      >
                      <span class="progress-date">{{ formatRelativeDate(item.updatedAt) }}</span>
                    </div>
                  </router-link>
                </div>
              </div>
            </div>

            <!-- Закладки по статусам -->
            <div class="activity-block">
              <h3>🔖 Закладки</h3>
              <div class="bookmarks-tabs">
                <button
                  v-for="status in bookmarkStatuses"
                  :key="status.value"
                  @click="selectedBookmarkStatus = status.value"
                  class="bookmark-tab"
                  :class="{ active: selectedBookmarkStatus === status.value }"
                >
                  {{ status.label }} ({{ getBookmarksByStatus(status.value).length }})
                </button>
              </div>
              <div class="bookmarks-list">
                <div
                  v-if="getBookmarksByStatus(selectedBookmarkStatus).length === 0"
                  class="empty-activity"
                >
                  Нет манги в этой категории
                </div>
                <div v-else class="bookmark-items">
                  <div
                    v-for="item in getBookmarksByStatus(selectedBookmarkStatus)"
                    :key="item.mangaId"
                    class="bookmark-item"
                  >
                    <router-link :to="`/manga/${item.mangaId}`" class="manga-link">
                      <img :src="getCoverUrl(item.cover)" class="manga-thumb" />
                      <div class="bookmark-info">
                        <span class="manga-title">{{ item.mangaTitle }}</span>
                        <span class="bookmark-status">{{ getStatusLabel(item.status) }}</span>
                      </div>
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Вкладка: Настройки -->
          <div v-if="activeTab === 'settings'" class="content-section">
            <h2>Настройки аккаунта</h2>

            <div class="settings-grid">
              <div class="settings-group">
                <h3>Основные</h3>
                <button @click="openEditProfileModal" class="settings-btn">
                  <span>✏️</span> Редактировать профиль
                </button>
                <button @click="triggerAvatarUpload" class="settings-btn">
                  <span>🖼️</span> Изменить аватар
                </button>
                <button @click="openChangePasswordModal" class="settings-btn">
                  <span>🔐</span> Изменить пароль
                </button>
                <button
                  v-if="!authStore.isEmailVerified"
                  @click="verifyEmail"
                  class="settings-btn warning"
                >
                  <span>📧</span> Подтвердить Email
                </button>
              </div>

              <div class="settings-group danger">
                <h3>Опасная зона</h3>
                <button @click="logout" class="settings-btn">
                  <span>🚪</span> Выйти из аккаунта
                </button>
                <button @click="deleteAccount" class="settings-btn danger-btn">
                  <span>🗑️</span> Удалить аккаунт
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно: Редактирование профиля -->
    <div v-if="showEditProfileModal" class="modal-overlay" @click.self="closeEditProfileModal">
      <div class="modal-content">
        <h3>Редактирование профиля</h3>
        <form @submit.prevent="saveProfile">
          <div class="form-group">
            <label>Имя пользователя</label>
            <input v-model="editProfileForm.username" type="text" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="editProfileForm.email" type="email" required />
          </div>
          <div class="modal-actions">
            <button type="submit" class="save-btn" :disabled="profileSaving">Сохранить</button>
            <button type="button" class="cancel-btn" @click="closeEditProfileModal">Отмена</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно: Изменение пароля -->
    <div v-if="showChangePasswordModal" class="modal-overlay" @click.self="closeChangePasswordModal">
      <div class="modal-content">
        <h3>Изменение пароля</h3>
        <form @submit.prevent="changePassword">
          <div class="form-group">
            <label>Текущий пароль</label>
            <input v-model="passwordForm.currentPassword" type="password" required />
          </div>
          <div class="form-group">
            <label>Новый пароль</label>
            <input v-model="passwordForm.newPassword" type="password" required minlength="6" />
          </div>
          <div class="form-group">
            <label>Подтверждение нового пароля</label>
            <input v-model="passwordForm.confirmPassword" type="password" required />
          </div>
          <div class="modal-actions">
            <button type="submit" class="save-btn" :disabled="passwordSaving">Сохранить</button>
            <button type="button" class="cancel-btn" @click="closeChangePasswordModal">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { userMangaStatusAPI, progressAPI, mangaAPI, getCoverUrl as apiGetCoverUrl } from '@/api'

const authStore = useAuthStore()
const router = useRouter()

// Состояние вкладок
const activeTab = ref('general')

// Данные активности
const recentProgress = ref([])
const userStatuses = ref([])
const favoriteMangaList = ref([])
const totalChaptersRead = ref(0)

// Модальные окна
const showEditProfileModal = ref(false)
const showChangePasswordModal = ref(false)
const profileSaving = ref(false)
const passwordSaving = ref(false)

// Формы
const editProfileForm = ref({
  username: '',
  email: '',
})
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// Аватар
const avatarUrl = ref(null)
const avatarInput = ref(null)

// Статусы закладок
const bookmarkStatuses = [
  { value: 'reading', label: 'Читаю' },
  { value: 'completed', label: 'Прочитано' },
  { value: 'dropped', label: 'Брошено' },
  { value: 'planned', label: 'Запланировано' },
]
const selectedBookmarkStatus = ref('reading')

// Вычисляемые свойства
const daysSinceRegistration = computed(() => {
  if (!authStore.user?.createdAt) return 0
  const created = new Date(authStore.user.createdAt)
  const now = new Date()
  const diff = now - created
  return Math.floor(diff / (1000 * 60 * 60 * 24))
})

// Методы
const getInitials = (username) => {
  if (!username) return '?'
  return username.charAt(0).toUpperCase()
}

const formatDate = (dateString) => {
  if (!dateString) return 'Неизвестно'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatRelativeDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Сегодня'
  if (days === 1) return 'Вчера'
  if (days < 7) return `${days} дня назад`
  return date.toLocaleDateString('ru-RU')
}

const getCoverUrl = (cover) => {
  if (!cover) return '/placeholder.png'
  return apiGetCoverUrl(cover)
}

const getStatusLabel = (status) => {
  const found = bookmarkStatuses.find((s) => s.value === status)
  return found ? found.label : status
}

const getBookmarksByStatus = (status) => {
  return userStatuses.value.filter((s) => s.status === status)
}

// Загрузка данных
const loadUserActivity = async () => {
  if (!authStore.isLoggedIn) return

  try {
    // Прогресс чтения (загружаем все, потом фильтруем по дате)
    const progressData = await progressAPI.list() // предполагаем, что есть эндпоинт получения всего прогресса
    // Фильтруем последние 3 дня
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const filtered = (progressData || []).filter((p) => new Date(p.updatedAt) >= threeDaysAgo)

    // Обогащаем информацией о манге
    const enriched = await Promise.all(
      filtered.map(async (p) => {
        try {
          const manga = await mangaAPI.get(p.mangaId)
          return {
            ...p,
            mangaTitle: manga.title,
            cover: manga.coverImage || manga.cover_image,
          }
        } catch (e) {
          return { ...p, mangaTitle: 'Неизвестная манга', cover: null }
        }
      })
    )
    recentProgress.value = enriched

    // Подсчёт прочитанных глав (всего)
    totalChaptersRead.value = (progressData || []).length
  } catch (e) {
    console.warn('Не удалось загрузить прогресс', e)
    recentProgress.value = []
  }

  try {
    // Статусы манги
    const statuses = await userMangaStatusAPI.get(authStore.user.id)
    userStatuses.value = statuses || []

    // Обогащаем информацией о манге
    const enrichedStatuses = await Promise.all(
      userStatuses.value.map(async (s) => {
        try {
          const manga = await mangaAPI.get(s.mangaId)
          return {
            ...s,
            mangaTitle: manga.title,
            cover: manga.coverImage || manga.cover_image,
          }
        } catch (e) {
          return { ...s, mangaTitle: 'Неизвестная манга', cover: null }
        }
      })
    )
    userStatuses.value = enrichedStatuses

    // Избранное (favorites) — используем тот же API, но предполагаем что favorites отдельно
    // В текущем API нет получения избранного, можно использовать список манги с статусом?
    // Пока заглушка: используем статусы как избранное
    favoriteMangaList.value = userStatuses.value
  } catch (e) {
    console.warn('Не удалось загрузить статусы', e)
    userStatuses.value = []
  }
}

// Аватар
const loadAvatar = () => {
  const saved = localStorage.getItem(`avatar_${authStore.user?.id}`)
  avatarUrl.value = saved || authStore.user?.avatar || null
}

const triggerAvatarUpload = () => {
  avatarInput.value.click()
}

const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // В реальном приложении здесь загрузка на сервер через FormData
  // Пока сохраняем в localStorage как base64
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarUrl.value = e.target.result
    localStorage.setItem(`avatar_${authStore.user?.id}`, e.target.result)
    // Здесь можно отправить на сервер
    // await authAPI.updateAvatar(...)
  }
  reader.readAsDataURL(file)
}

// Модальные окна
const openEditProfileModal = () => {
  editProfileForm.value = {
    username: authStore.user?.username || '',
    email: authStore.user?.email || '',
  }
  showEditProfileModal.value = true
}

const closeEditProfileModal = () => {
  showEditProfileModal.value = false
}

const saveProfile = async () => {
  profileSaving.value = true
  try {
    // Вызов API для обновления профиля (нужно реализовать в authAPI)
    // await authAPI.updateProfile(editProfileForm.value)
    alert('Функция обновления профиля в разработке')
    closeEditProfileModal()
  } catch (e) {
    alert('Ошибка: ' + e.message)
  } finally {
    profileSaving.value = false
  }
}

const openChangePasswordModal = () => {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  showChangePasswordModal.value = true
}

const closeChangePasswordModal = () => {
  showChangePasswordModal.value = false
}

const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('Пароли не совпадают')
    return
  }
  passwordSaving.value = true
  try {
    // await authAPI.changePassword(passwordForm.value)
    alert('Функция смены пароля в разработке')
    closeChangePasswordModal()
  } catch (e) {
    alert('Ошибка: ' + e.message)
  } finally {
    passwordSaving.value = false
  }
}

const verifyEmail = () => {
  router.push('/verify-email')
}

const logout = () => {
  authStore.logout()
  router.push('/')
}

const deleteAccount = () => {
  if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
    // await authAPI.deleteAccount()
    alert('Функция удаления аккаунта в разработке')
  }
}

// Наблюдатель для переключения вкладок
watch(activeTab, (newTab) => {
  if (newTab === 'activity') {
    loadUserActivity()
  }
})

onMounted(() => {
  loadAvatar()
  if (activeTab.value === 'activity') {
    loadUserActivity()
  }
})
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  padding: var(--spacing-xl) 0;
  background: linear-gradient(135deg, var(--color-background) 0%, #1a1a1a 100%);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h1 {
  font-size: 2.5rem;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.page-header p {
  color: var(--color-text);
  opacity: 0.8;
  font-size: 1.1rem;
}

.profile-wrapper {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--spacing-xl);
}

.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.user-card {
  background: var(--color-panel);
  padding: var(--spacing-lg);
  border-radius: 12px;
  text-align: center;
  box-shadow: var(--shadow-medium);
}

.user-avatar-container {
  position: relative;
  display: inline-block;
}

.user-avatar {
  width: 120px;
  height: 120px;
  background-color: var(--color-primary);
  background-size: cover;
  background-position: center;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  margin: 0 auto var(--spacing-md);
  cursor: pointer;
  transition: opacity 0.2s;
  border: 3px solid var(--color-secondary);
}

.user-avatar:hover {
  opacity: 0.8;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.user-info h3 {
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
  font-size: 1.5rem;
}

.user-email {
  color: var(--color-text);
  opacity: 0.7;
  font-size: 0.9rem;
  margin-bottom: var(--spacing-xs);
}

.user-status {
  color: #ff4444;
  font-size: 0.9rem;
  font-weight: 600;
}

.user-status.verified {
  color: #00cc44;
}

.profile-nav {
  background: var(--color-panel);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-medium);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--color-text);
  text-decoration: none;
  border-left: 4px solid transparent;
  transition: all var(--transition-normal);
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-left-color: var(--color-secondary);
}

.nav-item.active {
  background: rgba(7, 102, 12, 0.1);
  border-left-color: var(--color-primary);
  font-weight: 600;
}

.nav-icon {
  font-size: 1.2rem;
}

.profile-stats {
  background: var(--color-panel);
  padding: var(--spacing-lg);
  border-radius: 12px;
  box-shadow: var(--shadow-medium);
}

.profile-stats h4 {
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
  font-size: 1.2rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: var(--color-text);
  opacity: 0.7;
  font-size: 0.9rem;
}

.stat-value {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 1.1rem;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.content-section {
  background: var(--color-panel);
  padding: var(--spacing-xl);
  border-radius: 12px;
  box-shadow: var(--shadow-medium);
}

.content-section h2 {
  color: var(--color-text);
  margin-bottom: var(--spacing-lg);
  font-size: 1.8rem;
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: var(--spacing-sm);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-item label {
  color: var(--color-text);
  opacity: 0.7;
  font-size: 0.9rem;
}

.info-value {
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.email-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: bold;
}

.email-status.verified {
  background: rgba(0, 255, 0, 0.1);
  color: #00cc44;
}

.email-status:not(.verified) {
  background: rgba(255, 0, 0, 0.1);
  color: #ff4444;
}

code {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
}

/* Активность */
.activity-block {
  margin-bottom: var(--spacing-xl);
}

.activity-block h3 {
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
}

.empty-activity {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.recent-progress-list,
.bookmark-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.progress-item,
.bookmark-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: transform 0.2s;
}

.progress-item:hover,
.bookmark-item:hover {
  transform: translateX(5px);
  background: rgba(255, 255, 255, 0.1);
}

.manga-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  text-decoration: none;
  color: inherit;
}

.manga-thumb {
  width: 50px;
  height: 70px;
  object-fit: cover;
  border-radius: 6px;
  background: var(--color-panel-light);
}

.progress-info,
.bookmark-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.manga-title {
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.chapter-info {
  font-size: 0.9rem;
  color: var(--color-secondary);
}

.progress-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.bookmark-status {
  font-size: 0.8rem;
  color: var(--color-primary);
  text-transform: uppercase;
}

.bookmarks-tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.bookmark-tab {
  background: transparent;
  border: 1px solid var(--color-secondary);
  color: var(--color-text);
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.bookmark-tab:hover {
  background: rgba(128, 131, 42, 0.2);
}

.bookmark-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* Настройки */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.settings-group {
  background: rgba(255, 255, 255, 0.03);
  padding: var(--spacing-lg);
  border-radius: 12px;
}

.settings-group h3 {
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
  font-size: 1.3rem;
}

.settings-group.danger {
  border: 1px solid #ff4444;
  background: rgba(255, 0, 0, 0.05);
}

.settings-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.settings-btn:hover {
  background: rgba(7, 102, 12, 0.2);
  border-color: var(--color-primary);
  transform: translateX(5px);
}

.settings-btn.warning {
  border-color: #ffaa00;
  color: #ffaa00;
}

.settings-btn.danger-btn {
  border-color: #ff4444;
  color: #ff4444;
}

.settings-btn.danger-btn:hover {
  background: rgba(255, 0, 0, 0.2);
}

/* Модальные окна */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.modal-content {
  background: #202020;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  padding: 25px;
}

.modal-content h3 {
  color: var(--color-primary);
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 12px;
  background: #2b2b2b;
  border: 1px solid #80832a;
  border-radius: 8px;
  color: #fff;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
}

.save-btn,
.cancel-btn {
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  font-weight: 600;
}

.save-btn {
  background: #07660c;
  color: white;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: none;
  border: 1px solid #80832a;
  color: #80832a;
}

/* Адаптивность */
@media (max-width: 992px) {
  .profile-wrapper {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .profile-page {
    padding: var(--spacing-lg) 0;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .content-section {
    padding: var(--spacing-lg);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>