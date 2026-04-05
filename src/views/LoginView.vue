<template>
  <div class="login-page">
    <div class="container">
      <!-- Заголовок -->
      <div class="page-header">
        <h1>Вход в аккаунт</h1>
        <p>Добро пожаловать обратно!</p>
      </div>
      
      <!-- Основной контент -->
      <div class="login-wrapper">
        <!-- Форма входа -->
        <div class="login-form">
          <form @submit.prevent="handleLogin" class="login-form-content">
            <!-- Email -->
            <div class="form-group">
              <label for="email">
                Email *
                <span class="field-status" :class="{ 'valid': emailValid }">
                  {{ emailValid ? '✓' : '!' }}
                </span>
              </label>
              <input
                type="email"
                id="email"
                v-model="formData.email"
                @input="validateEmail"
                placeholder="your@email.com"
                :class="{ 'error': errors.email }"
                required
              />
              <div v-if="errors.email" class="error-message">
                {{ errors.email }}
              </div>
            </div>
            
            <!-- Пароль -->
            <div class="form-group">
              <label for="password">
                Пароль *
                <span class="field-status" :class="{ 'valid': passwordValid }">
                  {{ passwordValid ? '✓' : '!' }}
                </span>
              </label>
              <div class="password-input-wrapper">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="password"
                  v-model="formData.password"
                  @input="validatePassword"
                  placeholder="Введите ваш пароль"
                  :class="{ 'error': errors.password }"
                  required
                />
                <button
                  type="button"
                  @click="togglePasswordVisibility"
                  class="password-toggle"
                  :title="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
                >
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              <div v-if="errors.password" class="error-message">
                {{ errors.password }}
              </div>
            </div>
            
            <!-- Запомнить меня и забыли пароль -->
            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" v-model="formData.rememberMe" />
                <span>Запомнить меня</span>
              </label>
              
              <router-link to="/forgot-password" class="forgot-password">
                Забыли пароль?
              </router-link>
            </div>
            
            <!-- Кнопка входа -->
            <button
            type="submit"
            :disabled="!isFormValid || isLoading"
            class="submit-btn"
            :class="{ 'loading': isLoading }">
            <span v-if="!isLoading">Войти</span>
            <span v-else>Вход...</span>
            </button>
            
            <!-- Сообщения -->
            <div v-if="authStore.error" class="error-message">
              ❌ {{ authStore.error }}
            </div>
            
            <div v-if="successMessage" class="success-message">
              ✅ {{ successMessage }}
            </div>
            
            <!-- Демо аккаунты -->
            <div class="demo-accounts" v-if="showDemoAccounts">
              <h4>💡 Демо-аккаунты (для тестирования):</h4>
              <div class="demo-account-list">
                <div 
                  v-for="account in demoAccounts" 
                  :key="account.email"
                  class="demo-account"
                  @click="fillDemoAccount(account)"
                >
                  <div class="account-info">
                    <strong>{{ account.username }}</strong>
                    <span>{{ account.email }}</span>
                  </div>
                  <button class="use-btn">Использовать</button>
                </div>
              </div>
            </div>
          </form>
          
          <!-- Социальный вход (заглушка) -->
          <div class="social-login">
            <div class="divider">
              <span>Или войдите через</span>
            </div>
            
            <div class="social-buttons">
              <button class="social-btn google" disabled>
                <span class="social-icon">🔍</span>
                <span>Google</span>
              </button>
              <button class="social-btn github" disabled>
                <span class="social-icon">🐙</span>
                <span>GitHub</span>
              </button>
              <button class="social-btn vk" disabled>
                <span class="social-icon">🇷🇺</span>
                <span>VK</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Боковая информация -->
        <div class="login-info">
          <div class="info-card">
            <h3>🎯 Преимущества входа</h3>
            <ul>
              <li>Продолжить чтение с того же места</li>
              <li>Доступ к избранным мангам</li>
              <li>Синхронизация между устройствами</li>
              <li>Персональные рекомендации</li>
              <li>Участие в обсуждениях</li>
            </ul>
          </div>
          
          <div class="info-card">
            <h3>📱 Быстрый доступ</h3>
            <p>Используйте быстрые клавиши для удобства:</p>
            <div class="shortcuts">
              <kbd>Tab</kbd> - Переход между полями
              <kbd>Enter</kbd> - Отправить форму
              <kbd>Esc</kbd> - Очистить форму
            </div>
          </div>
          
          <div class="info-card security">
            <h3>🔒 Безопасность</h3>
            <p>Ваши данные защищены шифрованием.</p>
            <p>Мы никогда не передаем вашу личную информацию третьим лицам.</p>
          </div>
        </div>
      </div>
      
      <!-- Ссылки на другие страницы -->
      <div class="auth-links">
        <p>
          Нет аккаунта? 
          <router-link to="/register" class="link">Зарегистрироваться</router-link>
        </p>
        <p>
          Не приходит письмо с подтверждением? 
          <router-link to="/verify-email" class="link">Подтвердить email</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  ForumCategoryCard,
  ForumTopicCard,
  NewTopicModal,
  QuickSearch
} from '@/components/forum'
import Pagination from '@/components/catalog/Pagination.vue'

