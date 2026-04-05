<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>{{ manga ? 'Редактировать мангу' : 'Добавить мангу' }}</h2>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Название *</label>
          <input v-model="form.title" required />
        </div>
        <div class="form-group">
          <label>Slug (уникальный)</label>
          <input v-model="form.slug" :readonly="!!manga" />
        </div>
        <div class="form-group">
          <label>Описание</label>
          <textarea v-model="form.description" rows="4"></textarea>
        </div>
        <div class="form-group">
          <label>Обложка (URL)</label>
          <input v-model="form.cover_image" />
        </div>
        <div class="form-group">
          <label>Автор</label>
          <input v-model="form.author" />
        </div>
        <div class="form-group">
          <label>Статус</label>
          <select v-model="form.status">
            <option value="ongoing">Онгоинг</option>
            <option value="completed">Завершена</option>
            <option value="hiatus">Перерыв</option>
          </select>
        </div>
        <div class="form-group">
          <label>Год</label>
          <input type="number" v-model="form.year" />
        </div>
        <div class="form-actions">
          <button type="button" @click="$emit('close')">Отмена</button>
          <button type="submit">Сохранить</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { adminAPI } from '@/api';

const props = defineProps({ manga: Object });
const emit = defineEmits(['close', 'saved']);

const form = ref({
  title: '',
  slug: '',
  description: '',
  cover_image: '',
  author: '',
  status: 'ongoing',
  year: new Date().getFullYear()
});

watch(() => props.manga, (m) => {
  if (m) form.value = { ...m };
  else form.value = { title: '', slug: '', description: '', cover_image: '', author: '', status: 'ongoing', year: new Date().getFullYear() };
}, { immediate: true });

const submit = async () => {
  try {
    if (props.manga) {
      await adminAPI.updateManga(props.manga.id, form.value);
    } else {
      await adminAPI.createManga(form.value);
    }
    emit('saved');
    emit('close');
  } catch (err) {
    alert('Ошибка: ' + err.message);
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed; top:0; left:0; right:0; bottom:0;
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
  padding: 25px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}
input, textarea, select {
  width: 100%;
  padding: 8px 12px;
  background: #2B2B2B;
  border: 1px solid #80832A;
  border-radius: 6px;
  color: #fff;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
button {
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
}
button[type="submit"] {
  background: #07660C;
  border: none;
  color: white;
}
button[type="button"] {
  background: none;
  border: 1px solid #80832A;
  color: #80832A;
}
</style>