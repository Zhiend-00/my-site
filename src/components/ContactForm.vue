<template>
  <div class="contact-form">
    <h3>Обратная связь</h3>
    <form @submit.prevent="submit">
      <input v-model="name" placeholder="Ваше имя" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <textarea v-model="message" placeholder="Сообщение" rows="4" required></textarea>
      <button type="submit" :disabled="loading">Отправить</button>
      <p v-if="success" class="success">✅ Сообщение отправлено</p>
      <p v-if="error" class="error">❌ Ошибка</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { feedbackAPI } from '@/api'

const name = ref('')
const email = ref('')
const message = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref(false)

async function submit() {
  loading.value = true
  success.value = false
  error.value = false
  try {
    await feedbackAPI.send({ name: name.value, email: email.value, message: message.value })
    success.value = true
    name.value = email.value = message.value = ''
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.contact-form {
  background: var(--color-panel);
  padding: 20px;
  border-radius: 12px;
  margin-top: 40px;
}
input, textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 10px;
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  border-radius: 6px;
}
button {
  background: var(--color-primary);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.success { color: #0f0; margin-top: 10px; }
.error { color: #f00; margin-top: 10px; }
</style>