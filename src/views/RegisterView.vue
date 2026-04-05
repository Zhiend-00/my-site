<template>
  <div class="register-page">
    <div class="container">
      <!-- Заголовок -->
      <div class="page-header">
        <h1>Регистрация</h1>
        <p>Создайте аккаунт для доступа ко всем функциям</p>
      </div>
      
      <!-- Форма регистрации -->
      <div class="register-form-wrapper">
        <form @submit.prevent="handleRegister" class="register-form">
          <!-- Имя пользователя -->
          <div class="form-group">
            <label for="username">
              Имя пользователя *
              <span class="field-status" :class="{ 'valid': usernameValid }">
                {{ usernameValid ? '✓' : '!' }}
              </span>
            </label>
            <input
              type="text"
              id="username"
              v-model="formData.username"
              @input="validateUsername"
              placeholder="Придумайте имя пользователя"
              :class="{ 'error': errors.username }"
              required
            />
            <div v-if="errors.username" class="error-message">
              {{ errors.username }}
            </div>
            <div v-if="usernameTips" class="field-tips">
              {{ usernameTips }}
            </div>
          </div>
          
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
                placeholder="Минимум 6 символов"
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
            <div class="password-strength">
              <div class="strength-bar" :class="passwordStrengthClass"></div>
              <span class="strength-text">{{ passwordStrengthText }}</span>
            </div>
            <ul class="password-requirements">
              <li :class="{ 'met': formData.password.length >= 6 }">
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
                placeholder="Повторите пароль"
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
          
          <!-- Соглашение -->
          <div class="form-group agreement">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="formData.agreeToTerms"
                required
              />
              <span>
                Я согласен с 
                <router-link to="/terms" class="link">правилами использования</router-link>
                и 
                <router-link to="/privacy" class="link">политикой конфиденциальности</router-link>
              </span>
            </label>
            <div v-if="errors.agreeToTerms" class="error-message">
              {{ errors.agreeToTerms }}
            </div>
          </div>
          
          <!-- Кнопка отправки -->
          <button
            type="submit"
            :disabled="isLoading || !isFormValid"
            class="submit-btn"
            :class="{ 'loading': isLoading }"
          >
            <span v-if="!isLoading">Зарегистрироваться</span>
            <span v-else class="loading-text">
              <span class="spinner"></span> Регистрация...
            </span>
          </button>
          
          <!-- Сообщение об ошибке -->
          <div v-if="authStore.error" class="form-error">
            ❌ {{ authStore.error }}
          </div>
          
          <!-- Сообщение об успехе -->
          <div v-if="successMessage" class="form-success">
            ✅ {{ successMessage }}
          </div>
          
          <!-- Демо информация (показываем код в разработке) -->
          <div v-if="verificationCode" class="demo-info">
            <h4>💡 Демо-режим (разработка)</h4>
            <p>Код подтверждения: <strong>{{ verificationCode }}</strong></p>
            <p>Он также сохранен в консоли и sessionStorage</p>
            <router-link 
              :to="{ name: 'VerifyEmail', query: { email: formData.email, code: verificationCode } }"
              class="demo-link"
            >
              Перейти к подтверждению email
            </router-link>
          </div>
        </form>
        
        <!-- Боковая панель с информацией -->
        <div class="register-info">
          <h3>Преимущества аккаунта:</h3>
          <ul class="benefits-list">
            <li>📚 Сохранение прогресса чтения</li>
            <li>🔖 Закладки и избранное</li>
            <li>💬 Комментарии и обсуждения</li>
            <li>🔔 Уведомления о новых главах</li>
            <li>🎯 Персональные рекомендации</li>
            <li>🏆 Достижения и статистика</li>
          </ul>
          
          <div class="security-info">
            <h4>🔒 Безопасность:</h4>
            <p>Ваши данные защищены и никогда не передаются третьим лицам.</p>
          </div>
        </div>
      </div>
      
      <!-- Ссылки на другие страницы -->
      <div class="auth-links">
        <p>
          Уже есть аккаунт? 
          <router-link to="/login" class="link">Войти</router-link>
        </p>
        <p>
          Забыли пароль? 
          <router-link to="/forgot-password" class="link">Восстановить</router-link>
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

