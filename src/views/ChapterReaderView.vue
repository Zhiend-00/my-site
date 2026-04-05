<template>
  <div class="reader" :class="{ 'webtoon-mode': readingMode === 'webtoon' }" v-if="!error">
    <!-- Верхняя панель настроек -->
    <div class="reader-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn" title="Назад к манге">
          ← Назад
        </button>
        <h2>{{ chapterTitle }}</h2>
      </div>
      
      <div class="header-right">
        <button @click="toggleReadingMode" class="settings-btn">
          {{ readingMode === 'webtoon' ? '📜 Веб-тун' : '📖 Постранично' }}
        </button>
        <button @click="toggleBookmark" class="settings-btn" :class="{ active: isBookmarked }">
          {{ isBookmarked ? '🔖 В закладках' : '🔖 Закладка' }}
        </button>
        <button @click="saveProgress" class="settings-btn">
          💾 Сохранить
        </button>
        <button @click="toggleFullscreen" class="settings-btn">
          🖥️ На весь экран
        </button>
        <button @click="showSettings = !showSettings" class="settings-btn">
          ⚙️
        </button>
      </div>
    </div>
    
    <!-- Панель настроек -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-group">
        <label>Масштаб:</label>
        <input type="range" v-model.number="zoomLevel" min="50" max="200" step="10" @change="updateZoom" />
        <span>{{ zoomLevel }}%</span>
      </div>
      <div class="settings-group">
        <label>
          <input type="checkbox" v-model="autoSaveProgress" @change="toggleAutoSave" />
          Автосохранение
        </label>
      </div>
    </div>
    
    <!-- Прогресс чтения -->
    <div v-if="readingMode === 'page' && pages.length > 0" class="progress-bar">
      <div class="progress-fill" :style="{ width: `${readingProgress}%` }"></div>
      <span>{{ Math.round(readingProgress) }}%</span>
    </div>
    
    <!-- ========== ПОСТРАНИЧНЫЙ РЕЖИМ ========== -->
    <div v-if="readingMode === 'page' && pages.length > 0" class="page-mode">
      <!-- Основная картинка с стрелками -->
      <div class="image-container">
        <div class="nav-arrow left-arrow" @click="prevPage" :class="{ invisible: currentPage === 1 }">
          <span>◀</span>
        </div>
        
        <div class="image-wrapper" :style="{ transform: `scale(${zoomLevel / 100})` }">
          <img 
            :src="currentImageUrl"
            :alt="'Страница ' + currentPage"
            @error="handleImageError"
            @load="onPageLoad"
          />
          <div v-if="!currentPageLoaded" class="image-loader">
            <div class="spinner"></div>
          </div>
        </div>
        
        <div class="nav-arrow right-arrow" @click="nextPage" :class="{ invisible: currentPage === pages.length && !nextChapter }">
          <span>▶</span>
        </div>
      </div>
      
      <!-- Информация о странице -->
      <div class="page-info">
        <span>Страница {{ currentPage }} из {{ pages.length }}</span>
      </div>
      
      <!-- Нижние кнопки навигации -->
      <div class="bottom-buttons">
        <button @click="prevPage" :disabled="currentPage === 1" class="nav-bottom-btn prev-btn">
          ◀ Предыдущая страница
        </button>
        
        <button 
          v-if="currentPage === pages.length && nextChapter" 
          @click="goToNextChapter" 
          class="nav-bottom-btn next-chapter-btn"
        >
          Следующая глава ▶
        </button>
        
        <button 
          v-else 
          @click="nextPage" 
          :disabled="currentPage === pages.length" 
          class="nav-bottom-btn next-btn"
        >
          Следующая страница ▶
        </button>
      </div>
    </div>
    
    <!-- ========== ВЕБ-ТУН РЕЖИМ ========== -->
    <div v-else-if="readingMode === 'webtoon' && pages.length > 0" class="webtoon-mode">
      <div class="webtoon-pages">
        <div 
          v-for="(page, index) in pages" 
          :key="page.page_number" 
          class="webtoon-page"
        >
          <img 
            :src="getFullImageUrl(page.image_url)"
            :alt="'Страница ' + page.page_number"
            @error="handleImageError"
            @load="() => onWebtoonPageLoad(index)"
            loading="lazy"
          />
        </div>
      </div>
      
      <!-- Кнопки для веб-тун режима -->
      <div class="webtoon-buttons">
        <button @click="scrollToTop" class="webtoon-nav-btn">
          ⬆ Вверх
        </button>
        <button @click="saveCurrentPosition" class="webtoon-nav-btn">
          📍 Сохранить позицию
        </button>
        <button v-if="nextChapter" @click="goToNextChapter" class="webtoon-nav-btn next-chapter-btn">
          📖 Следующая глава ▶
        </button>
      </div>
    </div>
    
    <!-- Состояние загрузки -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка главы...</p>
    </div>
    
    <!-- Уведомление -->
    <div v-if="showNotification" class="notification" :class="notificationType">
      {{ notificationMessage }}
    </div>
  </div>
  
  <!-- Ошибка -->
  <div v-else class="error-state">
    <div class="error-content">
      <h2>❌ Ошибка загрузки</h2>
      <p>{{ error }}</p>
      <button @click="goBack" class="back-btn">← Вернуться назад</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { chaptersAPI, progressAPI, mangaAPI } from '@/api';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Основные данные
