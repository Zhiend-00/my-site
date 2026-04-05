<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Создание новой темы</h2>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Заголовок темы *</label>
          <input v-model="title" required placeholder="Введите заголовок" maxlength="200" />
        </div>
        <div class="form-group">
          <label>Содержимое *</label>
          <textarea v-model="content" required placeholder="Опишите вашу тему..." rows="6"></textarea>
        </div>
        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="cancel-btn">Отмена</button>
          <button type="submit" :disabled="!title.trim() || !content.trim()" class="submit-btn">Создать тему</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  categories: { type: Array, default: () => [] }
});
const emit = defineEmits(['close', 'create']);

const title = ref('');
const content = ref('');

const submit = () => {
  if (!title.value.trim() || !content.value.trim()) return;
  emit('create', { title: title.value, content: content.value });
  title.value = '';
  content.value = '';
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}
.modal-content {
  background: #202020;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: auto;
  padding: 25px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #fff;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}
input, textarea {
  width: 100%;
  padding: 12px;
  background: #2B2B2B;
  border: 1px solid #80832A;
  border-radius: 8px;
  color: #fff;
  font-family: inherit;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
}
.cancel-btn {
  background: none;
  border: 1px solid #80832A;
  color: #80832A;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}
.submit-btn {
  background: #07660C;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}
.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>