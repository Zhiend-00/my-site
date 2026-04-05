<template>
  <div class="reset-password-page">
    <div class="container">
      <!-- Заголовок -->
      <div class="page-header">
        <h1>Сброс пароля</h1>
        <p>Установите новый пароль для вашего аккаунта</p>
      </div>
      
      <!-- Основной контент -->
      <div class="reset-password-wrapper">
        <!-- Форма сброса -->
        <div class="reset-password-form">
          <div v-if="!token" class="token-not-found">
            <div class="warning-icon">⚠️</div>
            <h3>Токен не найден</h3>
            <p>Ссылка для сброса пароля недействительна или устарела.</p>
            <router-link to="/forgot-password" class="retry-link">
              Запросить новую ссылку
            </router-link>
          </div>
          
          <form v-else @submit.prevent="handleSubmit" class="reset-form">
            <!-- Токен (скрытый) -->
            <input type="hidden" v-model="token" />
            
            <!-- Новый пароль -->
            <div class="form-group">
              <label for="newPassword">
                Новый пароль *
                <span class="field-status" :class="{ 'valid': passwordValid }">
                  {{ passwordValid ? '✓' : '!' }}
                </span>
              </label>
              <div class="password-input-wrapper">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="newPassword"
                  v-model="formData.newPassword"
                  @input="validatePassword"
                  placeholder="Минимум 6 символов"
                  :class="{ 'error': errors.newPassword }"
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
              <div v-if="errors.newPassword" class="error-message">
                {{ errors.newPassword }}
              </div>
              <div class="password-strength">
                <div class="strength-bar" :class="passwordStrengthClass"></div>
                <span class="strength-text">{{ passwordStrengthText }}</span>
              </div>
            </div>
            
            <!-- Подтверждение пароля -->
            <div class="form-group">
              <label for="confirmPassword">
                Подтверждение пароля *
                <span class="field-status" :class="{ 'valid': confirmPasswordValid }">
                  {{ confirmPasswordValid ? '✓' : '!' }}
                </span>
              </label>
              <div class="password-input-wrapper">
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  id="confirmPassword"
                  v-model="formData.confirmPassword"
                  @input="validateConfirmPassword"
                  placeholder="Повторите новый пароль"
                  :class="{ 'error': errors.confirmPassword }"
                  required
                />
                <button
                  type="button"
                  @click="toggleConfirmPasswordVisibility"
                  class="password-toggle"
                  :title="showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'"
                >
                  {{ showConfirmPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              <div v-if="errors.confirmPassword" class="error-message">
                {{ errors.confirmPassword }}
              </div>
            </div>
            
            <!-- Требования к паролю -->
            <div class="password-requirements">
              <h4>Требования к паролю:</h4>
              <ul>
                <li :class="{ 'met': formData.newPassword.length >= 6 }">
                  Минимум 6 символов
                </li>
                <li :class="{ 'met': hasUpperCase }">
                  Заглавная буква
                </li>
                <li :class="{ 'met': hasLowerCase }">
                  Строчная буква
                </li>
                <li :class="{ 'met': hasNumber }">
                  Цифра
                </li>
              </ul>
            </div>
            
            <!-- Кнопка отправки -->
            <button
              type="submit"
              :disabled="!isFormValid || isLoading"
              class="submit-btn"
              :class="{ 'loading': isLoading }"
            >
              <span v-if="!isLoading">Установить новый пароль</span>
              <span v-else class="loading-text">
                <span class="spinner"></span> Обновление...
              </span>
            </button>
            
            <!-- Сообщения -->
            <div v-if="authStore.error" class="error-message">
              ❌ {{ authStore.error }}
            </div>
            
            <div v-if="successMessage" class="success-message">
              ✅ {{ successMessage }}
              <div v-if="countdown > 0" class="redirect-countdown">
                Перенаправление на вход через {{ countdown }} сек...
              </div>
            </div>
          </form>
        </div>
        
        <!-- Боковая информация -->
        <div class="side-info">
          <div class="info-card">
            <h3>🔐 Советы по безопасности</h3>
            <ul>
              <li>Используйте уникальный пароль</li>
              <li>Не используйте личную информацию</li>
              <li>Сочетайте буквы, цифры и символы</li>
              <li>Регулярно меняйте пароли</li>
              <li>Не используйте один пароль на разных сайтах</li>
            </ul>
          </div>
          
          <div class="info-card">
            <h3>⏰ Временные ограничения</h3>
            <p>Ссылка для сброса пароля действительна 1 час.</p>
            <p>После успешного сброса старая ссылка станет недействительной.</p>
          </div>
        </div>
      </div>
      
      <!-- Ссылки -->
      <div class="auth-links">
        <p>
          Вспомнили пароль? 
          <router-link to="/login" class="link">Войти</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Инициализация
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Состояние
const token = ref(route.query.token || '')
const formData = ref({
  newPassword: '',
  confirmPassword: ''
})
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const successMessage = ref('')
const countdown = ref(0)

// Ошибки
const errors = ref({
  newPassword: '',
  confirmPassword: ''
})

// Проверка пароля
const hasUpperCase = computed(() => /[A-Z]/.test(formData.value.newPassword))
const hasLowerCase = computed(() => /[a-z]/.test(formData.value.newPassword))
const hasNumber = computed(() => /\d/.test(formData.value.newPassword))

// Валидация
const passwordValid = computed(() => {
  return formData.value.newPassword.length >= 6 && !errors.value.newPassword
})

const confirmPasswordValid = computed(() => {
  return (
    formData.value.newPassword === formData.value.confirmPassword &&
    formData.value.confirmPassword.length > 0 &&
    !errors.value.confirmPassword
  )
})

const isFormValid = computed(() => {
  return passwordValid.value && confirmPasswordValid.value
})

// Сложность пароля
const passwordStrength = computed(() => {
  let strength = 0
  if (formData.value.newPassword.length >= 6) strength++
  if (hasUpperCase.value) strength++
  if (hasLowerCase.value) strength++
  if (hasNumber.value) strength++
  if (formData.value.newPassword.length >= 10) strength++
  if (/[^A-Za-z0-9]/.test(formData.value.newPassword)) strength++
  
  return strength
})

const passwordStrengthClass = computed(() => {
  if (formData.value.newPassword.length === 0) return 'empty'
  if (passwordStrength.value <= 2) return 'weak'
  if (passwordStrength.value <= 4) return 'medium'
  return 'strong'
})

const passwordStrengthText = computed(() => {
  if (formData.value.newPassword.length === 0) return ''
  if (passwordStrength.value <= 2) return 'Слабый'
  if (passwordStrength.value <= 4) return 'Средний'
  return 'Сильный'
})

// Методы
const validatePassword = () => {
  const password = formData.value.newPassword
  
  if (password.length < 6) {
    errors.value.newPassword = 'Пароль должен содержать минимум 6 символов'
    return false
  }
  
  errors.value.newPassword = ''
  return true
}

const validateConfirmPassword = () => {
  if (formData.value.newPassword !== formData.value.confirmPassword) {
    errors.value.confirmPassword = 'Пароли не совпадают'
    return false
  }
  
  errors.value.confirmPassword = ''
  return true
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const handleSubmit = async () => {
  if (!validatePassword() || !validateConfirmPassword()) {
    return
  }
  
  if (!token.value) {
    authStore.error = 'Токен сброса не найден'
    return
  }
  
  isLoading.value = true
  successMessage.value = ''
  
  try {
    const result = await authStore.resetPassword(
      token.value,
      formData.value.newPassword
    )
    
    if (result.success) {
      successMessage.value = result.message
      
      // Запускаем таймер перенаправления
      countdown.value = 5
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
          router.push('/login')
        }
      }, 1000)
      
      // Очищаем форму
      formData.value.newPassword = ''
      formData.value.confirmPassword = ''
    }
  } catch (error) {
    console.error('Ошибка сброса пароля:', error)
  } finally {
    isLoading.value = false
  }
}

