<template>
  <div class="verify-email-page">
    <div class="container">
      <!-- Заголовок -->
      <div class="page-header">
        <h1>Подтверждение Email</h1>
        <p>Проверьте почту и введите код подтверждения</p>
      </div>
      
      <!-- Основной контент -->
      <div class="verification-wrapper">
        <!-- Блок с инструкциями -->
        <div class="instructions">
          <div class="instruction-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Проверьте вашу почту</h3>
              <p>Мы отправили 6-значный код на email:</p>
              <div class="email-display">
                <span class="email-icon">📧</span>
                <strong>{{ email }}</strong>
              </div>
            </div>
          </div>
          
          <div class="instruction-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Введите код подтверждения</h3>
              <p>Введите 6 цифр из письма в поле ниже</p>
            </div>
          </div>
          
          <div class="instruction-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Готово!</h3>
              <p>После подтверждения вы получите полный доступ к аккаунту</p>
            </div>
          </div>
        </div>
        
        <!-- Форма подтверждения -->
        <div class="verification-form">
          <div class="code-input-container">
            <div class="code-inputs">
              <input
                v-for="n in 6"
                :key="n"
                :ref="`codeInput${n}`"
                v-model="code[n-1]"
                type="text"
                maxlength="1"
                @input="onCodeInput(n-1, $event)"
                @keydown="onCodeKeydown(n-1, $event)"
                @paste="onCodePaste"
                :class="{ 'filled': code[n-1] }"
                class="code-input"
              />
            </div>
            
            <div class="code-hint">
              <span v-if="!isComplete">Введите 6 цифр</span>
              <span v-else class="complete">✓ Код введен</span>
            </div>
          </div>
          
          <!-- Кнопки -->
          <div class="action-buttons">
            <button
              @click="handleVerify"
              :disabled="!isComplete || isLoading"
              class="verify-btn"
              :class="{ 'loading': isLoading }"
            >
              <span v-if="!isLoading">Подтвердить Email</span>
              <span v-else class="loading-text">
                <span class="spinner"></span> Подтверждение...
              </span>
            </button>
            
            <button
              @click="handleResend"
              :disabled="isResending"
              class="resend-btn"
            >
              <span v-if="!isResending">Отправить код повторно</span>
              <span v-else class="loading-text">
                <span class="spinner"></span> Отправка...
              </span>
            </button>
            
            <button
              @click="changeEmail"
              class="change-email-btn"
            >
              Изменить Email
            </button>
          </div>
          
          <!-- Демо информация -->
          <div v-if="showDemoInfo" class="demo-info">
            <h4>💡 Демо-режим</h4>
            <p>Код из sessionStorage: <strong>{{ demoCode }}</strong></p>
            <button @click="fillDemoCode" class="demo-btn">
              Заполнить демо-код
            </button>
          </div>
          
          <!-- Сообщения -->
          <div v-if="authStore.error" class="error-message">
            ❌ {{ authStore.error }}
          </div>
          
          <div v-if="successMessage" class="success-message">
            ✅ {{ successMessage }}
            <div v-if="countdown > 0" class="redirect-countdown">
              Перенаправление через {{ countdown }} сек...
            </div>
          </div>
          
          <!-- Таймер повторной отправки -->
          <div v-if="resendCooldown > 0" class="cooldown-info">
            ⏳ Повторная отправка через {{ resendCooldown }} сек
          </div>
        </div>
      </div>
      
      <!-- Альтернативные действия -->
      <div class="alternative-actions">
        <p>Не пришел код?</p>
        <ul>
          <li>Проверьте папку "Спам" или "Рассылки"</li>
          <li>Убедитесь, что ввели правильный email</li>
          <li>Попробуйте отправить код повторно через минуту</li>
          <li>
            <router-link to="/support" class="link">
              Обратиться в поддержку
            </router-link>
          </li>
        </ul>
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
const code = ref(['', '', '', '', '', ''])
const isLoading = ref(false)
const isResending = ref(false)
const successMessage = ref('')
const countdown = ref(0)
const resendCooldown = ref(0)
const showDemoInfo = ref(false)
const demoCode = ref('')

// Email из query параметров или localStorage
const email = ref(route.query.email || '')

// Ссылки на input элементы
const codeInputs = ref([])

// Вычисляемые свойства
const isComplete = computed(() => {
  return code.value.every(digit => digit !== '')
})

// Методы
const onCodeInput = (index, event) => {
  const value = event.target.value
  
  // Очищаем если не цифра
  if (value && !/^\d$/.test(value)) {
    code.value[index] = ''
    event.target.value = ''
    return
  }
  
  // Заполняем значение
  code.value[index] = value
  
  // Переходим к следующему полю
  if (value && index < 5) {
    const nextInput = codeInputs.value[`codeInput${index + 2}`]
    if (nextInput && nextInput[0]) {
      nextInput[0].focus()
    }
  }
}