const loading = ref(true);
const error = ref(null);
const chapter = ref(null);
const pages = ref([]);
const currentPage = ref(1);
const currentPageLoaded = ref(false);
const nextChapter = ref(null);
const webtoonLoaded = ref([]);

// Вычисляемые свойства
const chapterTitle = computed(() => {
  if (!chapter.value) return 'Загрузка...';
  return chapter.value.title || `Глава ${chapter.value.chapter_number}`;
});

const currentImageUrl = computed(() => {
  if (!pages.value.length || !currentPage.value) return '';
  const page = pages.value[currentPage.value - 1];
  if (!page) return '';
  return getFullImageUrl(page.image_url);
});

// Настройки
const readingMode = ref(localStorage.getItem('readingMode') || 'page');
const zoomLevel = ref(parseInt(localStorage.getItem('zoomLevel')) || 100);
const autoSaveProgress = ref(localStorage.getItem('autoSaveProgress') !== 'false');
const showSettings = ref(false);
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('success');
const isBookmarked = ref(false);
const readingProgress = ref(0);

// Функции
const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/api')) {
    return `http://localhost:3000${url}`;
  }
  return `http://localhost:3000${url}`;
};

const goBack = () => {
  router.back();
};

const handleImageError = (event) => {
  console.error('Ошибка загрузки изображения:', event.target.src);
  event.target.style.display = 'none';
  const parent = event.target.parentElement;
  const errorDiv = document.createElement('div');
  errorDiv.className = 'image-error';
  errorDiv.innerHTML = '❌ Изображение не загружено';
  if (parent && !parent.querySelector('.image-error')) {
    parent.appendChild(errorDiv);
  }
};

const onPageLoad = () => {
  currentPageLoaded.value = true;
  updateReadingProgress();
  autoSave();
};

const onWebtoonPageLoad = (index) => {
  webtoonLoaded.value[index] = true;
};

// Загрузка следующей главы
const loadNextChapter = async () => {
  if (!chapter.value) return;
  
  try {
    const currentMangaId = chapter.value.manga_id;
    const currentChapterNum = chapter.value.chapter_number;
    
    const chapters = await mangaAPI.getChapters(currentMangaId);
    const nextChap = chapters.find(ch => ch.chapter_number === currentChapterNum + 1);
    
    nextChapter.value = nextChap || null;
  } catch (err) {
    console.error('Ошибка загрузки следующей главы:', err);
    nextChapter.value = null;
  }
};

// Переход на следующую главу
const goToNextChapter = () => {
  if (nextChapter.value) {
    router.push(`/chapter/${nextChapter.value.id}`);
    showNotificationMessage('Загрузка следующей главы...', 'info');
  }
};

// Переключение режима
const toggleReadingMode = () => {
  readingMode.value = readingMode.value === 'page' ? 'webtoon' : 'page';
  localStorage.setItem('readingMode', readingMode.value);
  showNotificationMessage(`Режим: ${readingMode.value === 'webtoon' ? 'Веб-тун' : 'Постранично'}`, 'success');
};

