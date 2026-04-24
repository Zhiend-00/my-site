<template>
  <div class="verify-email-page">
    <div class="container">
      <div class="verification-card">
        <h1>Подтверждение Email</h1>

        <div v-if="loading" class="status-message loading">
          <div class="spinner"></div>
          <p>Проверяем токен...</p>
        </div>

        <div v-else-if="success" class="status-message success">
          <span class="icon">✅</span>
          <h2>Email подтверждён!</h2>
          <p>Теперь вы можете войти в свой аккаунт.</p>
          <router-link to="/login" class="btn-primary">Перейти к входу</router-link>
        </div>

        <div v-else class="status-message error">
          <span class="icon">❌</span>
          <h2>Ошибка подтверждения</h2>
          <p>{{ errorMessage }}</p>
          <div class="actions">
            <router-link to="/login" class="btn-secondary">Войти</router-link>
            <router-link to="/" class="btn-secondary">На главную</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authAPI } from '@/api'

const route = useRoute()
const loading = ref(true)
const success = ref(false)
const errorMessage = ref('')

const verifyEmail = async () => {
  const token = route.query.token
  if (!token) {
    errorMessage.value = 'Токен подтверждения не найден в ссылке.'
    loading.value = false
    return
  }

  try {
    const data = await authAPI.verifyEmail(token)
    if (data.message) {
      success.value = true
    } else {
      errorMessage.value = 'Неизвестный ответ сервера.'
    }
  } catch (error) {
    errorMessage.value = error.message || 'Не удалось подтвердить email. Возможно, токен недействителен или уже использован.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  verifyEmail()
})
</script>

<style scoped>
.verify-email-page {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}
.verification-card {
  background: #202020;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 20px rgba(0,0,0,0.5);
}
h1 {
  color: #07660c;
  margin-bottom: 30px;
}
.status-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}
.icon {
  font-size: 3rem;
}
h2 {
  color: #fff;
  margin-bottom: 10px;
}
p {
  color: #ccc;
  margin-bottom: 20px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #2b2b2b;
  border-top: 4px solid #07660c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.success h2 {
  color: #00cc44;
}
.error h2 {
  color: #ff4444;
}
.btn-primary {
  display: inline-block;
  background: #07660c;
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
  text-decoration: none;
  font-weight: 600;
}
.btn-secondary {
  display: inline-block;
  background: transparent;
  border: 1px solid #80832a;
  color: #80832a;
  padding: 10px 20px;
  border-radius: 30px;
  text-decoration: none;
  margin: 0 10px;
}
.actions {
  margin-top: 20px;
}
</style>