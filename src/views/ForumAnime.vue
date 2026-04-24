<template>
  <div class="forgot-page">
    <div class="container">
      <h1>Восстановление пароля</h1>
      <p>Укажите email, и мы отправим инструкцию.</p>
      <form @submit.prevent="submit">
        <input v-model="email" type="email" placeholder="your@email.com" required />
        <button :disabled="loading">{{ loading ? 'Отправка...' : 'Отправить' }}</button>
      </form>
      <p v-if="message" class="message">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { authAPI } from '@/api';

const email = ref('');
const loading = ref(false);
const message = ref('');
const error = ref('');

const submit = async () => {
  loading.value = true;
  message.value = '';
  error.value = '';
  try {
    await authAPI.forgotPassword(email.value);
    message.value = 'Инструкция отправлена на почту. Проверьте папку "Спам", если письмо не пришло.';
  } catch (e) {
    error.value = e.message || 'Ошибка';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.forgot-page { padding: 40px 0; min-height: 60vh; }
.container { max-width: 500px; margin: 0 auto; }
input { width: 100%; padding: 12px; margin: 10px 0; background: #2b2b2b; border: 1px solid #80832a; border-radius: 8px; color: #fff; }
button { width: 100%; padding: 12px; background: #07660c; color: white; border: none; border-radius: 8px; cursor: pointer; }
.message { color: #00cc44; margin-top: 10px; }
.error { color: #ff4444; margin-top: 10px; }
</style>