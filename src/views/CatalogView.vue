<template>
  <div class="catalog-page">
    <div class="container">
      <div class="catalog-header">
        <h1>Каталог манги</h1>
        <div class="catalog-controls">
          <div class="search-bar">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск..."
              class="search-input"
              @keyup.enter="performSearch"
            />
            <button @click="performSearch" class="search-btn">Найти</button>
          </div>
          <div class="sort-container">
            <select v-model="sortBy" class="sort-select" @change="changeSort">
              <option value="popular">Популярные</option>
              <option value="rating">По рейтингу</option>
              <option value="newest">Новые</option>
              <option value="title">По названию</option>
            </select>
          </div>
        </div>
      </div>

      <div class="catalog-content">
        <aside class="sidebar">
          <div class="genres-panel">
            <h3>Жанры</h3>
            <div class="genres-list">
              <span
                v-for="g in genres"
                :key="g"
                class="genre-tag"
                :class="{ active: selectedGenres.includes(g) }"
                @click="toggleGenre(g)"
              >{{ g }}</span>
            </div>
          </div>
        </aside>

        <main class="main-area">
          <div v-if="isLoading" class="loading">Загрузка...</div>
          <div v-else-if="filteredManga.length === 0" class="empty">Манга не найдена</div>
          <div v-else class="manga-grid">
            <div
              v-for="manga in paginatedManga"
              :key="manga.id"
              class="manga-card"
              @click="goToManga(manga.id)"
            >
              <div class="cover">
                <img :src="getCoverUrl(manga.cover_image)" :alt="manga.title" @error="handleImageError" />
              </div>
              <div class="info">
                <h3>{{ manga.title }}</h3>
                <p>{{ manga.chapters_count || 0 }} глав</p>
              </div>
            </div>
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
const sortBy = ref('popular')
const selectedGenres = ref([])
const currentPage = ref(1)
const itemsPerPage = 24

const isLoading = computed(() => mangaStore.isLoading)
const mangaList = computed(() => mangaStore.mangaList)

const genres = computed(() => {
  const all = mangaList.value.flatMap(m => m.genres || [])
  return [...new Set(all)].sort()
})

const filteredManga = computed(() => {
  let result = [...mangaList.value]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(m => m.title.toLowerCase().includes(q))
  }

  if (selectedGenres.value.length) {
    result = result.filter(m =>
      selectedGenres.value.every(g => m.genres?.includes(g))
    )
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

const goToManga = id => router.push(`/manga/${id}`)

const toggleGenre = (g) => {
  if (selectedGenres.value.includes(g)) {
    selectedGenres.value = selectedGenres.value.filter(x => x !== g)
  } else {
    selectedGenres.value.push(g)
  }
  currentPage.value = 1
}

const performSearch = () => {
  currentPage.value = 1
}
const changeSort = () => {
  currentPage.value = 1
}
const changePage = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  mangaStore.fetchAllManga()
})
</script>

<style scoped>
/* ===== ОСНОВНЫЕ ПЕРЕМЕННЫЕ ===== */
.catalog-page {
  background: #121212; /* можно заменить на var(--color-background) если нужно */
  min-height: 100vh;
  padding: 30px 0;
}
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* ===== ЗАГОЛОВОК И УПРАВЛЕНИЕ ===== */
.catalog-header {
  text-align: center;
  margin-bottom: 30px;
}
.catalog-header h1 {
  color: #07660c;
  font-size: 2rem;
}
.catalog-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 800px;
  margin: 20px auto 0;
  flex-wrap: wrap;
  gap: 15px;
}
.search-bar {
  display: flex;
  gap: 8px;
}
.search-input {
  padding: 8px 16px;
  background: #2b2b2b;
  border: 1px solid #80832a;
  border-radius: 20px;
  color: white;
  width: 240px;
}
.search-input:focus {
  outline: none;
  border-color: #07660c;
}
.search-btn {
  background: #07660c;
  border: none;
  color: white;
  border-radius: 20px;
  padding: 8px 20px;
  cursor: pointer;
  font-weight: 600;
}
.sort-container {
  display: flex;
  align-items: center;
}
.sort-select {
  background: #2b2b2b;
  border: 1px solid #80832a;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

/* ===== БОКОВАЯ ПАНЕЛЬ ===== */
.catalog-content {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  margin-top: 20px;
}
.sidebar {
  background: #202020;
  border-radius: 10px;
  padding: 20px;
}
.genres-panel h3 {
  color: #07660c;
  margin-bottom: 10px;
}
.genres-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.genre-tag {
  background: #2b2b2b;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  cursor: pointer;
  color: #a0a0a0;
}
.genre-tag.active {
  background: #07660c;
  color: white;
}
.genre-tag:hover {
  background: #80832a;
  color: white;
}

/* ===== ОСНОВНАЯ ОБЛАСТЬ ===== */
.main-area {
  background: #202020;
  border-radius: 10px;
  padding: 20px;
}
.manga-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}
.manga-card {
  background: #2b2b2b;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}
.manga-card:hover {
  transform: translateY(-3px);
}
.cover {
  height: 200px;
  overflow: hidden;
}
.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.info {
  padding: 10px;
}
.info h3 {
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 0 4px;
  color: white;
}
.info p {
  font-size: 0.8rem;
  color: #a0a0a0;
  margin: 0;
}

/* ===== ЗАГРУЗКА / ПУСТО ===== */
.empty, .loading {
  text-align: center;
  padding: 40px;
  color: #a0a0a0;
}

/* ===== АДАПТИВНОСТЬ ===== */
@media (max-width: 768px) {
  .catalog-controls {
    flex-direction: column;
    align-items: stretch;
  }
  .search-bar {
    justify-content: center;
  }
  .catalog-content {
    grid-template-columns: 1fr;
  }
  .manga-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
  .cover {
    height: 180px;
  }
}
@media (max-width: 480px) {
  .manga-grid {
    grid-template-columns: 1fr 1fr;
  }
  .cover {
    height: 160px;
  }
}
</style>