// Закладки
const toggleBookmark = async () => {
  if (!authStore.isLoggedIn) {
    showNotificationMessage('Войдите в аккаунт для закладок', 'error');
    return;
  }
  
  const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
  const bookmarkIndex = bookmarks.findIndex(b => b.chapterId === chapter.value.id);
  
  if (bookmarkIndex === -1) {
    bookmarks.push({
      chapterId: chapter.value.id,
      mangaId: chapter.value.manga_id,
      chapterNumber: chapter.value.chapter_number,
      page: currentPage.value,
      timestamp: new Date().toISOString()
    });
    isBookmarked.value = true;
    showNotificationMessage('Добавлено в закладки', 'success');
  } else {
    bookmarks.splice(bookmarkIndex, 1);
    isBookmarked.value = false;
    showNotificationMessage('Удалено из закладок', 'success');
  }
  
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
};

// Сохранение прогресса
const saveProgress = async () => {
  if (!authStore.isLoggedIn) {
    showNotificationMessage('Войдите в аккаунт для сохранения прогресса', 'error');
    return;
  }
  
  if (!chapter.value) return;
  
  try {
    await progressAPI.save({
      userId: authStore.user.id,
      manga_id: chapter.value.manga_id,
      chapter_id: chapter.value.id,
      page_number: currentPage.value
    });
    showNotificationMessage('Прогресс сохранен', 'success');
  } catch (err) {
    console.error('Ошибка:', err);
    showNotificationMessage('Ошибка сохранения', 'error');
  }
};

const autoSave = () => {
  if (autoSaveProgress.value && authStore.isLoggedIn && readingMode.value === 'page') {
    saveProgress();
  }
};

const saveCurrentPosition = () => {
  if (readingMode.value === 'webtoon' && chapter.value) {
    const scrollPosition = window.scrollY;
    localStorage.setItem(`scroll_${chapter.value.id}`, scrollPosition);
    showNotificationMessage('Позиция сохранена', 'success');
  }
};

const restoreScrollPosition = () => {
  if (readingMode.value === 'webtoon' && chapter.value) {
    const savedScroll = localStorage.getItem(`scroll_${chapter.value.id}`);
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' });
      }, 100);
    }
  }
};

// Полноэкранный режим
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    showNotificationMessage('Полноэкранный режим', 'success');
  } else {
    document.exitFullscreen();
    showNotificationMessage('Выход из полноэкранного режима', 'success');
  }
};

const updateZoom = () => {
  localStorage.setItem('zoomLevel', zoomLevel.value);
};

const toggleAutoSave = () => {
  localStorage.setItem('autoSaveProgress', autoSaveProgress.value);
};

// Навигация
const nextPage = () => {
  if (currentPage.value < pages.value.length) {
    currentPage.value++;
    currentPageLoaded.value = false;
    scrollToTop();
    updateReadingProgress();
    autoSave();
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    currentPageLoaded.value = false;
    scrollToTop();
    updateReadingProgress();
    autoSave();
  }
};

