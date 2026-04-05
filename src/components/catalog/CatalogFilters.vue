<!-- components/catalog/CatalogFilters.vue -->
<template>
  <div class="catalog-filters">
    <!-- Заголовок -->
    <div class="filters-header">
      <h3>Фильтры</h3>
      <button 
        v-if="store.hasFilters" 
        @click="$emit('reset')" 
        class="clear-filters"
      >
        Очистить все
      </button>
    </div>
    
    <!-- Жанры -->
    <div class="filter-section">
      <h4>Жанры</h4>
      <div class="genres-list">
        <label
          v-for="genre in genres"
          :key="genre.id"
          class="genre-checkbox"
          :class="{ active: localFilters.selectedGenres.includes(genre.id) }"
        >
          <input
            type="checkbox"
            :value="genre.id"
            v-model="localFilters.selectedGenres"
            @change="onFilterChange"
            hidden
          />
          {{ genre.name }}
          <span class="genre-count">({{ genre.manga_count || 0 }})</span>
        </label>
      </div>
    </div>
    
    <!-- Статус -->
    <div class="filter-section">
      <h4>Статус</h4>
      <div class="status-options">
        <label
          v-for="option in statusOptions"
          :key="option.value"
          class="status-option"
          :class="{ active: localFilters.status === option.value }"
        >
          <input
            type="radio"
            :value="option.value"
            v-model="localFilters.status"
            @change="onFilterChange"
            hidden
          />
          {{ option.label }}
        </label>
      </div>
    </div>
    
    <!-- Кнопка применения -->
    <button 
      @click="$emit('apply')" 
      class="apply-filters"
      :disabled="!hasChanges"
    >
      Применить фильтры
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCatalogStore } from '@/stores/catalog.store'

const props = defineProps({
  genres: {
    type: Array,
    default: () => []
  },
  filters: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:filters', 'apply', 'reset'])

const store = useCatalogStore()
const localFilters = ref({ ...props.filters })

// Опции статуса
const statusOptions = [
  { value: 'all', label: 'Все' },
  { value: 'ongoing', label: 'Онгоинг' },
  { value: 'completed', label: 'Завершена' },
  { value: 'hiatus', label: 'Перерыв' },
  { value: 'cancelled', label: 'Отменена' }
]

// Проверка изменений
const hasChanges = computed(() => {
  return JSON.stringify(localFilters.value) !== JSON.stringify(props.filters)
})

// Методы
const onFilterChange = () => {
  emit('update:filters', localFilters.value)
}

// Следим за изменением внешних фильтров
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })
</script>

<style scoped>
.catalog-filters {
  background: var(--color-panel);
  padding: var(--spacing-lg);
  border-radius: 12px;
  box-shadow: var(--shadow-medium);
}

.filters-header {
  border-bottom: 2px solid var(--color-primary);
}

.filters-header h3 {
  color: var(--color-text);
  font-size: 1.3rem;
  margin: 0;
}

.clear-filters {
  color: var(--color-secondary);
  border: 1px solid var(--color-secondary);
}

.clear-filters:hover {
  background: var(--color-secondary);
}

.filter-section {
  margin-bottom: var(--spacing-lg);
}

.filter-section h4 {
  color: var(--color-text);
  opacity: 0.9;
  margin-bottom: var(--spacing-sm);
  font-size: 1.1rem;
}

.genres-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 300px;
  overflow-y: auto;
  padding-right: var(--spacing-sm);
}

.genre-checkbox {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-normal);
  user-select: none;
}

.genre-checkbox:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--color-secondary);
}

.genre-checkbox.active {
  background: rgba(7,102,12,0.2);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.genre-count {
  font-size: 0.8rem;
  opacity: 0.7;
}

.status-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.status-option {
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-normal);
  text-align: center;
  user-select: none;
}

.status-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.status-option.active {
  background: var(--color-primary);
}

.apply-filters {
  background: var(--color-primary);
}

.apply-filters:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.apply-filters:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Скроллбар */
.genres-list::-webkit-scrollbar {
  width: 6px;
}

.genres-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.genres-list::-webkit-scrollbar-thumb {
  background: var(--color-secondary);
  border-radius: 3px;
}
</style>