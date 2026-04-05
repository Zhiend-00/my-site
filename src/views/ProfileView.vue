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
            <div class="user-avatar">
              {{ getInitials(authStore.user?.username) }}
            </div>
            <div class="user-info">
              <h3>{{ authStore.user?.username }}</h3>
              <p class="user-email">{{ authStore.user?.email }}</p>
              <p class="user-status" :class="{ 'verified': authStore.isEmailVerified }">
                {{ authStore.isEmailVerified ? '✓ Email подтвержден' : '✗ Email не подтвержден' }}
              </p>
            </div>
          </div>
          
          <nav class="profile-nav">
            <router-link to="/profile" class="nav-item active">
              <span class="nav-icon">👤</span>
              <span>Общая информация</span>
            </router-link>
            <router-link to="/profile/settings" class="nav-item">
              <span class="nav-icon">⚙️</span>
              <span>Настройки</span>
            </router-link>
            <router-link to="/profile/reading" class="nav-item">
              <span class="nav-icon">📚</span>
              <span>Прогресс чтения</span>
            </router-link>
            <router-link to="/profile/bookmarks" class="nav-item">
              <span class="nav-icon">🔖</span>
              <span>Закладки</span>
            </router-link>
            <router-link to="/profile/security" class="nav-item">
              <span class="nav-icon">🔒</span>
              <span>Безопасность</span>
            </router-link>
          </nav>
          
          <div class="profile-stats">
            <h4>Статистика</h4>
            <div class="stat-item">
              <span class="stat-label">Прочитано глав:</span>
              <span class="stat-value">24</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">В избранном:</span>
              <span class="stat-value">5</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">На сайте:</span>
              <span class="stat-value">7 дней</span>
            </div>
          </div>
        </div>
        
        <!-- Основное содержимое -->
        <div class="profile-content">
          <div class="content-section">
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
                  <span class="email-status" :class="{ 'verified': authStore.isEmailVerified }">
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
          
          <div class="content-section">
            <h2>Действия с аккаунтом</h2>
            
            <div class="action-grid">
              <button @click="verifyEmail" class="action-btn" v-if="!authStore.isEmailVerified">
                <span class="action-icon">📧</span>
                <span class="action-text">Подтвердить Email</span>
                <span class="action-desc">Требуется для полного доступа</span>
              </button>
              
              <button @click="changePassword" class="action-btn">
                <span class="action-icon">🔐</span>
                <span class="action-text">Изменить пароль</span>
                <span class="action-desc">Обновите пароль для безопасности</span>
              </button>
              
              <button @click="editProfile" class="action-btn">
                <span class="action-icon">✏️</span>
                <span class="action-text">Редактировать профиль</span>
                <span class="action-desc">Изменить имя и настройки</span>
              </button>
              
              <button @click="exportData" class="action-btn">
                <span class="action-icon">📤</span>
                <span class="action-text">Экспорт данных</span>
                <span class="action-desc">Скачать ваши данные</span>
              </button>
            </div>
          </div>
          
          <div class="content-section danger-zone">
            <h2>Опасная зона</h2>
            <p class="danger-warning">
              ⚠️ Эти действия необратимы. Будьте осторожны.
            </p>
            
            <div class="danger-actions">
              <button @click="deleteAccount" class="danger-btn">
                <span class="danger-icon">🗑️</span>
                <span>Удалить аккаунт</span>
              </button>
              
              <button @click="logout" class="logout-btn">
                <span class="logout-icon">🚪</span>
                <span>Выйти из аккаунта</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

// Инициализация
const authStore = useAuthStore()
const router = useRouter()

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
    year: 'numeric'
  })
}

const verifyEmail = () => {
  router.push('/verify-email')
}

const changePassword = () => {
  router.push('/forgot-password')
}

const editProfile = () => {
  alert('Редактирование профиля - в разработке')
}

const exportData = () => {
  alert('Экспорт данных - в разработке')
}

const deleteAccount = () => {
  if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
    alert('Удаление аккаунта - в разработке')
  }
}

const logout = () => {
  authStore.logout()
  router.push('/')
}
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

.user-avatar {
  width: 80px;
  height: 80px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  margin: 0 auto var(--spacing-md);
}

.user-info h3 {
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
  font-size: 1.3rem;
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
  font-size: 1.5rem;
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

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.action-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: var(--spacing-md);
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-normal);
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.action-btn:hover {
  background: rgba(7, 102, 12, 0.1);
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-xs);
}

.action-text {
  font-weight: 600;
  font-size: 1rem;
}

.action-desc {
  font-size: 0.9rem;
  opacity: 0.7;
}

.danger-zone {
  border: 2px solid #ff4444;
  background: rgba(255, 0, 0, 0.05);
}

.danger-warning {
  color: #ff4444;
  margin-bottom: var(--spacing-lg);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.danger-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.danger-btn {
  background: rgba(255, 0, 0, 0.1);
  border: 2px solid #ff4444;
  color: #ff4444;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.danger-btn:hover {
  background: #ff4444;
  color: white;
}

.logout-btn {
  background: transparent;
  border: 2px solid var(--color-secondary);
  color: var(--color-secondary);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.logout-btn:hover {
  background: var(--color-secondary);
  color: white;
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
  
  .action-grid {
    grid-template-columns: 1fr;
  }
  
  .danger-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .content-section {
    padding: var(--spacing-md);
  }
  
  .page-header h1 {
    font-size: 1.8rem;
  }
}
</style>