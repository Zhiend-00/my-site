<!-- components/catalog/Pagination.vue -->
<template>
  <div class="pagination">
    <!-- Предыдущая страница -->
    <button
      @click="goToPage(currentPage - 1)"
      :disabled="currentPage <= 1"
      class="pagination-btn prev"
      :class="{ disabled: currentPage <= 1 }"
      title="Предыдущая страница"
    >
      ←
    </button>
    
    <!-- Номера страниц -->
    <div class="page-numbers">
      <!-- Первая страница -->
      <button
        v-if="showFirstPage"
        @click="goToPage(1)"
        class="page-btn"
        :class="{ active: currentPage === 1 }"
      >
        1
      </button>
      
      <!-- Многоточие в начале -->
      <span v-if="showStartEllipsis" class="ellipsis">...</span>
      
      <!-- Основные страницы -->
      <button
        v-for="page in visiblePages"
        :key="page"
        @click="goToPage(page)"
        class="page-btn"
        :class="{ active: currentPage === page }"
      >
        {{ page }}
      </button>
      
      <!-- Многоточие в конце -->
      <span v-if="showEndEllipsis" class="ellipsis">...</span>
      
      <!-- Последняя страница -->
      <button
        v-if="showLastPage"
        @click="goToPage(totalPages)"
        class="page-btn"
        :class="{ active: currentPage === totalPages }"
      >
        {{ totalPages }}
      </button>
    </div>
    
    <!-- Следующая страница -->
    <button
      @click="goToPage(currentPage + 1)"
      :disabled="currentPage >= totalPages"
      class="pagination-btn next"
      :class="{ disabled: currentPage >= totalPages }"
      title="Следующая страница"
    >
      →
    </button>
    
    <!-- Информация о странице -->
    <div class="page-info">
      Страница {{ currentPage }} из {{ totalPages }}
    </div>
    
    <!-- Прыжок на страницу -->
    <div class="jump-to">
      <input
        type="number"
        v-model="jumpPage"
        :min="1"
        :max="totalPages"
        placeholder="№"
        class="jump-input"
        @keyup.enter="jumpToPage"
      />
      <button @click="jumpToPage" class="jump-btn" title="Перейти">
        →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
    default: 1
  },
  totalPages: {
    type: Number,
    required: true,
    default: 1
  },
  maxVisible: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['page-change'])

const jumpPage = ref('')

// Вычисляемые свойства для отображения страниц
const showFirstPage = computed(() => {
  return props.currentPage > props.maxVisible / 2 + 1
})

const showLastPage = computed(() => {
  return props.currentPage < props.totalPages - props.maxVisible / 2
})

const showStartEllipsis = computed(() => {
  return props.currentPage > props.maxVisible / 2 + 2
})

const showEndEllipsis = computed(() => {
  return props.currentPage < props.totalPages - props.maxVisible / 2 - 1
})

const visiblePages = computed(() => {
  const pages = []
  let start = Math.max(2, props.currentPage - Math.floor(props.maxVisible / 2))
  let end = Math.min(props.totalPages - 1, start + props.maxVisible - 1)
  
  // Корректируем start, если не хватает страниц в конце
  start = Math.max(2, end - props.maxVisible + 1)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Методы
const goToPage = (page) => {
  if (page < 1 || page > props.totalPages || page === props.currentPage) {
    return
  }
  emit('page-change', page)
}

const jumpToPage = () => {
  const page = parseInt(jumpPage.value)
  if (page && page >= 1 && page <= props.totalPages) {
    goToPage(page)
    jumpPage.value = ''
  }
}

// Следим за изменением currentPage для сброса jumpPage
watch(() => props.currentPage, () => {
  jumpPage.value = ''
})
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  padding: var(--spacing-lg);
  background: var(--color-panel);
  border-radius: 12px;
  margin-top: var(--spacing-xl);
}

.pagination-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--color-secondary);
  color: var(--color-text);
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all var(--transition-normal);
  user-select: none;
}

.pagination-btn:hover:not(.disabled) {
  background: var(--color-secondary);
  color: white;
  transform: translateY(-2px);
}

.pagination-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.page-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text);
  min-width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-normal);
  user-select: none;
}

.page-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--color-secondary);
}

.page-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  font-weight: 600;
  transform: scale(1.05);
}

.ellipsis {
  color: var(--color-text);
  opacity: 0.5;
  padding: 0 var(--spacing-sm);
  user-select: none;
}

.page-info {
  color: var(--color-text);
  opacity: 0.8;
  font-size: 0.9rem;
  margin: 0 var(--spacing-md);
  white-space: nowrap;
}

.jump-to {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: var(--spacing-md);
}

.jump-input {
  width: 60px;
  padding: var(--spacing-sm);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--color-secondary);
  border-radius: 6px;
  color: var(--color-text);
  text-align: center;
  font-size: 0.9rem;
}

.jump-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(7, 102, 12, 0.2);
}

.jump-btn {
  background: var(--color-secondary);
  color: white;
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-normal);
}

.jump-btn:hover {
  background: color-mix(in srgb, var(--color-secondary) 90%, white);
}

/* Адаптивность */
@media (max-width: 768px) {
  .pagination {
    padding: var(--spacing-md);
    gap: var(--spacing-xs);
  }
  
  .pagination-btn,
  .page-btn {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }
  
  .page-info {
    margin: 0 var(--spacing-sm);
    font-size: 0.85rem;
  }
  
  .jump-to {
    margin-left: var(--spacing-sm);
  }
  
  .jump-input {
    width: 50px;
    padding: var(--spacing-xs);
  }
  
  .jump-btn {
    width: 30px;
    height: 30px;
  }
}

@media (max-width: 576px) {
  .pagination {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .page-numbers {
    order: 1;
  }
  
  .pagination-btn {
    order: 0;
  }
  
  .page-info {
    order: 2;
    margin: 0;
  }
  
  .jump-to {
    order: 3;
    margin-left: 0;
  }
}
</style>