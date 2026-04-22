<template>
  <div class="catalog-page">
    <div class="container">
      <div class="catalog-header">
        <h1>Каталог манги</h1>
        <div class="catalog-controls">
          <div class="search-container">
            <input
              v-model="searchQuery"
              @input="onSearchInput"
              @keyup.enter="performSearch"
              type="text"
              placeholder="Поиск по каталогу..."
              class="search-input"
            />
            <button @click="performSearch" class="search-btn">Найти</button>
          </div>
          <button @click="toggleViewMode" class="view-toggle">
            {{ viewMode === 'grid' ? 'Список' : 'Сетка' }}
          </button>
        </div>
      </div>
      <div class="catalog-content">
        <aside class="catalog-sidebar">
          <div class="stats-card">
            <h3>Статистика</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Тайтлов</span>
                <span class="stat-value">{{ mangaCount }}</span>
              </div>
            </div>
          </div>
          <div class="genres-card">
            <h3>Жанры</h3>
            <div class="genres-list">
              <span
                v-for="genre in genres"
                :key="genre"
                @click="toggleGenre(genre)"
                class="genre-tag"
                :class="{ active: selectedGenres.includes(genre) }"
              >
                {{ genre }}
              </span>
            </div>
            <p v-if="selectedGenres.length > 0" class="selected-info">
              Выбрано: {{ selectedGenres.join(', ') }}
            </p>
          </div>
        </aside>
        <main class="catalog-main">
          <div class="sort-controls">
            <select v-model="sortBy" @change="changeSort" class="sort-select">
              <option value="popular">По популярности</option>
              <option value="rating">По рейтингу</option>
              <option value="newest">Новые</option>
              <option value="title">По названию</option>
            </select>
          </div>
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Загрузка...</p>
          </div>
          <div v-else-if="error" class="error-state">
            <p>Ошибка загрузки</p>
          </div>
          <div v-else-if="filteredManga.length > 0" class="manga-grid" :class="{ list: viewMode === 'list' }">
            <div v-for="manga in paginatedManga" :key="manga.id" class="manga-card" @click="goToManga(manga.id)">
              <div class="manga-cover">
                <img :src="getCoverUrl(manga.cover_image)" :alt="manga.title" @error="handleImageError" />
              </div>
              <div class="manga-info">
                <h3>{{ manga.title }}</h3>
                <div class="manga-meta">
                  <span class="rating">{{ formatRating(manga.rating) }}</span>
                  <span class="chapters">{{ manga.chapters_count || 0 }} глав</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>Манга не найдена</h3>
            <button @click="resetFilters" class="reset-btn">Сбросить фильтры</button>
          </div>
          <Pagination
            v-if="totalPages > 1"
            :current-page="currentPage"
            :total-pages="totalPages"
            @page-change="changePage"
          />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMangaStore } from '@/stores/manga'
import { getCoverUrl, handleImageError } from '@/utils/imageHelper'
import Pagination from '@/components/catalog/Pagination.vue'

const router = useRouter()
const mangaStore = useMangaStore()

const searchQuery = ref('')
const viewMode = ref('grid')
const sortBy = ref('popular')
const selectedGenres = ref([])
const currentPage = ref(1)
const itemsPerPage = 20

const isLoading = computed(() => mangaStore.isLoading)
const error = computed(() => mangaStore.error)
const mangaList = computed(() => mangaStore.mangaList)
const mangaCount = computed(() => mangaList.value.length)

const genres = computed(() => {
  const set = new Set()
  mangaList.value.forEach((m) => m.genres?.forEach((g) => set.add(g)))
  return Array.from(set).sort()
})

const filteredManga = computed(() => {
  let result = [...mangaList.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((m) => m.title.toLowerCase().includes(q))
  }
  if (selectedGenres.value.length > 0) {
    result = result.filter((m) => selectedGenres.value.every((g) => m.genres?.includes(g)))
  }
  switch (sortBy.value) {
    case 'popular':
      result.sort((a, b) => (b.views || 0) - (a.views || 0))
      break
    case 'rating':
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      break
    case 'newest':
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      break
    case 'title':
      result.sort((a, b) => a.title.localeCompare(b.title))
      break
  }
  return result
})

const paginatedManga = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredManga.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(filteredManga.value.length / itemsPerPage))

const formatRating = (rating) => (rating ? rating.toFixed(1) : '0.0')

const goToManga = (id) => router.push(`/manga/${id}`)
const toggleGenre = (genre) => {
  if (selectedGenres.value.includes(genre)) {
    selectedGenres.value = selectedGenres.value.filter((g) => g !== genre)
  } else {
    if (selectedGenres.value.length < 3) {
      selectedGenres.value.push(genre)
    } else {
      alert('Можно выбрать не более 3 жанров')
    }
  }
  currentPage.value = 1
}
const resetFilters = () => {
  searchQuery.value = ''
  selectedGenres.value = []
  sortBy.value = 'popular'
  currentPage.value = 1
}
const changeSort = () => {
  currentPage.value = 1
}
const changePage = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const onSearchInput = () => {}
const performSearch = () => {
  currentPage.value = 1
}
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

onMounted(() => {
  mangaStore.fetchAllManga()
})
</script>

<style scoped>
.catalog-page {
  background: #000000;
  color: #ffffff;
  min-height: 100vh;
  padding: 40px 0;
}
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}
.catalog-header h1 {
  font-size: 2.5rem;
  color: #07660c;
  text-align: center;
  margin-bottom: 30px;
}
.catalog-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}
.search-container {
  flex: 1;
  max-width: 500px;
  display: flex;
  gap: 10px;
}
.search-input {
  flex: 1;
  padding: 10px 20px;
  background: #202020;
  border: 2px solid #80832a;
  border-radius: 30px;
  color: #fff;
}
.search-btn {
  background: #07660c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
}
.view-toggle {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #80832a;
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}
.catalog-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 30px;
}
.catalog-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.stats-card,
.genres-card {
  background: #202020;
  padding: 20px;
  border-radius: 12px;
}
.stats-card h3,
.genres-card h3 {
  color: #07660c;
  margin-bottom: 15px;
}
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
.stat-item {
  background: #2b2b2b;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
}
.stat-label {
  color: #80832a;
  font-size: 0.9rem;
}
.stat-value {
  color: #fff;
  font-size: 1.2rem;
  font-weight: 600;
}
.genres-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.genre-tag {
  background: #2b2b2b;
  color: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
}
.genre-tag.active {
  background: #07660c;
}
.selected-info {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #80832a;
}
.sort-select {
  background: #2b2b2b;
  border: 1px solid #80832a;
  border-radius: 6px;
  color: #fff;
  padding: 8px 12px;
  margin-bottom: 20px;
}
.manga-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}
.manga-grid.list {
  grid-template-columns: 1fr;
}
.manga-card {
  background: #202020;
  border: 1px solid #2b2b2b;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}
.manga-card:hover {
  transform: translateY(-4px);
  border-color: #07660c;
}
.manga-cover {
  height: 250px;
  overflow: hidden;
}
.manga-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.manga-info {
  padding: 15px;
}
.manga-info h3 {
  font-size: 1rem;
  margin: 0 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.manga-meta {
  display: flex;
  justify-content: space-between;
  color: #80832a;
  font-size: 0.9rem;
}
.rating::before {
  content: '★';
  color: #ffd700;
  margin-right: 3px;
}
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 60px;
  background: #202020;
  border-radius: 12px;
}
.spinner {
  border: 4px solid #2b2b2b;
  border-top: 4px solid #07660c;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.reset-btn {
  background: #07660c;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 20px;
}
</style>