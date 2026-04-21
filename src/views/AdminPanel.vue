<template>
  <div class="admin-page">
    <div class="container">
      <h1>⚙️ Административная панель</h1>

      <!-- Проверка прав администратора -->
      <div v-if="!authStore.isAdmin" class="access-denied">
        <div class="denied-card">
          <div class="denied-icon">⛔</div>
          <h2>Доступ запрещён</h2>
          <p>Эта страница доступна только администраторам</p>
          <router-link to="/" class="btn-primary">Вернуться на главную</router-link>
        </div>
      </div>

      <div v-else>
        <!-- Вкладки -->
        <div class="admin-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.name }}
          </button>
        </div>

        <!-- Контент вкладок -->
        <div class="tab-content">
          <!-- ========== Вкладка Манга ========== -->
          <div v-if="activeTab === 'manga'" class="tab-pane">
            <div class="pane-header">
              <h2>📚 Управление мангой</h2>
              <button class="add-btn" @click="openMangaModal()">➕ Добавить мангу</button>
            </div>

            <div v-if="mangaLoading" class="loading">Загрузка...</div>
            <div v-else class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Обложка</th>
                    <th>Название</th>
                    <th>Автор</th>
                    <th>Статус</th>
                    <th>Глав</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in mangaList" :key="item.id">
                    <td>{{ item.id }}</td>
                    <td>
                      <img
                        :src="getCoverUrl(item.cover_image)"
                        :alt="item.title"
                        class="table-thumb"
                        @error="handleImageError"
                      />
                    </td>
                    <td>{{ item.title }}</td>
                    <td>{{ item.author || '—' }}</td>
                    <td>
                      <span class="status-badge" :class="item.status">
                        {{ getStatusText(item.status) }}
                      </span>
                    </td>
                    <td>{{ item.chapters_count || 0 }}</td>
                    <td>
                      <button class="edit-btn" @click="openMangaModal(item)">✏️</button>
                      <button class="delete-btn" @click="deleteManga(item.id)">🗑️</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ========== Вкладка Главы ========== -->
          <div v-if="activeTab === 'chapters'" class="tab-pane">
            <div class="pane-header">
              <h2>📖 Управление главами</h2>
              <button class="add-btn" @click="openChapterModal()">➕ Добавить главу</button>
            </div>

            <div class="filter-section">
              <label>Фильтр по манге:</label>
              <select v-model="chapterFilterMangaId" @change="loadChapters">
                <option value="">Все манги</option>
                <option v-for="m in mangaList" :key="m.id" :value="m.id">
                  {{ m.title }}
                </option>
              </select>
            </div>

            <div v-if="chaptersLoading" class="loading">Загрузка...</div>
            <div v-else class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Манга</th>
                    <th>Номер главы</th>
                    <th>Название</th>
                    <th>Страниц</th>
                    <th>Просмотры</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ch in filteredChapters" :key="ch.id">
                    <td>{{ ch.id }}</td>
                    <td>{{ getMangaTitle(ch.manga_id) }}</td>
                    <td>{{ ch.chapter_number }}</td>
                    <td>{{ ch.title || '—' }}</td>
                    <td>{{ ch.pages_count || 0 }}</td>
                    <td>{{ ch.views || 0 }}</td>
                    <td>
                      <button class="edit-btn" @click="openChapterModal(ch)">✏️</button>
                      <button class="delete-btn" @click="deleteChapter(ch.id)">🗑️</button>
                      <button class="view-btn" @click="viewChapterPages(ch)">📄</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ========== Вкладка Пользователи ========== -->
          <div v-if="activeTab === 'users'" class="tab-pane">
            <div class="pane-header">
              <h2>👥 Управление пользователями</h2>
            </div>
            <div v-if="usersLoading" class="loading">Загрузка...</div>
            <div v-else class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Имя пользователя</th>
                    <th>Email</th>
                    <th>Роль</th>
                    <th>Дата регистрации</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in userList" :key="user.id">
                    <td>{{ user.id }}</td>
                    <td>{{ user.username }}</td>
                    <td>{{ user.email }}</td>
                    <td>
                      <select
                        v-model="user.role"
                        @change="updateUserRole(user)"
                        class="role-select"
                        :disabled="user.id === authStore.user?.id"
                      >
                        <option value="user">Пользователь</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </td>
                    <td>{{ formatDate(user.created_at) }}</td>
                    <td>
                      <button
                        class="delete-btn"
                        @click="deleteUser(user.id)"
                        :disabled="user.id === authStore.user?.id"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ========== Вкладка Синхронизация ========== -->
          <div v-if="activeTab === 'sync'" class="tab-pane">
  <h2>🔄 Синхронизация с файловой системой</h2>
  <div class="sync-buttons">
    <button @click="runSync('all')" :disabled="syncLoading.all" class="sync-btn primary">
      {{ syncLoading.all ? 'Синхронизация...' : 'Полная синхронизация (манга/главы)' }}
    </button>
    <button @click="runSync('pages')" :disabled="syncLoading.pages" class="sync-btn">
      {{ syncLoading.pages ? 'Синхронизация...' : 'Синхронизировать страницы глав' }}
    </button>
  </div>
  <div v-if="syncResult" class="sync-result">
    <h3>Результат:</h3>
    <pre>{{ JSON.stringify(syncResult, null, 2) }}</pre>
  </div>
