<!-- components/catalog/QuickSearch.vue -->
<template>
  <div v-if="show && results.length > 0" class="quick-search" ref="container">
    <!-- Результаты поиска -->
    <div class="search-results">
      <div class="results-header">
        <h4>Результаты поиска</h4>
        <span class="results-count">{{ results.length }} найдено</span>
      </div>
      
      <div class="results-list">
        <div
          v-for="manga in results"
          :key="manga.id"
          @click="selectManga(manga)"
          @mouseenter="setHoveredIndex(index)"
          class="result-item"
          :class="{ hovered: hoveredIndex === index }"
          ref="resultItems"
        >
          <div class="result-cover">
            <img 
              :src="manga.cover_url || '/images/default-cover.jpg'" 
              :alt="manga.title_ru"
              @error="handleImageError"
            />
          </div>
          <div class="result-info">
            <h5 class="result-title">{{ manga.title_ru }}</h5>
            <p v-if="manga.title_en" class="result-title-en">{{ manga.title_en }}</p>
            <div v-if="manga.genres" class="result-genres">
              <span 
                v-for="genre in manga.genres.slice(0, 2)" 
                :key="genre"
                class="result-genre"
              >
                {{ genre }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Посмотреть все результаты -->
      <div class="view-all" @click="viewAllResults">
        <span>Посмотреть все результаты по запросу "{{ query }}"</span>
        <span class="view-all-icon">🔍</span>
      </div>
    </div>
    
    <!-- Затемнение фона -->
    <div class="search-overlay" @click="closeSearch"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  query: {
    type: String,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'close'])

const router = useRouter()
const container = ref(null)
const resultItems = ref([])
const hoveredIndex = ref(-1)
const results = ref([])

// Загрузка результатов поиска
watch(() => props.query, async (newQuery) => {
  if (newQuery.length < 2) {
    results.value = []
    return
  }
  
  try {
    // В реальном приложении здесь был бы API-запрос
    // Для демо используем имитацию
    results.value = await mockSearch(newQuery)
  } catch (error) {
    console.error('Ошибка поиска:', error)
    results.value = []
  }
}, { immediate: true })

// Методы
const handleImageError = (event) => {
  event.target.src = '/images/default-cover.jpg'
  event.target.onerror = null
}

const selectManga = (manga) => {
  emit('select', manga)
  closeSearch()
}

const viewAllResults = () => {
  closeSearch()
  router.push({
    path: '/catalog',
    query: { search: props.query }
  })
}

const closeSearch = () => {
  emit('close')
}

const setHoveredIndex = (index) => {
  hoveredIndex.value = index
}

// Навигация по результатам с клавиатуры
const handleKeydown = (event) => {
  if (!props.show || results.value.length === 0) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      hoveredIndex.value = (hoveredIndex.value + 1) % results.value.length
      scrollToHovered()
      break
      
    case 'ArrowUp':
      event.preventDefault()
      hoveredIndex.value = hoveredIndex.value <= 0 
        ? results.value.length - 1 
        : hoveredIndex.value - 1
      scrollToHovered()
      break
      
    case 'Enter':
      event.preventDefault()
      if (hoveredIndex.value >= 0 && hoveredIndex.value < results.value.length) {
        selectManga(results.value[hoveredIndex.value])
      }
      break
      
    case 'Escape':
      event.preventDefault()
      closeSearch()
      break
  }
}

const scrollToHovered = () => {
  if (resultItems.value[hoveredIndex.value]) {
    resultItems.value[hoveredIndex.value].scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    })
  }
}

// Закрытие при клике вне компонента
const handleClickOutside = (event) => {
  if (container.value && !container.value.contains(event.target)) {
    closeSearch()
  }
}

// Имитация поиска (замените на реальный API)
const mockSearch = async (query) => {
  // В реальном приложении здесь будет запрос к вашему API
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const mockData = [
    {
      id: '1',
      slug: 'berserk',
      title_ru: 'Берсерк',
      title_en: 'Berserk',
      cover_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e',
      genres: ['Фэнтези', 'Драма', 'Ужасы']
    },
    {
      id: '2',
      slug: 'attack-on-titan',
      title_ru: 'Атака Титанов',
      title_en: 'Attack on Titan',
      cover_url: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b',
      genres: ['Экшен', 'Драма', 'Фэнтези']
    },
    {
      id: '3',
      slug: 'one-piece',
      title_ru: 'Ван Пис',
      title_en: 'One Piece',
      cover_url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d',
      genres: ['Приключения', 'Комедия', 'Экшен']
    },
    {
      id: '4',
      slug: 'naruto',
      title_ru: 'Наруто',
      title_en: 'Naruto',
      cover_url: 'https://images.unsplash.com/photo-1541562232579-512a21360020',
      genres: ['Экшен', 'Приключения', 'Комедия']
    }
  ]
  
  return mockData.filter(manga => 
    manga.title_ru.toLowerCase().includes(query.toLowerCase()) ||
    manga.title_en.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8)
}

// Жизненный цикл
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.quick-search {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  justify-content: center;
  padding-top: 100px;
}

.search-results {
  background: var(--color-panel);
  border-radius: 12px;
  box-shadow: var(--shadow-heavy);
  width: 100%;
  max-width: 600px;
  max-height: 70vh;
  overflow: hidden;
  z-index: 2001;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 2px solid var(--color-primary);
  background: rgba(7, 102, 12, 0.1);
}

.results-header h4 {
  color: var(--color-text);
  margin: 0;
  font-size: 1.2rem;
}

.results-count {
  color: var(--color-secondary);
  font-size: 0.9rem;
  font-weight: 600;
}

.results-list {
  max-height: calc(70vh - 140px);
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.result-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-normal);
  margin-bottom: var(--spacing-xs);
}

.result-item:hover,
.result-item.hovered {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.result-cover {
  width: 60px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.result-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-title {
  color: var(--color-text);
  margin: 0 0 5px 0;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-title-en {
  color: var(--color-text);
  opacity: 0.7;
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-genres {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.result-genre {
  background: rgba(128, 131, 42, 0.2);
  color: var(--color-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
}

.view-all {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: rgba(128, 131, 42, 0.1);
  border-top: 1px solid var(--color-secondary);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.view-all:hover {
  background: rgba(128, 131, 42, 0.2);
}

.view-all span {
  color: var(--color-secondary);
  font-weight: 600;
  font-size: 0.95rem;
}

.view-all-icon {
  font-size: 1.2rem;
}

.search-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  z-index: 2000;
}

/* Скроллбар */
.results-list::-webkit-scrollbar {
  width: 6px;
}

.results-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.results-list::-webkit-scrollbar-thumb {
  background: var(--color-secondary);
  border-radius: 3px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .quick-search {
    padding: var(--spacing-lg) var(--spacing-md);
  }
  
  .search-results {
    max-height: 80vh;
  }
  
  .results-list {
    max-height: calc(80vh - 140px);
  }
  
  .result-item {
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
  }
  
  .result-cover {
    width: 50px;
    height: 70px;
  }
}

@media (max-width: 480px) {
  .quick-search {
    padding: var(--spacing-md);
  }
  
  .results-header {
    padding: var(--spacing-md);
    flex-direction: column;
    gap: var(--spacing-xs);
    align-items: flex-start;
  }
  
  .view-all {
    flex-direction: column;
    gap: var(--spacing-xs);
    text-align: center;
    padding: var(--spacing-sm);
  }
}
</style>