// Загрузка демо-токена
const loadDemoToken = () => {
  if (!token.value) {
    const savedToken = sessionStorage.getItem('last_reset_token')
    if (savedToken) {
      token.value = savedToken
    }
  }
}

onMounted(() => {
  loadDemoToken()
})

onUnmounted(() => {
  countdown.value = 0
})
</script>

<style scoped>
.reset-password-page {
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

.reset-password-wrapper {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--spacing-xl);
  max-width: 1000px;
  margin: 0 auto;
}

.reset-password-form {
  background: var(--color-panel);
  padding: var(--spacing-xl);
  border-radius: 12px;
  box-shadow: var(--shadow-heavy);
}

.token-not-found {
  text-align: center;
  padding: var(--spacing-xl);
}

.warning-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.token-not-found h3 {
  color: #ffaa00;
  margin-bottom: var(--spacing-sm);
  font-size: 1.5rem;
}

.token-not-found p {
  color: var(--color-text);
  opacity: 0.8;
  margin-bottom: var(--spacing-lg);
}

.retry-link {
  display: inline-block;
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all var(--transition-normal);
}

.retry-link:hover {
  background: color-mix(in srgb, var(--color-primary) 90%, white);
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.reset-form {
  margin-top: var(--spacing-lg);
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

.password-input-wrapper {
  position: relative;
}

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

.password-strength {
  margin-top: var(--spacing-sm);
}

.strength-bar {
  height: 4px;
  border-radius: 2px;
  margin-bottom: 5px;
  transition: width var(--transition-normal);
}

.strength-bar.empty {
  width: 0;
  background: transparent;
}

.strength-bar.weak {
  width: 33%;
  background: #ff4444;
}

.strength-bar.medium {
  width: 66%;
  background: #ffaa00;
}

.strength-bar.strong {
  width: 100%;
  background: #00cc44;
}

.strength-text {
  font-size: 0.8rem;
  color: var(--color-text);
  opacity: 0.7;
}

.password-requirements {
  background: rgba(255, 255, 255, 0.05);
  padding: var(--spacing-md);
  border-radius: 8px;
  margin-bottom: var(--spacing-lg);
  border-left: 4px solid var(--color-secondary);
}

.password-requirements h4 {
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
  font-size: 1rem;
}

.password-requirements ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.password-requirements li {
  color: var(--color-text);
  opacity: 0.6;
  font-size: 0.9rem;
  margin-bottom: 3px;
  padding-left: 20px;
  position: relative;
}

.password-requirements li:before {
  content: '✗';
  position: absolute;
  left: 0;
}

.password-requirements li.met {
  opacity: 1;
  color: #00cc44;
}

.password-requirements li.met:before {
  content: '✓';
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

.redirect-countdown {
  margin-top: var(--spacing-sm);
  font-size: 0.9rem;
  opacity: 0.8;
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

.info-card p {
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
  .reset-password-wrapper {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
}

@media (max-width: 768px) {
  .reset-password-page {
    padding: var(--spacing-lg) 0;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .reset-password-form,
  .info-card {
    padding: var(--spacing-lg);
  }
}

@media (max-width: 480px) {
  .reset-password-form,
  .info-card {
    padding: var(--spacing-md);
  }
  
  .page-header h1 {
    font-size: 1.8rem;
  }
}
</style>