// Инициализация
const router = useRouter()
const authStore = useAuthStore()

// Состояние
const formData = ref({
  email: '',
  password: '',
  rememberMe: true
})
const showPassword = ref(false)
const isLoading = ref(false)
const successMessage = ref('')
const showDemoAccounts = ref(false)

// Ошибки
const errors = ref({
  email: '',
  password: ''
})

// Демо аккаунты
const demoAccounts = ref([
  { username: 'Демо-пользователь', email: 'demo@example.com', password: 'demopass123' },
  { username: 'Тестовый аккаунт', email: 'test@example.com', password: 'testpass123' }
])

// Валидация
const emailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(formData.value.email) && !errors.value.email
})

const passwordValid = computed(() => {
  return formData.value.password.length >= 6 && !errors.value.password
})

const isFormValid = computed(() => {
  return emailValid.value && passwordValid.value
})

// Методы
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(formData.value.email)) {
    errors.value.email = 'Введите корректный email адрес'
    return false
  }
  
  errors.value.email = ''
  return true
}

const validatePassword = () => {
  if (formData.value.password.length < 6) {
    errors.value.password = 'Пароль должен содержать минимум 6 символов'
    return false
  }
  
  errors.value.password = ''
  return true
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  if (!validateEmail() || !validatePassword()) {
    return
  }
  
  isLoading.value = true
  successMessage.value = ''
  
  try {
    const result = await authStore.login({
      email: formData.value.email,
      password: formData.value.password
    })
    
    if (result.success) {
      successMessage.value = result.message
      
      // Перенаправляем на главную через секунду
      setTimeout(() => {
        router.push('/')
      }, 1000)
    }
  } catch (error) {
    console.error('Ошибка входа:', error)
  } finally {
    isLoading.value = false
  }
}

const fillDemoAccount = (account) => {
  formData.value.email = account.email
  formData.value.password = account.password
  
  validateEmail()
  validatePassword()
}

const toggleDemoAccounts = () => {
  showDemoAccounts.value = !showDemoAccounts.value
}

onMounted(() => {
  // В демо-режиме показываем демо аккаунты
  if (process.env.NODE_ENV === 'development') {
    showDemoAccounts.value = true
  }
  
  // Автофокус на поле email
  const emailInput = document.getElementById('email')
  if (emailInput) {
    setTimeout(() => emailInput.focus(), 100)
  }
})

</script>

<style scoped>
.login-page {
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  padding: var(--spacing-xl) 0;
  background: linear-gradient(135deg, var(--color-background) 0%, #1a1a1a 100%);
}

.page-header {
  text-align: center;
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

.login-wrapper {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--spacing-xl);
  max-width: 1000px;
  margin: 0 auto;
}

.login-form {
  background: var(--color-panel);
  padding: var(--spacing-xl);
  border-radius: 12px;
  box-shadow: var(--shadow-heavy);
}

.login-form-content {
  margin-bottom: var(--spacing-xl);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text);
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 0, 0, 0.1);
  color: #ff4444;
  font-size: 0.8rem;
  font-weight: bold;
}