const scrollToTop = () => {
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

const updateReadingProgress = () => {
  if (pages.value.length) {
    readingProgress.value = (currentPage.value / pages.value.length) * 100;
  }
};

const showNotificationMessage = (message, type = 'success') => {
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;
  setTimeout(() => {
    showNotification.value = false;
  }, 2000);
};

// Клавиатурная навигация
const handleKeydown = (event) => {
  if (readingMode.value === 'page') {
    if (event.key === 'ArrowLeft') {
      prevPage();
    } else if (event.key === 'ArrowRight') {
      nextPage();
    }
  } else {
    if (event.key === 'ArrowUp') {
      window.scrollBy(0, -window.innerHeight / 2);
    } else if (event.key === 'ArrowDown') {
      window.scrollBy(0, window.innerHeight / 2);
    }
  }
  
  if (event.key === 'f' || event.key === 'F') {
    toggleFullscreen();
  } else if (event.key === 's' || event.key === 'S') {
    saveProgress();
  } else if (event.key === 'm' || event.key === 'M') {
    toggleReadingMode();
  }
};

// Загрузка прогресса
const loadProgress = async () => {
  if (!authStore.isLoggedIn || !chapter.value) return;
  
  try {
    const progress = await progressAPI.get(chapter.value.manga_id, authStore.user.id);
    if (progress && progress.chapter_id === chapter.value.id) {
      currentPage.value = progress.page_number || 1;
      updateReadingProgress();
    }
  } catch (err) {
    console.error('Ошибка загрузки прогресса:', err);
  }
};

const loadBookmarkStatus = () => {
  if (!chapter.value) return;
  const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
  isBookmarked.value = bookmarks.some(b => b.chapterId === chapter.value.id);
};

// Основная загрузка
const loadChapter = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const id = route.params.id;
    console.log('📖 Загружаем главу ID:', id);
    
    if (!id) {
      throw new Error('ID главы не указан');
    }
    
    const chap = await chaptersAPI.get(id);
    
    if (!chap) {
      throw new Error('Глава не найдена');
    }
    
    chapter.value = chap;
    console.log('✅ Глава получена:', chap);
    
    const pagesData = await chaptersAPI.getPages(id);
    pages.value = pagesData.pages || [];
    webtoonLoaded.value = new Array(pages.value.length).fill(false);
    
    console.log('📄 Страниц получено:', pages.value.length);
    
    if (pages.value.length === 0) {
      error.value = 'Нет страниц для отображения';
    } else {
      await loadNextChapter();
      await loadProgress();
      loadBookmarkStatus();
      updateReadingProgress();
      
      if (readingMode.value === 'webtoon') {
        restoreScrollPosition();
      }
    }
  } catch (err) {
    console.error('❌ Ошибка:', err);
    error.value = err.message || 'Не удалось загрузить главу';
  } finally {
    loading.value = false;
  }
};

// Следим за изменением ID главы
watch(() => route.params.id, () => {
  loadChapter();
});

// Отслеживаем скролл для сохранения позиции в веб-тун режиме
let scrollTimeout;
const handleScroll = () => {
  if (readingMode.value === 'webtoon' && chapter.value) {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      saveCurrentPosition();
    }, 500);
  }
};

onMounted(() => {
  loadChapter();
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('scroll', handleScroll);
  if (readingMode.value === 'webtoon' && chapter.value) {
    saveCurrentPosition();
  }
  clearTimeout(scrollTimeout);
});
</script>

<style scoped>
.reader {
  background: #000000;
  color: #ffffff;
  min-height: 100vh;
}

/* Верхняя панель */
.reader-header {
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.95);
  border-bottom: 2px solid #07660C;
  z-index: 100;
  flex-wrap: wrap;
  gap: 15px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-left h2 {
  color: #07660C;
  margin: 0;
  font-size: 1.3rem;
}

.header-right {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.back-btn {
  background: #80832A;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.settings-btn {
  background: #2B2B2B;
  border: 1px solid #80832A;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.settings-btn:hover {
  background: #80832A;
}

.settings-btn.active {
  background: #07660C;
  border-color: #07660C;
}

/* Панель настроек */
.settings-panel {
  position: sticky;
  top: 70px;
  background: #202020;
  padding: 15px 20px;
  border-bottom: 1px solid #80832A;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  z-index: 99;
}

.settings-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-group label {
  color: #80832A;
}

.settings-group input[type="range"] {
  width: 150px;
}

/* Прогресс бар */
.progress-bar {
  position: sticky;
  top: 120px;
  height: 4px;
  background: #2B2B2B;
  margin: 10px 0;
  border-radius: 2px;
  overflow: hidden;
  z-index: 99;
}

.progress-fill {
  height: 100%;
  background: #07660C;
  transition: width 0.3s;
}

/* ========== ПОСТРАНИЧНЫЙ РЕЖИМ ========== */
.page-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 150px);
  padding: 20px;
}

.image-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1000px;
}

.image-wrapper {
  flex: 1;
  text-align: center;
  transition: transform 0.3s;
  position: relative;
  min-height: 400px;
}

.image-wrapper img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  cursor: pointer;
}

