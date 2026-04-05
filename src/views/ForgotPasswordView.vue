<template>
  <div class="forgot-password-page">
    <div class="container">
      <!-- Заголовок -->
      <div class="page-header">
        <h1>Восстановление пароля</h1>
        <p>Введите ваш email для получения инструкций</p>
      </div>
      
      <!-- Основной контент -->
      <div class="forgot-password-wrapper">
        <!-- Форма восстановления -->
        <div class="forgot-password-form">
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
              v-model="email"
              @input="validateEmail"
              placeholder="your@email.com"
              :class="{ 'error': errors.email }"
              required
            />
            <div v-if="errors.email" class="error-message">
              {{ errors.email }}
            </div>
          </div>
          
          <!-- Кнопка отправки -->
          <button
            @click="handleSubmit"
            :disabled="!emailValid || isLoading"
            class="submit-btn"
            :class="{ 'loading': isLoading }"
          >
            <span v-if="!isLoading">Отправить инструкции</span>
            <span v-else class="loading-text">
              <span class="spinner"></span> Отправка...
            </span>
          </button>
          
          <!-- Сообщения -->
          <div v-if="authStore.error" class="error-message">
            ❌ {{ authStore.error }}
          </div>
          
          <div v-if="successMessage" class="success-message">
            ✅ {{ successMessage }}
          </div>
          
          <!-- Демо информация -->
          <div v-if="showDemoInfo" class="demo-info">
            <h4>💡 Демо-режим</h4>
            <p>Токен восстановления: <strong>{{ demoToken }}</strong></p>
            <router-link 
              :to="{ name: 'ResetPassword', query: { token: demoToken } }"
              class="demo-link"
            >
              Перейти к сбросу пароля
            </router-link>
          </div>
          
          <!-- Инструкции -->
          <div class="instructions">
            <h3>Что делать дальше?</h3>
            <ol class="steps-list">
              <li>Проверьте вашу почту (включая папку "Спам")</li>
              <li>Найдите письмо от Forgotten Team</li>
              <li>Перейдите по ссылке из письма</li>
              <li>Установите новый пароль</li>
            </ol>
          </div>
        </div>
        
        <!-- Боковая информация -->
        <div class="side-info">
          <div class="info-card">
            <h3>🔒 Безопасность</h3>
            <p>Ссылка для сброса пароля действительна 1 час.</p>
            <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
          </div>
          
          <div class="info-card">
            <h3>📧 Не приходит письмо?</h3>
            <ul>
              <li>Проверьте папку "Спам" или "Рассылки"</li>
              <li>Убедитесь, что ввели правильный email</li>
              <li>Подождите несколько минут</li>
              <li>
                <router-link to="/support" class="link">
                  Обратиться в поддержку
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Ссылки на другие страницы -->
      <div class="auth-links">
        <p>
          Вспомнили пароль? 
          <router-link to="/login" class="link">Войти</router-link>
        </p>
        <p>
          Нет аккаунта? 
          <router-link to="/register" class="link">Зарегистрироваться</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Инициализация
const router = useRouter()
const authStore = useAuthStore()

// Состояние
const email = ref('')
const isLoading = ref(false)
const successMessage = ref('')
const showDemoInfo = ref(false)
const demoToken = ref('')

// Ошибки
const errors = ref({
  email: ''
})

// Валидация
const emailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value) && !errors.value.email
})

// Методы
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email.value)) {
    errors.value.email = 'Введите корректный email адрес'
    return false
  }
  
  errors.value.email = ''
  return true
}

const handleSubmit = async () => {
  if (!validateEmail()) {
    return
  }
  
  isLoading.value = true
  successMessage.value = ''
  showDemoInfo.value = false
  
  try {
    const result = await authStore.forgotPassword(email.value)
    
    if (result.success) {
      successMessage.value = result.message
      demoToken.value = result.resetToken
      showDemoInfo.value = true
    }
  } catch (error) {
    console.error('Ошибка восстановления:', error)
  } finally {
    isLoading.value = false
  }
}

const loadDemoToken = () => {
  // Загружаем токен из sessionStorage для демо
  const savedToken = sessionStorage.getItem('last_reset_token')
  const savedEmail = sessionStorage.getItem('last_reset_email')
  
  if (savedToken) {
    demoToken.value = savedToken
  }
  
  if (savedEmail && !email.value) {
    email.value = savedEmail
  }
}

onMounted(() => {
  loadDemoToken()
})
</script>

<style scoped>
.forgot-password-page {
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

.forgot-password-wrapper {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--spacing-xl);
  max-width: 1000px;
  margin: 0 auto;
}

.forgot-password-form {
  background: var(--color-panel);
  padding: var(--spacing-xl);
  border-radius: 12px;
  box-shadow: var(--shadow-heavy);
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

input[type="email"] {
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

.error-message {
  color: #ff4444;
  font-size: 0.9rem;
  margin-top: 5px;
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
  margin-bottom: var(--spacing-lg);
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
  margin-bottom: var(--spacing-lg);
  border-left: 4px solid #00cc44;
}

.demo-info {
  background: rgba(128, 131, 42, 0.1);
  border: 1px solid var(--color-secondary);
  border-radius: 8px;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.demo-info h4 {
  color: var(--color-secondary);
  margin-bottom: var(--spacing-sm);
}

.demo-link {
  display: inline-block;
  background: var(--color-secondary);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 6px;
  text-decoration: none;
  margin-top: var(--spacing-sm);
  font-weight: 600;
  transition: background-color var(--transition-normal);
}

.demo-link:hover {
  background: color-mix(in srgb, var(--color-secondary) 90%, white);
}

.instructions {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.instructions h3 {
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
  font-size: 1.2rem;
}

.steps-list {
  list-style: decimal;
  padding-left: 20px;
  margin: 0;
}

.steps-list li {
  color: var(--color-text);
  opacity: 0.8;
  margin-bottom: var(--spacing-sm);
  padding-left: var(--spacing-sm);
}

.side-info {
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

.info-card p {
  color: var(--color-text);
  opacity: 0.8;
  margin-bottom: var(--spacing-sm);
  line-height: 1.5;
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

/* Адаптивность */
@media (max-width: 992px) {
  .forgot-password-wrapper {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
}

@media (max-width: 768px) {
  .forgot-password-page {
    padding: var(--spacing-lg) 0;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .forgot-password-form,
  .info-card {
    padding: var(--spacing-lg);
  }
}

@media (max-width: 480px) {
  .forgot-password-form,
  .info-card {
    padding: var(--spacing-md);
  }
  
  .page-header h1 {
    font-size: 1.8rem;
  }
}
</style>