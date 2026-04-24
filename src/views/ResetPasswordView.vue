<template>
  <div class="reset-page">
    <div class="container">
      <div class="reset-card">
        <div class="card-header">
          <h1>Сброс пароля</h1>
          <p v-if="!token">Неверная или устаревшая ссылка</p>
          <p v-else>Придумайте новый пароль для вашего аккаунта</p>
        </div>

        <form v-if="token" @submit.prevent="handleSubmit" class="reset-form">
          <div class="form-group">
            <label for="password">Новый пароль</label>
            <div class="password-field">
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                placeholder="Минимум 6 символов"
                required
                minlength="6"
              />
              <button type="button" class="toggle-btn" @click="showPassword = !showPassword">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="confirm">Подтверждение пароля</label>
            <div class="password-field">
              <input
                id="confirm"
                :type="showConfirm ? 'text' : 'password'"
                v-model="confirm"
                placeholder="Повторите новый пароль"
                required
              />
              <button type="button" class="toggle-btn" @click="showConfirm = !showConfirm">
                {{ showConfirm ? '🙈' : '👁️' }}
              </button>
            </div>
            <p v-if="mismatch" class="error-hint">Пароли не совпадают</p>
          </div>

          <button type="submit" :disabled="submitting || mismatch" class="submit-btn">
            <span v-if="submitting" class="spinner"></span>
            {{ submitting ? 'Сохранение...' : 'Установить пароль' }}
          </button>
        </form>

        <div v-if="successMsg" class="success-message">
          <span class="success-icon">✅</span>
          <p>{{ successMsg }}</p>
          <router-link to="/login" class="login-link">Перейти ко входу</router-link>
        </div>

        <div v-if="errorMsg" class="error-message">
          ⚠️ {{ errorMsg }}
        </div>

        <div class="card-footer">
          <router-link to="/login" class="back-link">← Вернуться ко входу</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();
const token = route.query.token;

const password = ref('');
const confirm = ref('');
const showPassword = ref(false);
const showConfirm = ref(false);
const submitting = ref(false);
const successMsg = ref('');
const errorMsg = ref('');

const mismatch = computed(() => confirm.value.length > 0 && password.value !== confirm.value);

const handleSubmit = async () => {
  if (mismatch.value) return;
  if (password.value.length < 6) {
    errorMsg.value = 'Пароль должен содержать минимум 6 символов';
    return;
  }
  if (!token) {
    errorMsg.value = 'Токен сброса отсутствует';
    return;
  }

  submitting.value = true;
  successMsg.value = '';
  errorMsg.value = '';

  try {
    const result = await authStore.resetPassword(token, password.value);
    if (result.success) {
      successMsg.value = result.message || 'Пароль успешно изменён. Теперь вы можете войти.';
    } else {
      errorMsg.value = authStore.error || 'Не удалось изменить пароль';
    }
  } catch (err) {
    errorMsg.value = err.message || 'Ошибка сервера';
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.reset-page {
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

.reset-card {
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

.reset-form {
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

.password-field {
  position: relative;
}

.password-field input {
  width: 100%;
  padding: 14px 50px 14px 16px;
  background: #2b2b2b;
  border: 2px solid rgba(128, 131, 42, 0.4);
  border-radius: 10px;
  color: #ffffff;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.password-field input:focus {
  border-color: var(--color-primary, #07660c);
  box-shadow: 0 0 0 3px rgba(7, 102, 12, 0.2);
}

.toggle-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  padding: 5px;
  transition: color 0.2s;
}

.toggle-btn:hover {
  color: #ffffff;
}

.error-hint {
  color: #ff6b6b;
  font-size: 0.85rem;
  margin-top: 5px;
  margin-bottom: 0;
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
  margin-top: 10px;
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
  padding: 16px 18px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.success-message p {
  margin: 0 0 12px 0;
  color: #00cc44;
  font-weight: 500;
}

.success-icon {
  font-size: 1.5rem;
  margin-right: 8px;
}

.login-link {
  color: var(--color-secondary, #80832a);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.login-link:hover {
  color: var(--color-primary, #07660c);
  text-decoration: underline;
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
  .reset-card {
    padding: 30px 20px;
  }
  
  .card-header h1 {
    font-size: 1.6rem;
  }
}
</style>