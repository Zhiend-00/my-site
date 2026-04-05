<template>
  <div class="home">
    <div class="container">
      <h1 class="page-title">📚 Forgotten Team</h1>
      <div class="search-section">
        <input v-model="searchQuery" @keyup.enter="goToSearch" type="text" placeholder="🔍 Найти мангу..." class="search-input" />
        <button @click="goToSearch" class="search-btn">Найти</button>
      </div>
      <section class="manga-section">
        <h2>🔥 Популярное сейчас</h2>
        <div v-if="isLoading" class="skeleton-grid"><div v-for="n in 5" :key="n" class="skeleton-card"></div></div>
        <div v-else-if="error" class="error-message"><p>❌ {{ error }}</p><button @click="retryLoading" class="retry-btn">Повторить</button></div>
        <div v-else class="manga-grid">
          <div v-for="manga in popularManga" :key="manga.id" class="manga-card">
            <router-link :to="`/manga/${manga.slug || manga.id}`" class="manga-link">
              <div class="manga-cover"><img :src="getCoverUrl(manga.cover_image)" :alt="manga.title" @error="handleImageError" /></div>
              <div class="manga-info"><h3>{{ manga.title }}</h3><div class="manga-meta"><span class="rating">⭐ {{ manga.rating || '0.0' }}</span><span class="views">👁 {{ formatNumber(manga.views) }}</span></div></div>
            </router-link>
          </div>
        </div>
      </section>
      <section class="manga-section">
        <h2>🆕 Новинки</h2>
        <div v-if="isLoading" class="skeleton-grid"><div v-for="n in 5" :key="n" class="skeleton-card"></div></div>
        <div v-else-if="error" class="error-message"><p>❌ {{ error }}</p><button @click="retryLoading" class="retry-btn">Повторить</button></div>
        <div v-else class="manga-grid">
          <div v-for="manga in newManga" :key="manga.id" class="manga-card">
            <router-link :to="`/manga/${manga.slug || manga.id}`" class="manga-link">
              <div class="manga-cover"><img :src="getCoverUrl(manga.cover_image)" :alt="manga.title" @error="handleImageError" /></div>
              <div class="manga-info"><h3>{{ manga.title }}</h3><p class="new-date">{{ formatDate(manga.created_at) }}</p></div>
            </router-link>
          </div>
        </div>
      </section>
      <div class="catalog-link"><router-link to="/catalog" class="btn-primary">📚 Весь каталог</router-link></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMangaStore } from '@/stores/manga';
import { getCoverUrl, handleImageError } from '@/utils/imageHelper';

const router = useRouter();
const mangaStore = useMangaStore();
const searchQuery = ref('');

const isLoading = computed(() => mangaStore.isLoading);
const error = computed(() => mangaStore.error);
const mangaList = computed(() => mangaStore.mangaList);

const popularManga = computed(() => [...mangaList.value].sort((a,b) => (b.views||0)-(a.views||0)).slice(0,5));
const newManga = computed(() => [...mangaList.value].sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).slice(0,5));

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1e6) return (num/1e6).toFixed(1)+'M';
  if (num >= 1e3) return (num/1e3).toFixed(1)+'K';
  return num.toString();
};
const formatDate = (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '';
const goToSearch = () => { if (searchQuery.value.trim()) router.push({ path: '/catalog', query: { search: searchQuery.value.trim() } }); };
const retryLoading = () => mangaStore.fetchAllManga();

onMounted(() => {
  mangaStore.fetchAllManga();
});
</script>

<style scoped>
/* Ваши стили из HomeView.vue, которые вы уже показали */
.home { background: #000000; color: #ffffff; min-height: 100vh; padding: 20px 0; }
.container { max-width: 1400px; margin: 0 auto; padding: 0 20px; }
.page-title { font-size: 2.5rem; color: #07660C; text-align: center; margin-bottom: 30px; }
.search-section { display: flex; max-width: 500px; margin: 0 auto 30px; gap: 10px; }
.search-input { flex: 1; padding: 12px 20px; background: #202020; border: 1px solid #2B2B2B; border-radius: 30px; color: #fff; }
.search-btn { padding: 12px 24px; background: #07660C; border: none; border-radius: 30px; color: white; font-weight: 600; cursor: pointer; }
.search-btn:hover { background: #0a7e0f; }
.manga-section { margin-top: 50px; }
h2 { color: #07660C; margin-bottom: 20px; font-size: 1.8rem; }
.manga-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
.manga-card { background: #202020; border: 1px solid #2B2B2B; border-radius: 10px; overflow: hidden; transition: transform 0.2s, border-color 0.2s; }
.manga-card:hover { transform: translateY(-4px); border-color: #07660C; }
.manga-link { text-decoration: none; color: inherit; display: block; }
.manga-cover { height: 250px; overflow: hidden; }
.manga-cover img { width: 100%; height: 100%; object-fit: cover; }
.manga-info { padding: 15px; }
.manga-info h3 { margin: 0 0 8px; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.manga-meta { display: flex; justify-content: space-between; font-size: 0.9rem; color: #80832A; }
.rating { color: #ffd700; }
.new-date { color: #80832A; font-size: 0.85rem; margin: 5px 0 0; }
.skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
.skeleton-card { height: 300px; background: #2B2B2B; border-radius: 10px; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
.error-message { text-align: center; padding: 40px; background: #202020; border-radius: 10px; color: #ff6b6b; }
.retry-btn { background: #07660C; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 15px; }
.catalog-link { text-align: center; margin: 50px 0; }
.btn-primary { display: inline-block; padding: 12px 30px; background: #07660C; color: white; text-decoration: none; border-radius: 30px; font-weight: 600; }
</style>