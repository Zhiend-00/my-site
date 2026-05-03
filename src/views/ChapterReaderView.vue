<template>
  <div class="reader" v-if="!error">
    <!-- Верхняя панель -->
    <div class="reader-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn" title="Назад к манге">← Назад</button>
        <h2>{{ chapterTitle }}</h2>
      </div>
      <div class="header-right">
        <button @click="toggleReadingMode" class="settings-btn" title="Режим чтения">
          {{ readingMode === 'webtoon' ? '📜 Веб-тун' : '📖 Постранично' }}
        </button>
        <button @click="toggleBookmark" class="settings-btn" :class="{ active: isBookmarked }" title="Закладка">
          {{ isBookmarked ? '🔖 В закладках' : '🔖 Закладка' }}
        </button>
        <button @click="saveProgress" class="settings-btn" title="Сохранить прогресс">💾 Сохранить</button>
        <button @click="toggleFullscreen" class="settings-btn" title="Полноэкранный режим">🖥️ На весь экран</button>
        <button @click="showSettings = !showSettings" class="settings-btn" title="Настройки">⚙️</button>
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
          Автосохранение прогресса
        </label>
      </div>
      <div class="settings-group">
        <label>Яркость:</label>
        <input type="range" v-model.number="brightness" min="0.5" max="2" step="0.1" />
      </div>
    </div>

    <!-- Прогресс чтения -->
    <div v-if="readingMode === 'page' && pages.length > 0" class="progress-bar">
      <div class="progress-fill" :style="{ width: `${readingProgress}%` }"></div>
      <span>{{ Math.round(readingProgress) }}%</span>
    </div>

    <!-- Постраничный режим -->
    <div v-if="readingMode === 'page' && pages.length > 0" class="page-mode">
      <div class="image-container">
        <div class="nav-arrow left-arrow" @click="prevPage" :class="{ invisible: currentPage === 1 }">◀</div>
        <!-- Невидимые зоны для клика -->
        <div class="click-zone left" @click="prevPage"></div>
        <div class="image-wrapper" :style="{ transform: `scale(${zoomLevel / 100})`, filter: `brightness(${brightness})` }">
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
        <div class="click-zone right" @click="nextPage"></div>
        <div class="nav-arrow right-arrow" @click="nextPage" :class="{ invisible: currentPage === pages.length && !nextChapter }">▶</div>
      </div>
      <div class="page-info">
        <span>Страница {{ currentPage }} из {{ pages.length }}</span>
      </div>
      <div class="bottom-buttons">
        <button @click="prevPage" :disabled="currentPage === 1" class="nav-bottom-btn prev-btn">
          ◀ Предыдущая страница
        </button>
        <button v-if="currentPage === pages.length && nextChapter" @click="goToNextChapter" class="nav-bottom-btn next-chapter-btn">
          Следующая глава ▶
        </button>
        <button v-else @click="nextPage" :disabled="currentPage === pages.length" class="nav-bottom-btn next-btn">
          Следующая страница ▶
        </button>
      </div>
    </div>

    <!-- Веб-тун режим -->
    <div v-else-if="readingMode === 'webtoon' && pages.length > 0" class="webtoon-mode">
      <div class="webtoon-pages">
        <div v-for="(page, index) in pages" :key="page.page_number" class="webtoon-page">
          <img
            :src="getFullImageUrl(page.image_url)"
            :alt="'Страница ' + page.page_number"
            @error="handleImageError"
            @load="() => onWebtoonPageLoad(index)"
            loading="lazy"
            :style="{ filter: `brightness(${brightness})` }"
          />
        </div>
      </div>
      <div class="webtoon-buttons">
        <button @click="scrollToTop" class="webtoon-nav-btn">⬆ Вверх</button>
        <button @click="saveCurrentPosition" class="webtoon-nav-btn">📍 Сохранить позицию</button>
        <button v-if="nextChapter" @click="goToNextChapter" class="webtoon-nav-btn next-chapter-btn">📖 Следующая глава ▶</button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка главы...</p>
    </div>

    <div v-if="showNotification" class="notification" :class="notificationType">
      {{ notificationMessage }}
    </div>
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

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const error = ref(null);
const chapter = ref(null);
const pages = ref([]);
const currentPage = ref(1);
const currentPageLoaded = ref(false);
const nextChapter = ref(null);
const webtoonLoaded = ref([]);

