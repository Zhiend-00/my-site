<template>
  <div class="reader" v-if="!error">
    <!-- Верхняя панель -->
    <div class="reader-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn">
          <span>←</span> Назад
        </button>
        <div class="chapter-info">
          <h2>{{ chapterTitle }}</h2>
          <span class="manga-name">{{ mangaTitle }}</span>
        </div>
      </div>
      <div class="header-right">
        <button @click="toggleReadingMode" class="action-btn" :title="readingMode === 'webtoon' ? 'Постраничный режим' : 'Веб-тун режим'">
          {{ readingMode === 'webtoon' ? '📜 Веб-тун' : '📖 Постранично' }}
        </button>
        <button @click="toggleBookmark" class="action-btn" :class="{ active: isBookmarked }" title="Закладка">
          🔖
        </button>
        <button @click="saveProgress" class="action-btn" title="Сохранить прогресс">
          💾
        </button>
        <button @click="toggleFullscreen" class="action-btn" title="Полноэкранный режим">
          🖥️
        </button>
        <button @click="showSettings = !showSettings" class="action-btn" :class="{ active: showSettings }" title="Настройки">
          ⚙️
        </button>
      </div>
    </div>

    <!-- Панель настроек -->
    <div v-if="showSettings" class="settings-panel">
      <div class="setting-item">
        <label>Масштаб:</label>
        <input type="range" v-model.number="zoomLevel" min="50" max="200" step="10" @change="updateZoom" />
        <span>{{ zoomLevel }}%</span>
      </div>
      <div class="setting-item">
        <label>Яркость:</label>
        <input type="range" v-model.number="brightness" min="0.5" max="2" step="0.1" />
        <span>{{ Math.round(brightness * 100) }}%</span>
      </div>
      <div class="setting-item">
        <label class="checkbox">
          <input type="checkbox" v-model="autoSaveProgress" @change="toggleAutoSave" />
          Автосохранение
        </label>
      </div>
      <div class="setting-item">
        <label class="checkbox">
          <input type="checkbox" v-model="fitToWidth" @change="updateFitToWidth" />
          По ширине экрана
        </label>
      </div>
    </div>

    <!-- Прогресс чтения -->
    <div v-if="readingMode === 'page' && pages.length > 0" class="progress-bar">
      <div class="progress-fill" :style="{ width: `${readingProgress}%` }"></div>
    </div>

    <!-- Постраничный режим -->
<div v-if="readingMode === 'page' && pages.length > 0" class="page-mode">
  <div class="image-container">
    <div class="nav-arrow left" @click="prevPage" :class="{ hidden: currentPage === 1 }">◀</div>
    <div class="click-zone left" @click="prevPage"></div>
    <div class="image-wrapper">
      <img 
        :src="currentImageUrl" 
        :alt="'Страница ' + currentPage" 
        @error="handleImageError" 
        @load="onPageLoad" 
        :class="{ 'fit-width': fitToWidth }"
        :style="{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'center center',
          filter: `brightness(${brightness})`,
          transition: 'transform 0.2s ease'
        }"
      />
      <div v-if="!currentPageLoaded" class="image-loader"><div class="spinner"></div></div>
    </div>
    <div class="click-zone right" @click="nextPage"></div>
    <div class="nav-arrow right" @click="nextPage" :class="{ hidden: currentPage === pages.length && !nextChapter }">▶</div>
  </div>
  <div class="page-controls">
    <span>Страница {{ currentPage }} из {{ pages.length }}</span>
    <div class="control-buttons">
      <button @click="prevPage" :disabled="currentPage === 1" class="control-btn prev">◀ Предыдущая</button>
      <button v-if="currentPage === pages.length && nextChapter" @click="goToNextChapter" class="control-btn next-chapter">Следующая глава ▶</button>
      <button v-else @click="nextPage" :disabled="currentPage === pages.length" class="control-btn next">Следующая ▶</button>
    </div>
  </div>
