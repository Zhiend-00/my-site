<!-- components/forum/QuickSearch.vue -->
<template>
  <div v-if="show && searchResults.length > 0" class="forum-quick-search" ref="container">
    <div class="search-results">
      <div class="results-header">
        <h4>Результаты поиска</h4>
        <span class="results-count">{{ searchResults.length }}</span>
      </div>
      
      <div class="results-list">
        <div
          v-for="result in searchResults"
          :key="result.id"
          @click="selectResult(result)"
          class="result-item"
          :class="{ hovered: hoveredIndex === index }"
        >
          <div class="result-type" :class="result.type">
            {{ result.type === 'topic' ? '💬' : '💭' }}
          </div>
          <div class="result-content">
            <div class="result-title">
              {{ result.title || truncateText(result.content, 60) }}
            </div>
            <div class="result-meta">
              <span class="result-author">👤 {{ result.author?.username || 'Аноним' }}</span>
              <span class="result-date">{{ formatDate(result.created_at) }}</span>
              <span v-if="result.category" class="result-category">
                📁 {{ result.category.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="view-all" @click="viewAllResults">
        <span>Посмотреть все результаты по запросу "{{ query }}"</span>
        <span class="view-all-icon">🔍</span>
      </div>
    </div>
    
    <div class="search-overlay" @click="closeSearch"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
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
const hoveredIndex = ref(-1)
const searchResults = ref([])

// Имитация поиска (в реальном приложении будет API-запрос)
const performSearch = async (query) => {
  if (query.length < 2) {
    searchResults.value = []
    return
  }
  
  // Имитация задержки
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Тестовые данные
  searchResults.value = [
    {
      id: '1',
      type: 'topic',
      title: 'Обсуждение новой главы Берсерка',
      author: { username: 'МангаЛюб' },
      category: { name: 'Манга', slug: 'manga' },
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '2',
      type: 'topic',
      title: 'Проблемы с загрузкой глав на сайте',
      author: { username: 'Читатель_42' },
      category: { name: 'Технические вопросы', slug: 'tech' },
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: '3',
      type: 'post',
      content: 'Я тоже столкнулся с этой проблемой. Попробуйте очистить кэш браузера...',
      author: { username: 'Admin' },
      created_at: new Date(Date.now() - 1800000).toISOString()
    }
  ]
}

// Методы
const selectResult = (result) => {
  emit('select', result)
  closeSearch()
}

const viewAllResults = () => {
  closeSearch()
  router.push({
    path: '/forum/search',
    query: { q: props.query }
  })
}

const closeSearch = () => {
  emit('close')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffHours = Math.floor((now - date) / 3600000)
  
  if (diffHours < 1) return 'только что'
  if (diffHours < 24) return `${diffHours} ч назад`
  return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Закрытие при клике вне компонента
const handleClickOutside = (event) => {
  if (container.value && !container.value.contains(event.target)) {
    closeSearch()
  }
}

// Запуск поиска при изменении запроса
watch(() => props.query, performSearch)

// Жизненный цикл
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.forum-quick-search {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  justify-content: center;
  padding-top: 120px;
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
  background: var(--color-primary);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
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
  align-items: flex-start;
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
}

.result-type {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.result-type.topic {
  color: var(--color-primary);
}

.result-type.post {
  color: var(--color-secondary);
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 6px;
  line-height: 1.3;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.7;
}

.result-category {
  background: rgba(128, 131, 42, 0.2);
  color: var(--color-secondary);
  padding: 2px 6px;
  border-radius: 4px;
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
</style>