.field-status.valid {
  background: rgba(0, 255, 0, 0.1);
  color: #00cc44;
}

input[type="email"],
input[type="password"],
input[type="text"] {
  width: 100%;
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 1rem;
  transition: all var(--transition-normal);
}

input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(7, 102, 12, 0.2);
}

input.error {
  border-color: #ff4444;
}

.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  opacity: 0.7;
}

.password-toggle:hover {
  opacity: 1;
}

.error-message {
  color: #ff4444;
  font-size: 0.9rem;
  margin-top: 5px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text);
  cursor: pointer;
}

.remember-me input {
  margin: 0;
}

.forgot-password {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: color var(--transition-normal);
}

.forgot-password:hover {
  color: color-mix(in srgb, var(--color-primary) 90%, white);
  text-decoration: underline;
}

.submit-btn {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.submit-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-primary) 90%, white);
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn.loading {
  opacity: 0.7;
  cursor: wait;
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success-message {
  background: rgba(0, 255, 0, 0.1);
  color: #00cc44;
  padding: var(--spacing-md);
  border-radius: 8px;
  margin-top: var(--spacing-lg);
  border-left: 4px solid #00cc44;
}

.demo-accounts {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.demo-accounts h4 {
  color: var(--color-secondary);
  margin-bottom: var(--spacing-md);
  font-size: 1rem;
}

.demo-account-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.demo-account {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background: rgba(128, 131, 42, 0.1);
  border: 1px solid var(--color-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.demo-account:hover {
  background: rgba(128, 131, 42, 0.2);
  transform: translateY(-2px);
}

.account-info {
  display: flex;
  flex-direction: column;
}

.account-info strong {
  color: var(--color-text);
}

.account-info span {
  color: var(--color-text);
  opacity: 0.7;
  font-size: 0.9rem;
}

.use-btn {
  background: var(--color-secondary);
  color: white;
  border: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color var(--transition-normal);
}

.use-btn:hover {
  background: color-mix(in srgb, var(--color-secondary) 90%, white);
}

.social-login {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text);
  opacity: 0.7;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.divider span {
  padding: 0 var(--spacing-md);
}

.social-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.social-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-normal);
  opacity: 0.5;
}

.social-btn:disabled {
  cursor: not-allowed;
}

.social-icon {
  font-size: 1.5rem;
}

.login-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.info-card {
  background: var(--color-panel);
  padding: var(--spacing-lg);
  border-radius: 12px;
  box-shadow: var(--shadow-medium);
}

.info-card h3 {
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
  font-size: 1.3rem;
}

.info-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-card li {
  color: var(--color-text);
  opacity: 0.8;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-left: 25px;
  position: relative;
}

.info-card li:before {
  content: '•';
  color: var(--color-primary);
  position: absolute;
  left: 10px;
  font-size: 1.5rem;
}

.info-card li:last-child {
  border-bottom: none;
}

.shortcuts {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

kbd {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--color-text);
}

.security {
  background: rgba(7, 102, 12, 0.1);
  border-left: 4px solid var(--color-primary);
}

.security p {
  color: var(--color-text);
  opacity: 0.8;
  margin-bottom: var(--spacing-sm);
  line-height: 1.5;
}

.auth-links {
  text-align: center;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.auth-links p {
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  transition: color var(--transition-normal);
}

.link:hover {
  color: color-mix(in srgb, var(--color-primary) 90%, white);
  text-decoration: underline;
}

/* Адаптивность */
@media (max-width: 992px) {
  .login-wrapper {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
}

@media (max-width: 768px) {
  .login-page {
    padding: var(--spacing-lg) 0;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .login-form,
  .info-card {
    padding: var(--spacing-lg);
  }
  
  .social-buttons {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .login-form,
  .info-card {
    padding: var(--spacing-md);
  }
  
  .page-header h1 {
    font-size: 1.8rem;
  }
  
  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}
</style>