</div>

    <!-- Веб-тун режим -->
    <div v-else-if="readingMode === 'webtoon' && pages.length > 0" class="webtoon-mode">
      <div class="webtoon-pages" ref="webtoonContainer">
        <div v-for="(page, index) in pages" :key="page.page_number || index" class="webtoon-page">
          <img :src="getFullImageUrl(page.image_url || page)" :alt="'Страница ' + (page.page_number || index + 1)" @error="handleImageError" @load="() => onWebtoonPageLoad(index)" loading="lazy" :style="{ filter: `brightness(${brightness})` }" :class="{ 'fit-width': fitToWidth }" />
          <div class="page-number">{{ page.page_number || index + 1 }}</div>
        </div>
      </div>
      
      <div class="webtoon-floating-buttons">
        <button @click="scrollToTop" class="float-btn" title="Вверх">⬆</button>
        <button @click="saveCurrentPosition" class="float-btn" title="Сохранить позицию">📍</button>
        <button v-if="nextChapter" @click="goToNextChapter" class="float-btn next" title="Следующая глава">▶</button>
      </div>
      
      <div class="webtoon-bottom-bar">
        <div class="bottom-info">
          <span>📄 Страница {{ getCurrentWebtoonPage }} из {{ pages.length }}</span>
          <div class="bottom-nav" v-if="nextChapter || prevChapter">
            <button v-if="prevChapter" @click="goToPrevChapter" class="bottom-nav-btn">◀ Предыдущая глава</button>
            <button v-if="nextChapter" @click="goToNextChapter" class="bottom-nav-btn next">Следующая глава ▶</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка главы...</p>
    </div>

    <div v-if="showNotification" class="notification" :class="notificationType">{{ notificationMessage }}</div>
  </div>

  <div v-else class="error-state">
    <div class="error-content">
      <h2>❌ Ошибка загрузки</h2>
      <p>{{ error }}</p>
      <button @click="goBack" class="back-btn">← Вернуться назад</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { chaptersAPI, progressAPI, mangaAPI } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { getCoverUrl } from '@/utils/imageHelper';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const error = ref(null);
const chapter = ref(null);
const manga = ref(null);
const pages = ref([]);
const currentPage = ref(1);
const currentPageLoaded = ref(false);
const nextChapter = ref(null);
const prevChapter = ref(null);
const webtoonLoaded = ref([]);
const webtoonContainer = ref(null);
const webtoonScrollProgress = ref(0);

const readingMode = ref(localStorage.getItem('readingMode') || 'page');
const zoomLevel = ref(parseInt(localStorage.getItem('zoomLevel')) || 100);
const autoSaveProgress = ref(localStorage.getItem('autoSaveProgress') !== 'false');
const brightness = ref(1);
const fitToWidth = ref(localStorage.getItem('fitToWidth') !== 'false');
const showSettings = ref(false);

const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('success');

const isBookmarked = ref(false);

const chapterTitle = computed(() => {
  if (!chapter.value) return 'Загрузка...';
  return chapter.value.title || `Глава ${chapter.value.chapterNumber || chapter.value.chapter_number}`;
});

const mangaTitle = computed(() => manga.value?.title || '');

const currentImageUrl = computed(() => {
  if (!pages.value.length || !currentPage.value) return '';
  const page = pages.value[currentPage.value - 1];
  if (!page) return '';
  const imageUrl = typeof page === 'string' ? page : (page.image_url || page.url);
  return imageUrl ? getFullImageUrl(imageUrl) : '';
});

const readingProgress = computed(() => {
  if (!pages.value.length) return 0;
  return (currentPage.value / pages.value.length) * 100;
});

const getCurrentWebtoonPage = computed(() => {
  const scrollTop = window.scrollY;
  const pageHeight = window.innerHeight || 800;
  const pageIndex = Math.floor(scrollTop / pageHeight);
  return Math.min(Math.max(1, pageIndex + 1), pages.value.length);
});

const getFullImageUrl = (url) => {
<<<<<<< HEAD
  if (!url) return '';
=======
>>>>>>> 6c86952448153670efab205150ff8e685eed79ce
  return getCoverUrl(url);
};

const goBack = () => router.back();

const handleImageError = (e) => {
  console.error('Ошибка загрузки изображения:', e.target.src);
  e.target.style.display = 'none';
  e.target.insertAdjacentHTML('afterend', '<div class="image-error">❌ Не удалось загрузить изображение</div>');
};

const onPageLoad = () => { 
  currentPageLoaded.value = true; 
  autoSave(); 
};

const onWebtoonPageLoad = (i) => {
  webtoonLoaded.value[i] = true;
  updateWebtoonProgress();
};

const updateWebtoonProgress = () => {
  const scrollTop = window.scrollY;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollHeight > 0) webtoonScrollProgress.value = (scrollTop / scrollHeight) * 100;
};

const handleWebtoonScroll = () => {
  updateWebtoonProgress();
  if (autoSaveProgress.value && authStore.isLoggedIn) saveCurrentPosition();
};

const loadNextChapter = async () => {
  if (!chapter.value || !manga.value) return;
  try {
    const currentNum = chapter.value.chapterNumber || chapter.value.chapter_number;
    const chaptersList = manga.value.chapters || [];
    nextChapter.value = chaptersList.find(ch => (ch.chapterNumber || ch.chapter_number) === currentNum + 1) || null;
  } catch (err) { 
    console.error('Ошибка загрузки следующей главы:', err);
    nextChapter.value = null; 
  }
};