/* Стрелки на картинке */
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 100px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
  opacity: 0.7;
}

.nav-arrow:hover {
  background: rgba(7, 102, 12, 0.8);
  opacity: 1;
  width: 70px;
}

.nav-arrow span {
  font-size: 2rem;
  color: white;
}

.left-arrow {
  left: -80px;
}

.right-arrow {
  right: -80px;
}

.nav-arrow.invisible {
  opacity: 0;
  cursor: default;
  pointer-events: none;
}

/* Информация о странице */
.page-info {
  text-align: center;
  margin: 20px 0;
  color: #80832A;
  font-size: 0.9rem;
}

/* Нижние кнопки */
.bottom-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 30px;
}

.nav-bottom-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.prev-btn {
  background: #2B2B2B;
  color: white;
  border: 1px solid #80832A;
}

.prev-btn:hover:not(:disabled) {
  background: #80832A;
  transform: scale(1.02);
}

.next-btn {
  background: #07660C;
  color: white;
}

.next-btn:hover:not(:disabled) {
  background: #0a7e0f;
  transform: scale(1.02);
}

.next-chapter-btn {
  background: #ffaa00;
  color: #000;
}

.next-chapter-btn:hover {
  background: #ffcc44;
  transform: scale(1.02);
}

.nav-bottom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== ВЕБ-ТУН РЕЖИМ ========== */
.webtoon-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.webtoon-pages {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

.webtoon-page {
  width: 100%;
}

.webtoon-page img {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.webtoon-buttons {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 100;
}

.webtoon-nav-btn {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  border: 1px solid #07660C;
  color: white;
  padding: 10px 16px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.webtoon-nav-btn:hover {
  background: #07660C;
  transform: scale(1.05);
}

/* Лоадер */
.image-loader {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #202020;
  border-radius: 8px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #2B2B2B;
  border-top: 4px solid #07660C;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
}

.loading-state p {
  color: #80832A;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.image-error {
  padding: 20px;
  text-align: center;
  background: #2B2B2B;
  border-radius: 8px;
  color: #ff4444;
}

/* Ошибка */
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 20px;
}

.error-content {
  text-align: center;
  background: #202020;
  padding: 40px;
  border-radius: 12px;
  max-width: 500px;
}

.error-content h2 {
  color: #ff4444;
  margin-bottom: 20px;
}

.error-content p {
  color: #80832A;
  margin-bottom: 30px;
}

/* Уведомления */
.notification {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 30px;
  z-index: 200;
  animation: fadeInOut 2s ease;
  white-space: nowrap;
}

.notification.success {
  background: #07660C;
  color: white;
}

.notification.error {
  background: #ff4444;
  color: white;
}

.notification.info {
  background: #80832A;
  color: white;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
  15% { opacity: 1; transform: translateX(-50%) translateY(0); }
  85% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
}

/* Адаптивность */
@media (max-width: 1200px) {
  .nav-arrow {
    width: 50px;
    height: 80px;
  }
  
  .left-arrow {
    left: -60px;
  }
  
  .right-arrow {
    right: -60px;
  }
}

@media (max-width: 768px) {
  .reader-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-left {
    justify-content: space-between;
  }
  
  .header-right {
    justify-content: center;
  }
  
  .settings-panel {
    top: 120px;
  }
  
  .nav-arrow {
    width: 40px;
    height: 60px;
  }
  
  .nav-arrow span {
    font-size: 1.2rem;
  }
  
  .left-arrow {
    left: -50px;
  }
  
  .right-arrow {
    right: -50px;
  }
  
  .bottom-buttons {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  
  .nav-bottom-btn {
    width: 80%;
    text-align: center;
  }
  
  .webtoon-buttons {
    flex-direction: column;
    bottom: 10px;
    right: 10px;
  }
  
  .webtoon-nav-btn {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
  
  .notification {
    white-space: normal;
    text-align: center;
    max-width: 90%;
  }
}

@media (max-width: 480px) {
  .nav-arrow {
    width: 35px;
    height: 50px;
  }
  
  .left-arrow {
    left: -40px;
  }
  
  .right-arrow {
    right: -40px;
  }
}
</style>