// Состояние формы
const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false
})

// Ошибки валидации
const errors = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: ''
})

// Состояния
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const successMessage = ref('')
const verificationCode = ref('')
const usernameTips = ref('')

// Валидаторы
const usernameValid = computed(() => formData.value.username.length >= 3 && !errors.value.username)
const emailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(formData.value.email) && !errors.value.email
})
const passwordValid = computed(() => formData.value.password.length >= 6 && !errors.value.password)
const confirmPasswordValid = computed(() => 
  formData.value.password === formData.value.confirmPassword && 
  formData.value.confirmPassword.length > 0 &&
  !errors.value.confirmPassword
)

// Проверка пароля
const hasUpperCase = computed(() => /[A-Z]/.test(formData.value.password))
const hasLowerCase = computed(() => /[a-z]/.test(formData.value.password))
const hasNumber = computed(() => /\d/.test(formData.value.password))

// Сложность пароля
const passwordStrength = computed(() => {
  let strength = 0
  if (formData.value.password.length >= 6) strength++
  if (hasUpperCase.value) strength++
  if (hasLowerCase.value) strength++
  if (hasNumber.value) strength++
  if (formData.value.password.length >= 10) strength++
  if (/[^A-Za-z0-9]/.test(formData.value.password)) strength++
  
  return strength
})

const passwordStrengthClass = computed(() => {
  if (formData.value.password.length === 0) return 'empty'
  if (passwordStrength.value <= 2) return 'weak'
  if (passwordStrength.value <= 4) return 'medium'
  return 'strong'
})

const passwordStrengthText = computed(() => {
  if (formData.value.password.length === 0) return ''
  if (passwordStrength.value <= 2) return 'Слабый'
  if (passwordStrength.value <= 4) return 'Средний'
  return 'Сильный'
})

// Валидация формы
const isFormValid = computed(() => {
  return (
    usernameValid.value &&
    emailValid.value &&
    passwordValid.value &&
    confirmPasswordValid.value &&
    formData.value.agreeToTerms
  )
})

// Методы
const validateUsername = () => {
  const username = formData.value.username.trim()
  
  if (username.length < 3) {
    errors.value.username = 'Имя должно содержать минимум 3 символа'
    usernameTips.value = ''
    return false
  }
  
  if (username.length > 20) {
    errors.value.username = 'Имя не должно превышать 20 символов'
    usernameTips.value = ''
    return false
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.value.username = 'Можно использовать только буквы, цифры и нижнее подчеркивание'
    usernameTips.value = ''
    return false
  }
  
  errors.value.username = ''
  
  // Подсказки
  if (username.length < 5) {
    usernameTips.value = 'Рекомендуется не менее 5 символов для надежности'
  } else if (username.length >= 5 && username.length <= 10) {
    usernameTips.value = 'Хорошее имя!'
  } else {
    usernameTips.value = 'Отличное имя пользователя!'
  }
  
  return true
}

const validateEmail = () => {
  const email = formData.value.email.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    errors.value.email = 'Введите корректный email адрес'
    return false
  }
  
  errors.value.email = ''
  return true
}

const validatePassword = () => {
  const password = formData.value.password
  
  if (password.length < 6) {
    errors.value.password = 'Пароль должен содержать минимум 6 символов'
    return false
  }
  
  errors.value.password = ''
  return true
}