const loadPrevChapter = async () => {
  if (!chapter.value || !manga.value) return;
  try {
    const currentNum = chapter.value.chapterNumber || chapter.value.chapter_number;
    const chaptersList = manga.value.chapters || [];
    prevChapter.value = chaptersList.find(ch => (ch.chapterNumber || ch.chapter_number) === currentNum - 1) || null;
  } catch (err) { 
    console.error('Ошибка загрузки предыдущей главы:', err);
    prevChapter.value = null; 
  }
};

const goToNextChapter = () => { 
  if (nextChapter.value) router.push(`/chapter/${nextChapter.value.id}`); 
};

const goToPrevChapter = () => { 
  if (prevChapter.value) router.push(`/chapter/${prevChapter.value.id}`); 
};

const toggleReadingMode = () => {
  readingMode.value = readingMode.value === 'page' ? 'webtoon' : 'page';
  localStorage.setItem('readingMode', readingMode.value);
  if (readingMode.value === 'webtoon') nextTick(() => restoreScrollPosition());
};

const toggleBookmark = () => {
  if (!chapter.value) return;
  const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
  const index = bookmarks.findIndex(b => b.chapterId === chapter.value.id);
  if (index === -1) {
    bookmarks.push({
      chapterId: chapter.value.id,
      mangaId: chapter.value.mangaId || chapter.value.manga_id,
      mangaTitle: manga.value?.title,
      chapterNumber: chapter.value.chapterNumber || chapter.value.chapter_number,
      page: currentPage.value,
      timestamp: new Date().toISOString()
    });
    isBookmarked.value = true;
    showNotificationMessage('Добавлено в закладки', 'success');
  } else {
    bookmarks.splice(index, 1);
    isBookmarked.value = false;
    showNotificationMessage('Удалено из закладок', 'info');
  }
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
};

const showNotificationMessage = (message, type = 'success') => {
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;
  setTimeout(() => { showNotification.value = false; }, 2000);
};

const loadBookmarkStatus = () => {
  if (!chapter.value) return;
  const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
  isBookmarked.value = bookmarks.some(b => b.chapterId === chapter.value.id);
};

const saveProgress = async () => {
  if (!authStore.isLoggedIn || !chapter.value) return;
  try {
    await progressAPI.save({
      manga_id: chapter.value.mangaId || chapter.value.manga_id,
      chapter_id: chapter.value.id,
      page_number: currentPage.value
    });
    showNotificationMessage('Прогресс сохранён', 'success');
  } catch (err) { 
    console.error('Ошибка сохранения прогресса:', err); 
  }
};

const autoSave = () => {
  if (autoSaveProgress.value && authStore.isLoggedIn && readingMode.value === 'page') saveProgress();
};

const saveCurrentPosition = () => {
  if (readingMode.value === 'webtoon' && chapter.value) {
    const scrollY = window.scrollY;
    localStorage.setItem(`scroll_${chapter.value.id}`, scrollY);
    if (autoSaveProgress.value && authStore.isLoggedIn) {
      const pageIndex = Math.floor(scrollY / (window.innerHeight || 800));
      const pageNumber = Math.min(Math.max(1, pageIndex + 1), pages.value.length);
      progressAPI.save({
        manga_id: chapter.value.mangaId || chapter.value.manga_id,
        chapter_id: chapter.value.id,
        page_number: pageNumber
      }).catch(console.error);
    }
  }
};

const restoreScrollPosition = () => {
  if (readingMode.value === 'webtoon' && chapter.value) {
    const saved = localStorage.getItem(`scroll_${chapter.value.id}`);
    if (saved) setTimeout(() => window.scrollTo({ top: parseInt(saved), behavior: 'instant' }), 100);
  }
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    showNotificationMessage('Полноэкранный режим', 'info');
  } else {
    document.exitFullscreen();
    showNotificationMessage('Выход из полноэкранного режима', 'info');
  }
};

const updateZoom = () => localStorage.setItem('zoomLevel', zoomLevel.value);
const updateFitToWidth = () => localStorage.setItem('fitToWidth', fitToWidth.value);
const toggleAutoSave = () => localStorage.setItem('autoSaveProgress', autoSaveProgress.value);

const nextPage = () => {
  if (currentPage.value < pages.value.length) {
    currentPage.value++;
    currentPageLoaded.value = false;
    scrollToTop();
    autoSave();
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    currentPageLoaded.value = false;
    scrollToTop();
    autoSave();
  }
};

