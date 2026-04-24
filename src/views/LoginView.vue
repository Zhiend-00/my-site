<template>
  <div class="login-page">
    <div class="container">
      <div class="page-header">
        <h1>Вход в аккаунт</h1>
        <p>Добро пожаловать обратно!</p>
      </div>

      <div class="login-wrapper">
        <div class="login-form">
          <form @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="email">Email *</label>
              <input type="email" id="email" v-model="formData.email" placeholder="your@email.com" required />
            </div>

            <div class="form-group">
              <label for="password">Пароль *</label>
              <div class="password-input-wrapper">
                <input :type="showPassword ? 'text' : 'password'" id="password" v-model="formData.password" placeholder="Введите ваш пароль" required />
                <button type="button" @click="showPassword = !showPassword" class="password-toggle">
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <!-- Ссылка "Забыли пароль?" -->
            <router-link to="/forgot-password" class="forgot-link">Забыли пароль?</router-link>

            <button type="submit" :disabled="isLoading" class="submit-btn">
              {{ isLoading ? 'Вход...' : 'Войти' }}
            </button>

            <div v-if="authStore.error" class="error-message">❌ {{ authStore.error }}</div>
          </form>
          <div class="auth-links">
            <p>Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const formData = ref({ email: '', password: '' });
const showPassword = ref(false);
const isLoading = ref(false);

const handleLogin = async () => {
  isLoading.value = true;
  try {
    const result = await authStore.login({
      email: formData.value.email,
      password: formData.value.password
    });
    if (result.success) router.push('/');
  } catch (e) {
    // ошибка уже в authStore.error
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  padding: var(--spacing-xl) 0;
  background: linear-gradient(135deg, var(--color-background) 0%, #1a1a1a 100%);
}
.container { max-width: 600px; margin: 0 auto; padding: 0 20px; }
.page-header { text-align: center; margin-bottom: 30px; }
.page-header h1 { color: var(--color-primary); font-size: 2.5rem; }
.login-form { background: var(--color-panel); padding: 30px; border-radius: 12px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: 600; }
input[type="email"], input[type="password"] {
  width: 100%; padding: 12px; background: #2b2b2b; border: 1px solid #80832a; border-radius: 8px; color: #fff;
}
.password-input-wrapper { position: relative; }
.password-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #fff; cursor: pointer; }
.forgot-link {
  display: block; text-align: right; color: var(--color-primary); text-decoration: none; font-size: 0.9rem; margin-bottom: 15px;
}
.forgot-link:hover { text-decoration: underline; }
.submit-btn { width: 100%; padding: 12px; background: #07660c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 10px; }
.submit-btn:disabled { opacity: 0.5; }
.error-message { color: #ff4444; margin-top: 10px; }
.auth-links { text-align: center; margin-top: 20px; }
.auth-links a { color: var(--color-primary); }
</style>