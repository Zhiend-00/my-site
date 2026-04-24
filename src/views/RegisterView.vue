<template>
  <div class="register-page">
    <div class="container">
      <div class="page-header">
        <h1>Регистрация</h1>
        <p>Создайте аккаунт для доступа ко всем функциям</p>
      </div>

      <div class="register-form-wrapper">
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="username">Имя пользователя</label>
            <input type="text" id="username" v-model="form.username" placeholder="Придумайте имя" />
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input type="email" id="email" v-model="form.email" placeholder="your@email.com" required />
            <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
          </div>

          <div class="form-group">
            <label for="password">Пароль *</label>
            <div class="password-input-wrapper">
              <input :type="showPassword ? 'text' : 'password'" id="password" v-model="form.password" placeholder="Минимум 6 символов" required />
              <button type="button" @click="showPassword = !showPassword" class="password-toggle">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Подтверждение пароля *</label>
            <div class="password-input-wrapper">
              <input :type="showConfirmPassword ? 'text' : 'password'" id="confirmPassword" v-model="form.confirmPassword" placeholder="Повторите пароль" required />
              <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="password-toggle">
                {{ showConfirmPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <div v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</div>
          </div>

          <div class="form-group agreement">
            <label class="checkbox-label">
              <input type="checkbox" v-model="agreedToTerms" />
              <span>Я согласен с правилами</span>
            </label>
          </div>

          <button type="submit" :disabled="submitting || !canSubmit" class="submit-btn">
            {{ submitting ? 'Регистрация...' : 'Зарегистрироваться' }}
          </button>

          <div v-if="authStore.error" class="form-error">❌ {{ authStore.error }}</div>
          <div v-if="successMsg" class="form-success">
            ✅ {{ successMsg }}
            <div class="email-note">Проверьте почту и перейдите по ссылке для подтверждения email.</div>
          </div>
        </form>

        <div class="register-info">
          <h3>После регистрации вы сможете:</h3>
          <ul class="benefits-list">
            <li>📚 Сохранять прогресс чтения</li>
            <li>🔖 Добавлять в закладки</li>
            <li>💬 Участвовать в обсуждениях (после подтверждения email)</li>
            <li>🔔 Получать уведомления</li>
          </ul>
        </div>
      </div>

      <div class="auth-links">
        <p>Уже есть аккаунт? <router-link to="/login">Войти</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
});
const agreedToTerms = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const submitting = ref(false);
const successMsg = ref('');
const errors = reactive({
  email: '',
  password: '',
  confirmPassword: ''
});

const canSubmit = computed(() =>
  form.email.length > 0 &&
  form.password.length >= 6 &&
  form.password === form.confirmPassword &&
  agreedToTerms.value
);

const handleRegister = async () => {
  // Сброс ошибок
  errors.email = '';
  errors.password = '';
  errors.confirmPassword = '';
  successMsg.value = '';

  if (!form.email.includes('@')) {
    errors.email = 'Некорректный email';
    return;
  }
  if (form.password.length < 6) {
    errors.password = 'Минимум 6 символов';
    return;
  }
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Пароли не совпадают';
    return;
  }

  submitting.value = true;
  try {
    const result = await authStore.register({
      username: form.username || form.email.split('@')[0],
      email: form.email.trim(),
      password: form.password
    });

    if (result.success) {
      successMsg.value = result.message || 'Регистрация успешна.';
      form.password = '';
      form.confirmPassword = '';
    } else {
      // ошибка уже в authStore.error
    }
  } catch (e) {
    console.error(e);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
/* Стили полностью сохранены, добавил только новый класс для заметки */
.register-page {
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  padding: var(--spacing-xl) 0;
  background: linear-gradient(135deg, var(--color-background) 0%, #1a1a1a 100%);
}
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.page-header { text-align: center; margin-bottom: 30px; }
.page-header h1 { color: var(--color-primary); font-size: 2rem; }
.register-form-wrapper { display: grid; grid-template-columns: 1fr 300px; gap: 30px; max-width: 1000px; margin: 0 auto; }
.register-form { background: var(--color-panel); padding: 30px; border-radius: 12px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; color: var(--color-text); font-weight: 600; }
input[type="text"], input[type="email"], input[type="password"] {
  width: 100%; padding: 12px; background: #2b2b2b; border: 1px solid #80832a; border-radius: 8px; color: #fff;
}
.password-input-wrapper { position: relative; }
.password-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #fff; cursor: pointer; }
.error-message { color: #ff4444; font-size: 0.9rem; margin-top: 5px; }
.checkbox-label { display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--color-text); }
.submit-btn { width: 100%; padding: 12px; background: var(--color-primary); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 10px; }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.form-error { background: rgba(255,0,0,0.1); color: #ff4444; padding: 12px; border-radius: 8px; margin-top: 15px; }
.form-success { background: rgba(0,255,0,0.1); color: #00cc44; padding: 12px; border-radius: 8px; margin-top: 15px; }
.email-note { font-size: 0.9rem; opacity: 0.9; margin-top: 8px; }
.register-info { background: var(--color-panel); padding: 30px; border-radius: 12px; align-self: start; }
.register-info h3 { color: var(--color-primary); margin-bottom: 15px; }
.benefits-list { list-style: none; padding: 0; }
.benefits-list li { padding: 8px 0; color: var(--color-text); border-bottom: 1px solid rgba(255,255,255,0.1); }
.auth-links { text-align: center; margin-top: 30px; }
.auth-links a { color: var(--color-primary); text-decoration: none; font-weight: 600; }
@media (max-width: 768px) { .register-form-wrapper { grid-template-columns: 1fr; } }
</style>