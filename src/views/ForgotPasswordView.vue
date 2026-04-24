<template>
  <div class="forgot-page">
    <div class="container">
      <div class="forgot-card">
        <div class="card-header">
          <h1>Восстановление пароля</h1>
          <p>Укажите email, и мы отправим инструкцию</p>
        </div>

        <form @submit.prevent="handleSubmit" class="forgot-form">
          <div class="form-group">
            <label for="email">Ваш Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="name@example.com"
              required
            />
          </div>

          <button type="submit" :disabled="submitting" class="submit-btn">
            <span v-if="submitting" class="spinner"></span>
            {{ submitting ? 'Отправка...' : 'Отправить инструкцию' }}
          </button>
        </form>

        <div v-if="successMsg" class="success-message">
          <span class="success-icon">✉️</span>
          <p>{{ successMsg }}</p>
        </div>

        <div v-if="authStore.error" class="error-message">
          ⚠️ {{ authStore.error }}
        </div>

        <div class="card-footer">
          <router-link to="/login" class="back-link">← Вернуться ко входу</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const email = ref('');
const submitting = ref(false);
const successMsg = ref('');

const handleSubmit = async () => {
  if (!email.value) return;
  submitting.value = true;
  successMsg.value = '';
  try {
    const result = await authStore.forgotPassword(email.value.trim());
    if (result.success) {
      successMsg.value = result.message || 'Инструкция отправлена. Проверьте почту.';
    }
  } catch (error) {
    console.error('Ошибка восстановления:', error);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.forgot-page {
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 0 20px;
}

.forgot-card {
  background: var(--color-panel, #202020);
  border-radius: 16px;
  padding: 40px 30px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(128, 131, 42, 0.3);
}

.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.card-header h1 {
  color: var(--color-primary, #07660c);
  font-size: 2rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.card-header p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  margin: 0;
}

.forgot-form {
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 0.95rem;
}

input[type="email"] {
  width: 100%;
  padding: 14px 16px;
  background: #2b2b2b;
  border: 2px solid rgba(128, 131, 42, 0.4);
  border-radius: 10px;
  color: #ffffff;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

input[type="email"]:focus {
  border-color: var(--color-primary, #07660c);
  box-shadow: 0 0 0 3px rgba(7, 102, 12, 0.2);
}

.submit-btn {
  width: 100%;
  padding: 14px 24px;
  background: var(--color-primary, #07660c);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s, opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.submit-btn:hover:not(:disabled) {
  background: #0a7e0f;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.success-message {
  background: rgba(0, 204, 68, 0.1);
  border-left: 4px solid #00cc44;
  padding: 14px 18px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.success-icon {
  font-size: 1.5rem;
}

.success-message p {
  color: #00cc44;
  margin: 0;
  font-weight: 500;
}

.error-message {
  background: rgba(255, 68, 68, 0.1);
  border-left: 4px solid #ff4444;
  padding: 14px 18px;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #ff6b6b;
  font-weight: 500;
}

.card-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.back-link {
  color: var(--color-secondary, #80832a);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--color-primary, #07660c);
  text-decoration: underline;
}

@media (max-width: 576px) {
  .forgot-card {
    padding: 30px 20px;
  }
  
  .card-header h1 {
    font-size: 1.6rem;
  }
}
</style>