const onCodeKeydown = (index, event) => {
  // Обработка Backspace
  if (event.key === 'Backspace') {
    if (!code.value[index] && index > 0) {
      // Переходим к предыдущему полю
      const prevInput = codeInputs.value[`codeInput${index}`]
      if (prevInput && prevInput[0]) {
        prevInput[0].focus()
      }
    }
    code.value[index] = ''
  }
  
  // Обработка стрелок
  if (event.key === 'ArrowLeft' && index > 0) {
    const prevInput = codeInputs.value[`codeInput${index}`]
    if (prevInput && prevInput[0]) {
      prevInput[0].focus()
    }
  }
  
  if (event.key === 'ArrowRight' && index < 5) {
    const nextInput = codeInputs.value[`codeInput${index + 2}`]
    if (nextInput && nextInput[0]) {
      nextInput[0].focus()
    }
  }
}

const onCodePaste = (event) => {
  event.preventDefault()
  const pastedData = event.clipboardData.getData('text').trim()
  
  if (/^\d{6}$/.test(pastedData)) {
    const digits = pastedData.split('')
    digits.forEach((digit, index) => {
      if (index < 6) {
        code.value[index] = digit
      }
    })
    
    // Фокус на последнее поле
    const lastInput = codeInputs.value[`codeInput6`]
    if (lastInput && lastInput[0]) {
      lastInput[0].focus()
    }
  }
}

const handleVerify = async () => {
  if (!isComplete.value) {
    authStore.error = 'Введите полный код'
    return
  }
  
  if (!email.value) {
    authStore.error = 'Email не указан'
    return
  }
  
  isLoading.value = true
  successMessage.value = ''
  
  try {
    const verificationCode = code.value.join('')
    const result = await authStore.verifyEmail(email.value, verificationCode)
    
    if (result.success) {
      successMessage.value = result.message
      
      // Запускаем таймер перенаправления
      countdown.value = 3
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
          router.push('/')
        }
      }, 1000)
    } else {
      // Ошибка уже в хранилище
      // Очищаем код при ошибке
      code.value = ['', '', '', '', '', '']
      
      // Фокус на первое поле
      const firstInput = codeInputs.value[`codeInput1`]
      if (firstInput && firstInput[0]) {
        firstInput[0].focus()
      }
    }
  } catch (error) {
    console.error('Ошибка подтверждения:', error)
    authStore.error = 'Произошла неизвестная ошибка'
  } finally {
    isLoading.value = false
  }
}

const handleResend = async () => {
  if (!email.value) {
    authStore.error = 'Email не указан'
    return
  }
  
  isResending.value = true
  authStore.error = ''
  
  try {
    const result = await authStore.resendVerification(email.value)
    
    if (result.success) {
      successMessage.value = 'Новый код отправлен на вашу почту'
      demoCode.value = result.verificationCode
      showDemoInfo.value = true
      
      // Устанавливаем кулдаун 60 секунд
      resendCooldown.value = 60
      const cooldownTimer = setInterval(() => {
        resendCooldown.value--
        if (resendCooldown.value <= 0) {
          clearInterval(cooldownTimer)
        }
      }, 1000)
      
      // Очищаем старый код
      code.value = ['', '', '', '', '', '']
      
      // Фокус на первое поле
      const firstInput = codeInputs.value[`codeInput1`]
      if (firstInput && firstInput[0]) {
        firstInput[0].focus()
      }
    }
  } catch (error) {
    console.error('Ошибка повторной отправки:', error)
  } finally {
    isResending.value = false
  }
}

const changeEmail = () => {
  router.push('/register')
}

const fillDemoCode = () => {
  if (demoCode.value && demoCode.value.length === 6) {
    const digits = demoCode.value.split('')
    digits.forEach((digit, index) => {
      if (index < 6) {
        code.value[index] = digit
      }
    })
  }
}

const loadDemoCode = () => {
  // Загружаем код из sessionStorage для демо
  const savedCode = sessionStorage.getItem('last_verification_code')
  const savedEmail = sessionStorage.getItem('last_verification_email')
  
  if (savedCode && savedEmail) {
    demoCode.value = savedCode
    showDemoInfo.value = true
    
    // Если email не передан в query, используем сохраненный
    if (!email.value && savedEmail) {
      email.value = savedEmail
    }
  }
}

// Жизненный цикл
onMounted(() => {
  // Загружаем демо-код
  loadDemoCode()
  
  // Автофокус на первое поле
  setTimeout(() => {
    const firstInput = codeInputs.value[`codeInput1`]
    if (firstInput && firstInput[0]) {
      firstInput[0].focus()
    }
  }, 100)
})

onUnmounted(() => {
  // Очищаем таймеры
  countdown.value = 0
  resendCooldown.value = 0
})
</script>

<style scoped>
.verify-email-page {
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

.verification-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  max-width: 1000px;
  margin: 0 auto var(--spacing-xl);
}

.instructions {
  background: var(--color-panel);
  padding: var(--spacing-xl);
  border-radius: 12px;
  box-shadow: var(--shadow-medium);
}