const scrollToTop = () => nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }));

const handleKeydown = (event) => {
  if (readingMode.value === 'page') {
    if (event.key === 'ArrowLeft') prevPage();
    else if (event.key === 'ArrowRight') nextPage();
  }
  if (event.key === 'f' || event.key === 'F') toggleFullscreen();
  else if (event.key === 'm' || event.key === 'M') toggleReadingMode();
  else if (event.key === 'b' || event.key === 'B') toggleBookmark();
  else if (event.key === 's' || event.key === 'S') saveProgress();
  else if (event.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
};

const loadProgress = async () => {
  if (!authStore.isLoggedIn || !chapter.value) return;
  try {
    const mangaId = chapter.value.mangaId || chapter.value.manga_id;
    const progress = await progressAPI.get(mangaId);
    if (progress && progress.chapter_id === chapter.value.id) {
      currentPage.value = progress.page_number || 1;
      if (readingMode.value === 'webtoon') {
        const pageHeight = window.innerHeight || 800;
        setTimeout(() => window.scrollTo({ top: (currentPage.value - 1) * pageHeight, behavior: 'instant' }), 100);
      }
    }
  } catch (err) { 
    console.error('Ошибка загрузки прогресса:', err); 
  }
};

const loadChapter = async () => {
  loading.value = true;
  error.value = null;
  pages.value = [];
  
  try {
    const id = route.params.id;
    if (!id) throw new Error('ID главы не указан');
    
    // Получаем главу
    const chap = await chaptersAPI.get(id);
    if (!chap) throw new Error('Глава не найдена');
    chapter.value = chap;
    
    // Получаем мангу
    const mangaId = chap.mangaId || chap.manga_id;
    manga.value = await mangaAPI.get(mangaId);
    
    // ПРОСТАЯ ЗАГРУЗКА СТРАНИЦ - только через стандартный API
    let pagesData = null;
    try {
      pagesData = await chaptersAPI.getPages(id);
      console.log('Страницы из API:', pagesData);
    } catch (apiErr) {
      console.error('Ошибка получения страниц:', apiErr);
      pagesData = null;
    }
    
    // Извлекаем массив страниц
    if (pagesData && pagesData.pages && Array.isArray(pagesData.pages)) {
      pages.value = pagesData.pages;
    } else if (pagesData && Array.isArray(pagesData)) {
      pages.value = pagesData;
    } else if (pagesData && typeof pagesData === 'object') {
      // Пробуем найти массив страниц в объекте
      const possibleArrays = Object.values(pagesData).filter(v => Array.isArray(v) && v.length > 0);
      if (possibleArrays.length > 0) {
        pages.value = possibleArrays[0];
      } else {
        pages.value = [];
      }
    } else {
      pages.value = [];
    }
    
    console.log('Итоговый массив страниц:', pages.value.length);
    
    // Если страниц нет - показываем ошибку
    if (pages.value.length === 0) {
      error.value = 'В этой главе нет страниц. Возможно, изображения еще не загружены на сервер.';
      loading.value = false;
      return;
    }
    
    webtoonLoaded.value = new Array(pages.value.length).fill(false);
    
    await loadNextChapter();
    await loadPrevChapter();
    await loadProgress();
    loadBookmarkStatus();
    
    if (readingMode.value === 'webtoon') {
      nextTick(() => restoreScrollPosition());
    }
    
  } catch (err) {
    console.error('Ошибка загрузки главы:', err);
    error.value = err.message || 'Не удалось загрузить главу';
  } finally {
    loading.value = false;
  }
};

// Следим за изменением ID главы
watch(() => route.params.id, () => {
  loadChapter();
}, { immediate: false });

onMounted(() => {
  loadChapter();
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('scroll', handleWebtoonScroll);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('scroll', handleWebtoonScroll);
  if (readingMode.value === 'webtoon' && chapter.value) saveCurrentPosition();
});
</script>

<style scoped>
.reader {
  background: var(--color-background, #0a0a0a);
  color: var(--color-text, #ffffff);
  min-height: 100vh;
}

.reader-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: var(--color-panel, #1a1a1a);
  border-bottom: 2px solid var(--color-primary, #07660c);
  flex-wrap: wrap;
  gap: 15px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  background: rgba(128, 131, 42, 0.2);
  border: 1px solid var(--color-secondary, #9ea344);
  color: var(--color-secondary);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn:hover {
  background: var(--color-secondary);
  color: white;
}

.chapter-info h2 {
  color: var(--color-primary);
  margin: 0;
  font-size: 1.2rem;
}

.manga-name {
  font-size: 0.85rem;
  color: var(--color-text-muted, #aaa);
  display: block;
}

.header-right {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(128, 131, 42, 0.3);
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.action-btn:hover {
  background: rgba(128, 131, 42, 0.3);
  border-color: var(--color-secondary);
}

.action-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.settings-panel {
  position: sticky;
  top: 70px;
  background: var(--color-panel, #1a1a1a);
  padding: 15px 24px;
  border-bottom: 1px solid rgba(128, 131, 42, 0.3);
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  z-index: 99;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
}

.setting-item label {
  color: var(--color-secondary);
}

.setting-item input[type="range"] {
  width: 150px;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
}

.setting-item input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.progress-bar {
  position: sticky;
  top: 70px;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  z-index: 99;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s;
}

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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.image-wrapper img.fit-width {
  width: 100%;
  height: auto;
}

.click-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30%;
  z-index: 5;
  cursor: pointer;
  background: transparent;
}

.click-zone.left { left: 0; }
.click-zone.right { right: 0; }

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 45px;
  height: 70px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
  opacity: 0.6;
  color: white;
  font-size: 1.8rem;
}

.nav-arrow:hover {
  background: var(--color-primary);
  opacity: 1;
}

.nav-arrow.left { left: -60px; }
.nav-arrow.right { right: -60px; }
.nav-arrow.hidden { opacity: 0; pointer-events: none; }

.page-controls {
  text-align: center;
  margin: 20px 0;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
}

.control-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 30px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn.prev {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid var(--color-secondary);
}

.control-btn.next {
  background: var(--color-primary);
  color: white;
}

.control-btn.next-chapter {
  background: var(--color-secondary);
  color: white;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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
  position: relative;
  width: 100%;
  margin-bottom: 10px;
}

.webtoon-page img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.webtoon-page img.fit-width {
  width: 100%;
}

.page-number {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  color: var(--color-secondary);
}

.webtoon-floating-buttons {
  position: fixed;
  bottom: 80px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
}

.float-btn {
  background: var(--color-primary);
  border: none;
  color: white;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  font-size: 1.2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.float-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
}

.float-btn.next {
  background: var(--color-secondary);
}

.float-btn.next:hover {
  background: #b0b550;
}

.webtoon-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--color-primary);
  padding: 10px 20px;
  z-index: 99;
}

.bottom-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  max-width: 1000px;
  margin: 0 auto;
}

.bottom-nav {
  display: flex;
  gap: 15px;
}

.bottom-nav-btn {
  background: rgba(128, 131, 42, 0.2);
  border: 1px solid var(--color-secondary);
  color: var(--color-secondary);
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.bottom-nav-btn:hover {
  background: var(--color-secondary);
  color: white;
}

.bottom-nav-btn.next {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.bottom-nav-btn.next:hover {
  background: var(--color-primary-hover);
}

.image-loader {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-panel);
  border-radius: 8px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(128, 131, 42, 0.2);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 20px;
}

.notification {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 30px;
  z-index: 200;
  animation: fadeInOut 2s ease;
}

.notification.success {
  background: var(--color-primary);
  color: white;
}

.notification.error {
  background: #ff4444;
  color: white;
}

.notification.info {
  background: var(--color-secondary);
  color: white;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
  15% { opacity: 1; transform: translateX(-50%) translateY(0); }
  85% { opacity: 1; }
  100% { opacity: 0; }
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.error-content {
  text-align: center;
  background: var(--color-panel);
  padding: 40px;
  border-radius: 12px;
}

.image-error {
  text-align: center;
  padding: 20px;
  color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
  border-radius: 8px;
}

@media (max-width: 768px) {
  .reader-header {
    padding: 10px 15px;
  }
  
  .header-left {
    gap: 10px;
  }
  
  .back-btn span:first-child {
    display: inline;
  }
  
  .back-btn span:last-child {
    display: none;
  }
  
  .action-btn span {
    display: none;
  }
  
  .settings-panel {
    padding: 10px 15px;
    gap: 12px;
  }
  
  .setting-item {
    gap: 8px;
    font-size: 0.8rem;
  }
  
  .setting-item input[type="range"] {
    width: 100px;
  }
  
  .nav-arrow {
    width: 35px;
    height: 55px;
    font-size: 1.2rem;
  }
  
  .nav-arrow.left { left: -40px; }
  .nav-arrow.right { right: -40px; }
  
  .control-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .webtoon-floating-buttons {
    bottom: 70px;
    right: 10px;
  }
  
  .webtoon-bottom-bar {
    display: none;
  }
}

@media (max-width: 480px) {
  .nav-arrow {
    display: none;
  }
  
  .click-zone {
    width: 40%;
  }
}


</style>