const validateConfirmPassword = () => {
  if (formData.value.password !== formData.value.confirmPassword) {
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

// Обработка регистрации
const handleRegister = async () => {
  // Валидация
  if (!validateUsername() || !validateEmail() || !validatePassword() || !validateConfirmPassword()) {
    return
  }
  
  if (!formData.value.agreeToTerms) {
    errors.value.agreeToTerms = 'Необходимо принять условия использования'
    return
  }
  
  isLoading.value = true
  successMessage.value = ''
  verificationCode.value = ''
  
  try {
    const result = await authStore.register({
      username: formData.value.username,
      email: formData.value.email,
      password: formData.value.password
    })
    
    if (result.success) {
      successMessage.value = result.message
      verificationCode.value = result.verificationCode
      
      // Очищаем форму
      formData.value.password = ''
      formData.value.confirmPassword = ''
      
      // Автоматически не перенаправляем - ждем подтверждения email
    } else {
      // Ошибка уже установлена в хранилище
      console.error('Ошибка регистрации:', result.error)
    }
  } catch (error) {
    console.error('Неизвестная ошибка:', error)
    authStore.error = 'Произошла неизвестная ошибка. Попробуйте позже.'
  } finally {
    isLoading.value = false
  }
}

// Автозаполнение для тестирования
const fillTestData = () => {
  formData.value.username = 'testuser'
  formData.value.email = 'test@example.com'
  formData.value.password = 'Password123'
  formData.value.confirmPassword = 'Password123'
  formData.value.agreeToTerms = true
  
  validateUsername()
  validateEmail()
  validatePassword()
  validateConfirmPassword()
}

onMounted(() => {
  // В демо-режиме показываем тестовые данные
  if (process.env.NODE_ENV === 'development') {
    console.log('💡 Для тестирования вызовите fillTestData() в консоли')
  }
})


</script>

<style scoped>
.register-page {
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

.register-form-wrapper {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--spacing-xl);
  max-width: 1000px;
  margin: 0 auto;
}

.register-form {
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

input[type="text"],
input[type="email"],
input[type="password"] {
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

.field-tips {
  color: var(--color-secondary);
  font-size: 0.9rem;
  margin-top: 5px;
  font-style: italic;
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
  list-style: none;
  padding: 0;
  margin: var(--spacing-sm) 0 0;
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

.checkbox-label {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
}

.checkbox-label input {
  margin-right: 10px;
  margin-top: 3px;
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
  margin-top: var(--spacing-lg);
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

.form-error {
  background: rgba(255, 0, 0, 0.1);
  color: #ff4444;
  padding: var(--spacing-md);
  border-radius: 8px;
  margin-top: var(--spacing-lg);
  border-left: 4px solid #ff4444;
}

.form-success {
  background: rgba(0, 255, 0, 0.1);
  color: #00cc44;
  padding: var(--spacing-md);
  border-radius: 8px;
  margin-top: var(--spacing-lg);
  border-left: 4px solid #00cc44;
}

.demo-info {
  background: rgba(128, 131, 42, 0.1);
  border: 1px solid var(--color-secondary);
  border-radius: 8px;
  padding: var(--spacing-md);
  margin-top: var(--spacing-lg);
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

.register-info {
  background: var(--color-panel);
  padding: var(--spacing-xl);
  border-radius: 12px;
  box-shadow: var(--shadow-heavy);
  align-self: start;
}

.register-info h3 {
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
  font-size: 1.5rem;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin-bottom: var(--spacing-xl);
}

.benefits-list li {
  color: var(--color-text);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;
}

.benefits-list li:last-child {
  border-bottom: none;
}

.security-info {
  background: rgba(7, 102, 12, 0.1);
  padding: var(--spacing-md);
  border-radius: 8px;
  border-left: 4px solid var(--color-primary);
}

.security-info h4 {
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.security-info p {
  color: var(--color-text);
  opacity: 0.8;
  font-size: 0.9rem;
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
  .register-form-wrapper {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
}

@media (max-width: 768px) {
  .register-page {
    padding: var(--spacing-lg) 0;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .register-form,
  .register-info {
    padding: var(--spacing-lg);
  }
}

@media (max-width: 480px) {
  .register-form,
  .register-info {
    padding: var(--spacing-md);
  }
  
  .page-header h1 {
    font-size: 1.8rem;
  }
}
</style>