.instruction-step {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  position: relative;
}

.instruction-step:not(:last-child):after {
  content: '';
  position: absolute;
  left: 25px;
  top: 60px;
  bottom: -30px;
  width: 2px;
  background: var(--color-primary);
  opacity: 0.3;
}

.step-number {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  z-index: 1;
}

.step-content h3 {
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
  font-size: 1.3rem;
}

.step-content p {
  color: var(--color-text);
  opacity: 0.8;
  margin-bottom: var(--spacing-sm);
}

.email-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: rgba(128, 131, 42, 0.1);
  padding: var(--spacing-md);
  border-radius: 8px;
  border: 1px solid var(--color-secondary);
}

.email-icon {
  font-size: 1.5rem;
}

.verification-form {
  background: var(--color-panel);
  padding: var(--spacing-xl);
  border-radius: 12px;
  box-shadow: var(--shadow-medium);
}

.code-input-container {
  margin-bottom: var(--spacing-xl);
}

.code-inputs {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.code-input {
  width: 50px;
  height: 60px;
  text-align: center;
  font-size: 1.8rem;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: var(--color-text);
  transition: all var(--transition-normal);
}

.code-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(7, 102, 12, 0.2);
  transform: translateY(-2px);
}

.code-input.filled {
  background: rgba(7, 102, 12, 0.1);
  border-color: var(--color-primary);
}

.code-hint {
  text-align: center;
  color: var(--color-text);
  opacity: 0.7;
  font-size: 0.9rem;
}

.code-hint .complete {
  color: #00cc44;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.verify-btn,
.resend-btn,
.change-email-btn {
  padding: var(--spacing-md);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  border: none;
}

.verify-btn {
  background: var(--color-primary);
  color: white;
}

.verify-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-primary) 90%, white);
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.verify-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.verify-btn.loading {
  opacity: 0.7;
  cursor: wait;
}

.resend-btn {
  background: transparent;
  color: var(--color-secondary);
  border: 2px solid var(--color-secondary);
}

.resend-btn:hover:not(:disabled) {
  background: var(--color-secondary);
  color: white;
}

.resend-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.change-email-btn {
  background: transparent;
  color: var(--color-text);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.change-email-btn:hover {
  background: rgba(255, 255, 255, 0.1);
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

.demo-btn {
  background: var(--color-secondary);
  color: white;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 6px;
  cursor: pointer;
  margin-top: var(--spacing-sm);
  font-weight: 600;
  transition: background-color var(--transition-normal);
}

.demo-btn:hover {
  background: color-mix(in srgb, var(--color-secondary) 90%, white);
}

.error-message {
  background: rgba(255, 0, 0, 0.1);
  color: #ff4444;
  padding: var(--spacing-md);
  border-radius: 8px;
  margin-bottom: var(--spacing-lg);
  border-left: 4px solid #ff4444;
}

.success-message {
  background: rgba(0, 255, 0, 0.1);
  color: #00cc44;
  padding: var(--spacing-md);
  border-radius: 8px;
  margin-bottom: var(--spacing-lg);
  border-left: 4px solid #00cc44;
}

.redirect-countdown {
  margin-top: var(--spacing-sm);
  font-size: 0.9rem;
  opacity: 0.8;
}

.cooldown-info {
  text-align: center;
  color: var(--color-secondary);
  padding: var(--spacing-sm);
  background: rgba(128, 131, 42, 0.1);
  border-radius: 8px;
}

.alternative-actions {
  background: var(--color-panel);
  padding: var(--spacing-xl);
  border-radius: 12px;
  max-width: 800px;
  margin: 0 auto;
}

.alternative-actions p {
  color: var(--color-text);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  text-align: center;
}

.alternative-actions ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.alternative-actions li {
  color: var(--color-text);
  opacity: 0.8;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-left: 30px;
  position: relative;
}

.alternative-actions li:before {
  content: '•';
  color: var(--color-primary);
  position: absolute;
  left: 10px;
  font-size: 1.5rem;
}

.alternative-actions li:last-child {
  border-bottom: none;
}

.link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}

/* Адаптивность */
@media (max-width: 992px) {
  .verification-wrapper {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
}

@media (max-width: 768px) {
  .verify-email-page {
    padding: var(--spacing-lg) 0;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .instructions,
  .verification-form,
  .alternative-actions {
    padding: var(--spacing-lg);
  }
  
  .code-input {
    width: 40px;
    height: 50px;
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .code-inputs {
    gap: 5px;
  }
  
  .code-input {
    width: 35px;
    height: 45px;
    font-size: 1.3rem;
  }
  
  .instructions,
  .verification-form,
  .alternative-actions {
    padding: var(--spacing-md);
  }
  
  .instruction-step {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }
  
  .instruction-step:not(:last-child):after {
    left: 50%;
    top: 50px;
    bottom: -20px;
    height: 20px;
    width: 2px;
  }
}
</style>