</div>
        </div>
      </div>
    </div>

    <!-- ========== Модальное окно для манги ========== -->
    <div v-if="showMangaModal" class="modal">
      <div class="modal-content">
        <h2>{{ editingManga ? 'Редактировать мангу' : 'Добавить мангу' }}</h2>
        <form @submit.prevent="saveManga">
          <div class="form-group">
            <label>Название *</label>
            <input v-model="mangaForm.title" required />
          </div>
          <div class="form-group">
            <label>Описание</label>
            <textarea v-model="mangaForm.description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Автор</label>
            <input v-model="mangaForm.author" />
          </div>
          <div class="form-group">
            <label>Обложка (путь к изображению)</label>
            <input v-model="mangaForm.cover_image" placeholder="/uploads/covers/cover-1.png" />
          </div>
          <div class="form-group">
            <label>Статус</label>
            <select v-model="mangaForm.status">
              <option value="ongoing">Онгоинг</option>
              <option value="completed">Завершено</option>
              <option value="hiatus">Хиатус</option>
            </select>
          </div>
          <div class="form-group">
            <label>Жанры (через запятую)</label>
            <input v-model="mangaForm.genresInput" placeholder="Экшен, Приключения" />
          </div>
          <div class="form-group">
            <label>Год выпуска</label>
            <input type="number" v-model.number="mangaForm.year" />
          </div>
          <div class="modal-actions">
            <button type="submit" class="save-btn">Сохранить</button>
            <button type="button" class="cancel-btn" @click="closeMangaModal">Отмена</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========== Модальное окно для главы ========== -->
    <div v-if="showChapterModal" class="modal">
      <div class="modal-content">
        <h2>{{ editingChapter ? 'Редактировать главу' : 'Добавить главу' }}</h2>
        <form @submit.prevent="saveChapter">
          <div class="form-group">
            <label>Манга *</label>
            <select v-model="chapterForm.manga_id" required>
              <option value="">Выберите мангу</option>
              <option v-for="m in mangaList" :key="m.id" :value="m.id">
                {{ m.title }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Номер главы *</label>
            <input type="number" v-model.number="chapterForm.chapter_number" required min="1" step="1" />
          </div>
          <div class="form-group">
            <label>Название главы</label>
            <input v-model="chapterForm.title" />
          </div>
          <div class="form-group">
            <label>Количество страниц (будет обновлено при синхронизации)</label>
            <input type="number" v-model.number="chapterForm.pages_count" disabled />
          </div>
          <div class="modal-actions">
            <button type="submit" class="save-btn">Сохранить</button>
            <button type="button" class="cancel-btn" @click="closeChapterModal">Отмена</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========== Модальное окно для страниц главы ========== -->
    <div v-if="showPagesModal" class="modal">
      <div class="modal-content pages-modal">
        <h2>📄 Страницы главы {{ pagesChapterTitle }}</h2>
        <div v-if="pagesLoading" class="loading">Загрузка страниц...</div>
        <div v-else class="pages-grid">
          <div v-for="page in pagesList" :key="page.page_number" class="page-item">
            <img :src="page.image_url" :alt="`Стр. ${page.page_number}`" @error="handleImageError" />
            <span>{{ page.page_number }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="closePagesModal">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { mangaAPI, chaptersAPI, adminAPI } from '@/api'
import { getCoverUrl, handleImageError } from '@/utils/imageHelper'

const authStore = useAuthStore()

const activeTab = ref('manga')
const tabs = [
  { id: 'manga', name: '📚 Манга' },
  { id: 'chapters', name: '📖 Главы' },
  { id: 'users', name: '👥 Пользователи' },
  { id: 'sync', name: '🔄 Синхронизация' }
]

const mangaList = ref([])
const userList = ref([])
const mangaLoading = ref(false)
const usersLoading = ref(false)

const chaptersList = ref([])
const chaptersLoading = ref(false)
const chapterFilterMangaId = ref('')

const showChapterModal = ref(false)
const editingChapter = ref(null)
const chapterForm = reactive({
  manga_id: '',
  chapter_number: null,
  title: '',
  pages_count: 0
})

const showPagesModal = ref(false)
const pagesList = ref([])
const pagesLoading = ref(false)
const pagesChapterTitle = ref('')

const syncLoading = reactive({ all: false, pages: false })
const syncResult = ref(null)

const showMangaModal = ref(false)
const editingManga = ref(null)
const mangaForm = reactive({
  title: '',
  description: '',
  author: '',
  cover_image: '',
  status: 'ongoing',
  genresInput: '',
  year: null
})

const getStatusText = (status) => {
  const map = { ongoing: 'Онгоинг', completed: 'Завершено', hiatus: 'Хиатус' }
  return map[status] || status
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ru-RU')
}

const getMangaTitle = (mangaId) => {
  const manga = mangaList.value.find(m => m.id == mangaId)
  return manga ? manga.title : `ID: ${mangaId}`
}

const filteredChapters = computed(() => {
  if (!chapterFilterMangaId.value) return chaptersList.value
  return chaptersList.value.filter(ch => ch.manga_id == chapterFilterMangaId.value)
})

const loadManga = async () => {
  mangaLoading.value = true
  try {
    const data = await mangaAPI.list({ limit: 100 })
    mangaList.value = data.manga || data
  } catch (error) {
    console.error('Ошибка загрузки манги:', error)
  } finally {
    mangaLoading.value = false
  }
}

const loadChapters = async () => {
  chaptersLoading.value = true;
  try {
    const params = {};
    if (chapterFilterMangaId.value) params.mangaId = chapterFilterMangaId.value;
    const data = await chaptersAPI.list(params);
    chaptersList.value = data.chapters || [];
  } catch (error) {
    console.error('Ошибка загрузки глав:', error);
  } finally {
    chaptersLoading.value = false;
  }
};

const loadUsers = async () => {
  usersLoading.value = true
  try {
    userList.value = await adminAPI.getUsers()
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error)
  } finally {
    usersLoading.value = false
  }
}

const deleteManga = async (id) => {
  if (!confirm('Удалить эту мангу? Это действие необратимо.')) return
  try {
    await adminAPI.deleteManga(id)
    await loadManga()
    await loadChapters()
  } catch (error) {
    alert('Ошибка при удалении манги')
  }
}

const openMangaModal = (manga = null) => {
  editingManga.value = manga
  if (manga) {
    mangaForm.title = manga.title || ''
    mangaForm.description = manga.description || ''
    mangaForm.author = manga.author || ''
    mangaForm.cover_image = manga.coverImage || manga.cover_image || ''
    mangaForm.status = manga.status || 'ongoing'
    mangaForm.genresInput = (manga.genres || []).join(', ')
    mangaForm.year = manga.year || null
  } else {
    mangaForm.title = ''
    mangaForm.description = ''
    mangaForm.author = ''
    mangaForm.cover_image = ''
    mangaForm.status = 'ongoing'
    mangaForm.genresInput = ''
    mangaForm.year = null
  }
  showMangaModal.value = true
}

const closeMangaModal = () => {
  showMangaModal.value = false
}

const saveManga = async () => {
  const data = {
    title: mangaForm.title,
    description: mangaForm.description,
    author: mangaForm.author,
    cover_image: mangaForm.cover_image,
    status: mangaForm.status,
    genres: mangaForm.genresInput.split(',').map(g => g.trim()).filter(Boolean),
    year: mangaForm.year,
  };

  try {
    if (editingManga.value) {
      await adminAPI.updateManga(editingManga.value.id, data);
    } else {
      await adminAPI.createManga(data);
    }
    closeMangaModal();
    await loadManga();
  } catch (error) {
    alert('Ошибка сохранения манги: ' + error.message);
  }
};

const deleteChapter = async (id) => {
  if (!confirm('Удалить эту главу?')) return
  try {
    await chaptersAPI.delete(id)
    await loadChapters()
  } catch (error) {
    alert('Ошибка при удалении главы')
  }
}

const openChapterModal = (chapter = null) => {
  editingChapter.value = chapter
  if (chapter) {
    chapterForm.manga_id = chapter.manga_id
    chapterForm.chapter_number = chapter.chapter_number
    chapterForm.title = chapter.title || ''
    chapterForm.pages_count = chapter.pages_count || 0
  } else {
    chapterForm.manga_id = ''
    chapterForm.chapter_number = null
    chapterForm.title = ''
    chapterForm.pages_count = 0
  }
  showChapterModal.value = true
}

const closeChapterModal = () => {
  showChapterModal.value = false
}

const saveChapter = async () => {
  if (!chapterForm.manga_id || !chapterForm.chapter_number) {
    alert('Заполните обязательные поля')
    return
  }

  const data = {
    manga_id: chapterForm.manga_id,
    chapter_number: chapterForm.chapter_number,
    title: chapterForm.title,
    pages_count: chapterForm.pages_count || 0,
    views: editingChapter.value ? editingChapter.value.views : 0,
    created_at: editingChapter.value ? editingChapter.value.created_at : new Date().toISOString()
  }

  try {
    if (editingChapter.value) {
      await chaptersAPI.update(editingChapter.value.id, data)
    } else {
      await chaptersAPI.create(data)
    }
    closeChapterModal()
    await loadChapters()
  } catch (error) {
    alert('Ошибка сохранения главы')
  }
}

const viewChapterPages = async (chapter) => {
  pagesChapterTitle.value = `Глава ${chapter.chapter_number}${chapter.title ? ' — ' + chapter.title : ''}`
  pagesLoading.value = true
  showPagesModal.value = true
  try {
    const data = await chaptersAPI.getPages(chapter.id)
    pagesList.value = data.pages || []
  } catch (error) {
    alert('Не удалось загрузить страницы')
    pagesList.value = []
  } finally {
    pagesLoading.value = false
  }
}

const closePagesModal = () => {
  showPagesModal.value = false
  pagesList.value = []
}

const updateUserRole = async (user) => {
  try {
    await adminAPI.updateUserRole(user.id, user.role)
  } catch (error) {
    alert('Не удалось обновить роль пользователя')
    await loadUsers()
  }
}

const deleteUser = async (id) => {
  if (!confirm('Удалить этого пользователя?')) return
  try {
    await adminAPI.deleteUser(id)
    await loadUsers()
  } catch (error) {
    alert('Ошибка при удалении пользователя')
  }
}

const runSync = async (type) => {
  syncLoading[type] = true
  syncResult.value = null
  try {
    let data
    if (type === 'all') {
      data = await adminAPI.syncAll()
    } else if (type === 'pages') {
      data = await adminAPI.syncPages()
    }
    syncResult.value = data
    await loadManga()
    await loadChapters()
  } catch (error) {
    alert('Ошибка синхронизации: ' + error.message)
  } finally {
    syncLoading[type] = false
  }
}

onMounted(() => {
  if (authStore.isAdmin) {
    loadManga()
    loadChapters()
    loadUsers()
  }
})
</script>

<style scoped>
/* Стили полностью из вашего примера (я их скопировал, они остаются без изменений) */
.admin-page {
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  padding: 40px 0;
  background: #000000;
  color: #ffffff;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

h1 {
  color: #07660C;
  margin-bottom: 30px;
  text-align: center;
  font-size: 2.5rem;
}

.access-denied {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.denied-card {
  background: #202020;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
}

.denied-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  color: #07660C;
}

.denied-card h2 {
  color: #07660C;
  margin-bottom: 10px;
}

.denied-card p {
  color: #80832A;
  margin-bottom: 30px;
}

.btn-primary {
  display: inline-block;
  padding: 10px 20px;
  background: #07660C;
  color: white;
  text-decoration: none;
  border-radius: 5px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #0a7e0f;
}

.admin-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background: #202020;
  padding: 10px;
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: #2B2B2B;
  border: none;
  color: #ffffff;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #07660C;
}

.tab-btn:hover:not(.active) {
  background: #80832A;
}

.tab-content {
  background: #202020;
  padding: 20px;
  border-radius: 12px;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pane-header h2 {
  color: #07660C;
}

.add-btn {
  padding: 8px 16px;
  background: #07660C;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
}

.add-btn:hover {
  background: #0a7e0f;
}

.filter-section {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-section label {
  color: #80832A;
}

.filter-section select {
  padding: 6px 10px;
  background: #2B2B2B;
  color: white;
  border: 1px solid #80832A;
  border-radius: 4px;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: #2B2B2B;
  border-radius: 8px;
  overflow: hidden;
}

.data-table th,
.data-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #404040;
}

.data-table th {
  background: #202020;
  color: #80832A;
  font-weight: 600;
}

.data-table tr:hover {
  background: #333333;
}

.table-thumb {
  width: 50px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
}

.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
}

.status-badge.ongoing { background: #07660C; }
.status-badge.completed { background: #80832A; }
.status-badge.hiatus { background: #ff9800; }

.edit-btn,
.delete-btn,
.view-btn {
  padding: 5px 10px;
  margin: 0 3px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.edit-btn {
  background: #80832A;
  color: white;
}

.delete-btn {
  background: #f44336;
  color: white;
}

.view-btn {
  background: #07660C;
  color: white;
}

.view-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.role-select {
  background: #202020;
  color: white;
  border: 1px solid #80832A;
  padding: 4px 8px;
  border-radius: 4px;
}

.role-select:disabled {
  opacity: 0.5;
}

.sync-buttons {
  display: flex;
  gap: 15px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.sync-btn {
  padding: 12px 24px;
  background: #2B2B2B;
  border: 1px solid #80832A;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.sync-btn.primary {
  background: #07660C;
  border-color: #07660C;
}

.sync-btn:hover:not(:disabled) {
  background: #80832A;
  color: black;
}

.sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sync-result {
  background: #2B2B2B;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
}

.sync-result pre {
  white-space: pre-wrap;
  word-break: break-word;
  color: #80832A;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #80832A;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #202020;
  padding: 30px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.pages-modal {
  max-width: 800px;
}

.modal-content h2 {
  color: #07660C;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #80832A;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px;
  background: #2B2B2B;
  border: 1px solid #80832A;
  border-radius: 4px;
  color: white;
}

.form-group input:disabled {
  opacity: 0.7;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.save-btn,
.cancel-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
}

.save-btn {
  background: #07660C;
  color: white;
}

.cancel-btn {
  background: #f44336;
  color: white;
}

.pages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  margin: 20px 0;
  max-height: 400px;
  overflow-y: auto;
  padding: 5px;
}

.page-item {
  background: #2B2B2B;
  border-radius: 5px;
  overflow: hidden;
  text-align: center;
}

.page-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-bottom: 1px solid #404040;
}

.page-item span {
  display: block;
  padding: 5px;
  color: #80832A;
  font-size: 0.9rem;
}
</style>