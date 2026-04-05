<template>
  <div class="manga-page" v-if="manga">
    <div class="container">
      <div class="manga-header">
        <div class="manga-cover">
          <img :src="getCoverUrl(manga.cover_image)" :alt="manga.title" />
        </div>
        <div class="manga-info">
          <h1>{{ manga.title }}</h1>
          <p class="description">{{ manga.description }}</p>
          <div class="meta">
            <span>Автор: {{ manga.author }}</span>
            <span>Статус: {{ getStatusText(manga.status) }}</span>
            <span>Год: {{ manga.year }}</span>
            <span>Рейтинг: ⭐ {{ manga.rating || '0.0' }}</span>
          </div>
          <div class="genres">
            <span v-for="genre in manga.genres" :key="genre" class="genre-tag">{{ genre }}</span>
          </div>
          <div class="action-buttons">
            <div class="dropdown" ref="dropdownRef">
              <button class="btn-bookmark" @click.stop="toggleDropdown">📑 Добавить в закладки</button>
              <div class="dropdown-menu" v-if="dropdownOpen">
                <button @click="setStatus('reading')">📖 Читаю</button>
                <button @click="setStatus('completed')">✅ Прочитано</button>
                <button @click="setStatus('dropped')">❌ Брошено</button>
                <button @click="setStatus('planned')">📅 Запланировано</button>
              </div>
            </div>
            <button class="btn-read" @click="startReading">
              {{ hasProgress ? '📖 Продолжить читать' : '📖 Читать с начала' }}
            </button>
          </div>
        </div>
      </div>

      <div class="chapters-section">
        <div class="chapters-header">
          <h2>Список глав</h2>
          <button class="btn-invert" @click="invertOrder">
            🔄 {{ orderAsc ? 'С начала' : 'С конца' }}
          </button>
        </div>
        <div class="chapters-list">
          <div
            v-for="chapter in orderedChapters"
            :key="chapter.id"
            class="chapter-item"
            @click="goToChapter(chapter.id)"
          >
            <span>Глава {{ chapter.chapter_number }}</span>
            <span class="chapter-title">{{ chapter.title }}</span>
            <span class="chapter-date">{{ formatDate(chapter.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="loading">Загрузка...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMangaStore } from '@/stores/manga';
import { useAuthStore } from '@/stores/auth';
import { getCoverUrl } from '@/utils/imageHelper';
import { userMangaStatusAPI, progressAPI } from '@/api';

const route = useRoute();
const router = useRouter();
const mangaStore = useMangaStore();
const authStore = useAuthStore();

const manga = ref(null);
const loading = ref(true);
const error = ref(null);
const orderAsc = ref(true);
const dropdownOpen = ref(false);
const hasProgress = ref(false);
const dropdownRef = ref(null);

const orderedChapters = computed(() => {
  if (!manga.value?.chapters) return [];
  const chapters = [...manga.value.chapters];
  return orderAsc.value
    ? chapters.sort((a, b) => a.chapter_number - b.chapter_number)
    : chapters.sort((a, b) => b.chapter_number - a.chapter_number);
});

const getStatusText = (status) => {
  const map = { ongoing: 'Онгоинг', completed: 'Завершена', hiatus: 'Перерыв' };
  return map[status] || status;
};

const formatDate = (date) => new Date(date).toLocaleDateString('ru-RU');

const toggleDropdown = () => { dropdownOpen.value = !dropdownOpen.value; };
const closeDropdown = () => { dropdownOpen.value = false; };

const setStatus = async (status) => {
  if (!authStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  try {
    await userMangaStatusAPI.set(authStore.user.id, manga.value.id, status);
    closeDropdown();
    alert(`Статус "${status}" сохранён`);
  } catch (err) {
    console.error(err);
    alert('Ошибка сохранения статуса');
  }
};

const startReading = async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  let chapterId = null;
  if (hasProgress.value) {
    try {
      const progress = await progressAPI.get(manga.value.id, authStore.user.id);
      if (progress && progress.chapter_id) chapterId = progress.chapter_id;
    } catch (err) {
      console.warn('Прогресс не загружен', err);
    }
  }
  if (!chapterId && manga.value.chapters?.length) {
    chapterId = manga.value.chapters[0].id;
  }
  if (chapterId) router.push(`/chapter/${chapterId}`);
};

const goToChapter = (chapterId) => {
  router.push(`/chapter/${chapterId}`);
};

const loadData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const id = route.params.id;
    const data = await mangaStore.fetchMangaById(id);
    if (!data) throw new Error('Манга не найдена');
    manga.value = data;
    if (authStore.isLoggedIn) {
      try {
        const progress = await progressAPI.get(data.id, authStore.user.id);
        hasProgress.value = !!progress;
      } catch (err) {
        console.warn('Прогресс не загружен', err);
        hasProgress.value = false;
      }
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const invertOrder = () => {
  orderAsc.value = !orderAsc.value;
};

const handleClickOutside = (event) => {
  if (dropdownOpen.value && dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  loadData();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* стили такие же, как в предыдущем варианте – оставьте свои */
.manga-page { padding: 40px 0; background: #000; color: #fff; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.manga-header { display: flex; gap: 40px; margin-bottom: 50px; flex-wrap: wrap; }
.manga-cover { flex: 0 0 250px; }
.manga-cover img { width: 100%; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.5); }
.manga-info { flex: 1; }
h1 { font-size: 2rem; color: #07660C; margin-bottom: 15px; }
.description { color: #ccc; line-height: 1.6; margin-bottom: 20px; }
.meta { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 15px; color: #80832A; }
.genres { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 25px; }
.genre-tag { background: #2B2B2B; padding: 5px 12px; border-radius: 20px; font-size: 0.9rem; }
.action-buttons { display: flex; gap: 15px; }
.btn-bookmark, .btn-read { padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-bookmark { background: #80832A; color: white; }
.btn-read { background: #07660C; color: white; }
.btn-bookmark:hover, .btn-read:hover { transform: translateY(-2px); filter: brightness(1.1); }
.dropdown { position: relative; }
.dropdown-menu { position: absolute; top: 100%; left: 0; background: #2B2B2B; border-radius: 8px; overflow: hidden; z-index: 10; margin-top: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
.dropdown-menu button { display: block; width: 100%; padding: 10px 20px; background: none; border: none; color: white; text-align: left; cursor: pointer; transition: background 0.2s; }
.dropdown-menu button:hover { background: #07660C; }
.chapters-section { margin-top: 40px; }
.chapters-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.btn-invert { background: #2B2B2B; border: 1px solid #80832A; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.chapters-list { background: #202020; border-radius: 12px; overflow: hidden; }
.chapter-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #2B2B2B; cursor: pointer; transition: background 0.2s; }
.chapter-item:hover { background: #2B2B2B; }
.chapter-title { color: #80832A; flex: 1; margin-left: 20px; }
.chapter-date { font-size: 0.85rem; color: #666; }
.loading, .error { text-align: center; padding: 50px; color: white; }
</style>