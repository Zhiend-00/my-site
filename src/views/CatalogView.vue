<template>
  <div class="catalog-page">
    <div class="container">
      <div class="catalog-header">
        <h1>Каталог манги</h1>
        <div class="catalog-controls">
          <div class="search-bar">
            <input v-model="searchQuery" type="text" placeholder="Поиск..." class="search-input" @keyup.enter="performSearch" />
            <button @click="performSearch" class="search-btn">Найти</button>
          </div>
          <div class="view-options">
            <button @click="toggleViewMode" class="view-toggle">
              {{ viewMode === 'grid' ? 'Список' : 'Сетка' }}
            </button>
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
              <span v-for="g in genres" :key="g" class="genre-tag" :class="{ active: selectedGenres.includes(g) }" @click="toggleGenre(g)">{{ g }}</span>
            </div>
          </div>
        </aside>

        <main class="main-area">
          <div v-if="isLoading" class="loading">Загрузка...</div>
          <div v-else-if="filteredManga.length === 0" class="empty">Манга не найдена</div>
          <div v-else class="manga-grid" :class="{ list: viewMode === 'list' }">
            <div v-for="manga in paginatedManga" :key="manga.id" class="manga-card" @click="goToManga(manga.id)">
              <div class="cover"><img :src="getCoverUrl(manga.cover_image)" :alt="manga.title" @error="handleImageError" /></div>
              <div class="info">
                <h3>{{ manga.title }}</h3>
                <p>{{ manga.chapters_count || 0 }} глав</p>
              </div>
            </div>
          </div>
          <Pagination v-if="totalPages > 1" :current-page="currentPage" :total-pages="totalPages" @page-change="changePage" />
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
const itemsPerPage = 24

const isLoading = computed(() => mangaStore.isLoading)
const mangaList = computed(() => mangaStore.mangaList)
const genres = computed(() => [...new Set(mangaList.value.flatMap(m => m.genres || []))].sort())

const filteredManga = computed(() => {
  let result = [...mangaList.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(m => m.title.toLowerCase().includes(q))
  }
  if (selectedGenres.value.length) {
    result = result.filter(m => selectedGenres.value.every(g => m.genres?.includes(g)))
  }
  if (sortBy.value === 'popular') result.sort((a,b) => (b.views||0)-(a.views||0))
  if (sortBy.value === 'rating') result.sort((a,b) => (b.rating||0)-(a.rating||0))
  if (sortBy.value === 'newest') result.sort((a,b) => new Date(b.created_at)-new Date(a.created_at))
  if (sortBy.value === 'title') result.sort((a,b) => a.title.localeCompare(b.title))
  return result
})
const paginatedManga = computed(() => filteredManga.value.slice((currentPage.value-1)*itemsPerPage, currentPage.value*itemsPerPage))
const totalPages = computed(() => Math.ceil(filteredManga.value.length / itemsPerPage))

const goToManga = id => router.push(`/manga/${id}`)
const toggleGenre = g => {
  if (selectedGenres.value.includes(g)) selectedGenres.value = selectedGenres.value.filter(x => x!==g)
  else if (selectedGenres.value.length < 3) selectedGenres.value.push(g)
  currentPage.value = 1
}
const performSearch = () => currentPage.value=1
const changeSort = () => currentPage.value=1
const changePage = p => { currentPage.value=p; window.scrollTo({top:0,behavior:'smooth'}) }
const toggleViewMode = () => viewMode.value = viewMode.value==='grid'?'list':'grid'
onMounted(() => mangaStore.fetchAllManga())
</script>

<style scoped>
.catalog-page { background: var(--color-background); min-height: 100vh; padding: 30px 0; }
.catalog-header { text-align: center; margin-bottom: 30px; }
.catalog-header h1 { color: var(--color-primary); font-size: 2rem; }
.catalog-controls { display: flex; justify-content: space-between; align-items: center; max-width: 800px; margin: 20px auto 0; }
.search-bar { display: flex; gap: 8px; }
.search-input { padding: 8px 16px; background: var(--color-panel-light); border: 1px solid var(--color-secondary); border-radius: 20px; color: white; width: 240px; }
.search-btn { background: var(--color-primary); border: none; color: white; border-radius: 20px; padding: 8px 20px; cursor: pointer; }
.view-options { display: flex; gap: 10px; align-items: center; }
.view-toggle { background: transparent; border: 1px solid var(--color-secondary); color: white; padding: 6px 14px; border-radius: 20px; cursor: pointer; }
.sort-select { background: var(--color-panel-light); border: 1px solid var(--color-secondary); color: white; padding: 6px 10px; border-radius: 6px; }
.catalog-content { display: grid; grid-template-columns: 220px 1fr; gap: 20px; margin-top: 20px; }
.sidebar { background: var(--color-panel); border-radius: 10px; padding: 20px; }
.genres-panel h3 { color: var(--color-primary); margin-bottom: 10px; }
.genres-list { display: flex; flex-wrap: wrap; gap: 6px; }
.genre-tag { background: var(--color-panel-light); padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; cursor: pointer; color: var(--color-text-muted); }
.genre-tag.active { background: var(--color-primary); color: white; }
.main-area { background: var(--color-panel); border-radius: 10px; padding: 20px; }
.manga-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }
.manga-grid.list { grid-template-columns: 1fr; }
.manga-card { background: var(--color-panel-light); border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform var(--transition-fast); }
.manga-card:hover { transform: translateY(-3px); }
.cover { height: 200px; overflow: hidden; }
.cover img { width: 100%; height: 100%; object-fit: cover; }
.info { padding: 10px; }
.info h3 { font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.info p { font-size: 0.8rem; color: var(--color-text-muted); }
.empty, .loading { text-align: center; padding: 40px; color: var(--color-text-muted); }
</style>