const readingMode = ref(localStorage.getItem('readingMode') || 'page');
const zoomLevel = ref(parseInt(localStorage.getItem('zoomLevel')) || 100);
const autoSaveProgress = ref(localStorage.getItem('autoSaveProgress') !== 'false');
const brightness = ref(1);
const showSettings = ref(false);

const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('success');

const isBookmarked = ref(false);

const chapterTitle = computed(() => {
  if (!chapter.value) return 'Загрузка...';
  return chapter.value.title || `Глава ${chapter.value.chapterNumber || chapter.value.chapter_number}`;
});

const currentImageUrl = computed(() => {
  if (!pages.value.length || !currentPage.value) return '';
  const page = pages.value[currentPage.value - 1];
  if (!page) return '';
  return getFullImageUrl(page.image_url);
});

const readingProgress = computed(() => {
  if (!pages.value.length) return 0;
  return (currentPage.value / pages.value.length) * 100;
});

const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:3000${url}`;
};

const goBack = () => router.back();
const handleImageError = (e) => { e.target.style.display = 'none'; };
const onPageLoad = () => { currentPageLoaded.value = true; autoSave(); };
const onWebtoonPageLoad = (i) => { webtoonLoaded.value[i] = true; };

const loadNextChapter = async () => {
  if (!chapter.value) return;
  try {
    const mangaId = chapter.value.mangaId || chapter.value.manga_id;
    const currentNum = chapter.value.chapterNumber || chapter.value.chapter_number;
    const chapters = await mangaAPI.getChapters(mangaId);
    nextChapter.value = chapters.find(ch => (ch.chapterNumber || ch.chapter_number) === currentNum + 1) || null;
  } catch (err) {
    nextChapter.value = null;
  }
};

const goToNextChapter = () => {
  if (nextChapter.value) router.push(`/chapter/${nextChapter.value.id}`);
};

const toggleReadingMode = () => {
  readingMode.value = readingMode.value === 'page' ? 'webtoon' : 'page';
  localStorage.setItem('readingMode', readingMode.value);
};

const toggleBookmark = () => {
  if (!chapter.value) return;
  const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
  const index = bookmarks.findIndex(b => b.chapterId === chapter.value.id);
  if (index === -1) {
    bookmarks.push({
      chapterId: chapter.value.id,
      mangaId: chapter.value.mangaId || chapter.value.manga_id,
      chapterNumber: chapter.value.chapterNumber || chapter.value.chapter_number,
      page: currentPage.value,
      timestamp: new Date().toISOString()
    });
    isBookmarked.value = true;
  } else {
    bookmarks.splice(index, 1);
    isBookmarked.value = false;
  }
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
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
  } catch {}
};

const autoSave = () => { if (autoSaveProgress.value && authStore.isLoggedIn && readingMode.value === 'page') saveProgress(); };
const saveCurrentPosition = () => { if (readingMode.value === 'webtoon' && chapter.value) localStorage.setItem(`scroll_${chapter.value.id}`, window.scrollY); };
const restoreScrollPosition = () => {
  if (readingMode.value === 'webtoon' && chapter.value) {
    const saved = localStorage.getItem(`scroll_${chapter.value.id}`);
    if (saved) setTimeout(() => window.scrollTo({ top: parseInt(saved), behavior: 'instant' }), 100);
  }
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
};

const updateZoom = () => localStorage.setItem('zoomLevel', zoomLevel.value);
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
};

const loadProgress = async () => {
  if (!authStore.isLoggedIn || !chapter.value) return;
  try {
    const mangaId = chapter.value.mangaId || chapter.value.manga_id;
    const progress = await progressAPI.get(mangaId);
    if (progress && progress.chapter_id === chapter.value.id) {
      currentPage.value = progress.page_number || 1;
    }
  } catch {}
};

const loadChapter = async () => {
  loading.value = true;
  error.value = null;
  try {
    const id = route.params.id;
    const chap = await chaptersAPI.get(id);
    if (!chap) throw new Error('Глава не найдена');
    chapter.value = chap;
    const pagesData = await chaptersAPI.getPages(id);
    pages.value = pagesData.pages || [];
    webtoonLoaded.value = new Array(pages.value.length).fill(false);
    if (pages.value.length > 0) {
      await loadNextChapter();
      await loadProgress();
      loadBookmarkStatus();
      if (readingMode.value === 'webtoon') restoreScrollPosition();
    }
  } catch (err) {
    error.value = err.message || 'Не удалось загрузить главу';
  } finally {
    loading.value = false;
  }
};

watch(() => route.params.id, () => loadChapter());
onMounted(() => {
  loadChapter();
  window.addEventListener('keydown', handleKeydown);
});
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  if (readingMode.value === 'webtoon' && chapter.value) saveCurrentPosition();
});
</script>

<style scoped>
.reader {
  background: var(--color-background, #111);
  color: var(--color-text, #fff);
  min-height: 100vh;
}

.reader-header {
  position: sticky;
  top: 60px;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--color-panel, #1e1e1e);
  border-bottom: 2px solid var(--color-primary, #0a7e14);
  flex-wrap: wrap;
  gap: 15px;
}

.header-left { display: flex; align-items: center; gap: 20px; }
.header-left h2 { color: var(--color-primary); margin: 0; font-size: 1.3rem; }
.header-right { display: flex; gap: 10px; flex-wrap: wrap; }

.back-btn {
  background: var(--color-secondary, #9ea344);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.settings-btn {
  background: var(--color-panel-light, #2a2a2a);
  border: 1px solid var(--color-secondary);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.settings-btn:hover { background: var(--color-secondary); }
.settings-btn.active { background: var(--color-primary); border-color: var(--color-primary); }

.settings-panel {
  position: sticky;
  top: 130px;
  background: var(--color-panel);
  padding: 15px 20px;
  border-bottom: 1px solid var(--color-secondary);
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  z-index: 99;
}

.settings-group { display: flex; align-items: center; gap: 10px; }
.settings-group label { color: var(--color-secondary); }

.progress-bar {
  position: sticky;
  top: 120px;
  height: 4px;
  background: var(--color-panel-light);
  margin: 10px 0;
  border-radius: 2px;
  overflow: hidden;
  z-index: 99;
}
.progress-fill { height: 100%; background: var(--color-primary); transition: width 0.3s; }

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
.image-wrapper img { max-width: 100%; height: auto; border-radius: 8px; }

/* Невидимые зоны для клика */
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
  width: 50px;
  height: 80px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(5px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
  opacity: 0.7;
  color: white;
  font-size: 2rem;
}
.nav-arrow:hover { background: rgba(10,126,20,0.8); opacity: 1; }
.left-arrow { left: -70px; }
.right-arrow { right: -70px; }
.nav-arrow.invisible { opacity: 0; pointer-events: none; }

.page-info { text-align: center; margin: 20px 0; color: var(--color-secondary); }

.bottom-buttons { display: flex; justify-content: center; gap: 20px; margin: 20px 0; }
.nav-bottom-btn { padding: 12px 24px; border: none; border-radius: 30px; font-size: 1rem; font-weight: 600; cursor: pointer; }
.prev-btn { background: var(--color-panel-light); color: white; border: 1px solid var(--color-secondary); }
.next-btn { background: var(--color-primary); color: white; }
.next-chapter-btn { background: #ffaa00; color: black; }
.nav-bottom-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.webtoon-mode { display: flex; flex-direction: column; align-items: center; }
.webtoon-pages { display: flex; flex-direction: column; align-items: center; gap: 5px; width: 100%; max-width: 1000px; margin: 0 auto; }
.webtoon-page { width: 100%; }
.webtoon-page img { width: 100%; height: auto; border-radius: 8px; }
.webtoon-buttons { position: fixed; bottom: 20px; right: 20px; display: flex; gap: 10px; z-index: 100; }
.webtoon-nav-btn { background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); border: 1px solid var(--color-primary); color: white; padding: 10px 16px; border-radius: 30px; cursor: pointer; font-weight: 600; }

.image-loader { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: var(--color-panel); border-radius: 8px; }
.spinner { width: 50px; height: 50px; border: 4px solid var(--color-panel-light); border-top: 4px solid var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 20px; }
.loading-state p { color: var(--color-secondary); }

.notification { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); padding: 10px 20px; border-radius: 30px; z-index: 200; animation: fadeInOut 2s ease; }
.notification.success { background: var(--color-primary); color: white; }
.notification.error { background: #ff4444; color: white; }
.notification.info { background: var(--color-secondary); color: white; }
@keyframes fadeInOut { 0% { opacity: 0; transform: translateX(-50%) translateY(20px); } 15% { opacity: 1; transform: translateX(-50%) translateY(0); } 85% { opacity: 1; } 100% { opacity: 0; } }

.error-state { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
.error-content { text-align: center; background: var(--color-panel); padding: 40px; border-radius: 12px; }
</style>