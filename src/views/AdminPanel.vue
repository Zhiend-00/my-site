<template>
  <div class="admin-page">
    <div class="admin-layout">
      <!-- Боковое меню -->
      <aside class="sidebar">
        <h2>Админ-панель</h2>
        <nav>
          <button @click="activeTab = 'manga'" :class="{ active: activeTab === 'manga' }">📚 Манга</button>
          <button @click="activeTab = 'chapters'" :class="{ active: activeTab === 'chapters' }">📖 Главы</button>
          <button @click="activeTab = 'users'" :class="{ active: activeTab === 'users' }">👥 Пользователи</button>
          <button @click="activeTab = 'forum'" :class="{ active: activeTab === 'forum' }">💬 Форум</button>
          <button @click="activeTab = 'feedback'" :class="{ active: activeTab === 'feedback' }">📬 Сообщения</button>
          <button @click="activeTab = 'upload'" :class="{ active: activeTab === 'upload' }">📤 Загрузка главы</button>
          <button @click="activeTab = 'import'" :class="{ active: activeTab === 'import' }">📥 Импорт Excel</button>
          <button @click="activeTab = 'stats'" :class="{ active: activeTab === 'stats' }">📊 Статистика</button>
          <button @click="activeTab = 'sync'" :class="{ active: activeTab === 'sync' }">🔄 Синхронизация</button>
        </nav>
      </aside>

      <!-- Основной контент -->
      <main class="content">
        <!-- ========== Манга ========== -->
        <section v-if="activeTab === 'manga'">
          <div class="header-row">
            <h2>Управление мангой</h2>
            <button @click="openMangaModal()" class="btn-primary">+ Добавить мангу</button>
          </div>
          <div class="table-responsive">
            <table v-if="mangaList.length" class="table">
              <thead>
                <tr>
                  <th>ID</th><th>Обложка</th><th>Название</th><th>Автор</th><th>Статус</th><th>Глав</th><th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in mangaList" :key="m.id">
                  <td>{{ m.id }}</td>
                  <td><img :src="getCoverUrl(m.cover_image)" width="40" /></td>
                  <td>{{ m.title }}</td>
                  <td>{{ m.author || '—' }}</td>
                  <td><span :class="'status ' + m.status">{{ statusText(m.status) }}</span></td>
                  <td>{{ m.chapters_count || 0 }}</td>
                  <td>
                    <button @click="openMangaModal(m)" class="btn-sm">✏️</button>
                    <button @click="deleteManga(m.id)" class="btn-sm danger">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty">Загрузка...</div>
          </div>
        </section>

        <!-- ========== Главы ========== -->
        <section v-if="activeTab === 'chapters'">
          <div class="header-row">
            <h2>Управление главами</h2>
            <button @click="openChapterModal()" class="btn-primary">+ Добавить главу</button>
          </div>
          <div class="filter-row">
            <label>Манга:</label>
            <select v-model="chapterFilterId" @change="loadChapters">
              <option value="">Все</option>
              <option v-for="m in mangaList" :key="m.id" :value="m.id">{{ m.title }}</option>
            </select>
          </div>
          <div class="table-responsive">
            <table v-if="filteredChapters.length" class="table">
              <thead>
                <tr>
                  <th>ID</th><th>Манга</th><th>Номер</th><th>Название</th><th>Страниц</th><th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ch in filteredChapters" :key="ch.id">
                  <td>{{ ch.id }}</td>
                  <td>{{ getMangaTitle(ch.manga_id) }}</td>
                  <td>{{ ch.chapter_number }}</td>
                  <td>{{ ch.title || '—' }}</td>
                  <td>{{ ch.pages_count || 0 }}</td>
                  <td>
                    <button @click="openChapterModal(ch)" class="btn-sm">✏️</button>
                    <button @click="deleteChapter(ch.id)" class="btn-sm danger">🗑️</button>
                    <button @click="viewPages(ch)" class="btn-sm">📄</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty">Нет глав</div>
          </div>
        </section>

        <!-- ========== Пользователи ========== -->
        <section v-if="activeTab === 'users'">
          <h2>Пользователи</h2>
          <div class="table-responsive">
            <table v-if="users.length" class="table">
              <thead>
                <tr>
                  <th>ID</th><th>Имя</th><th>Email</th><th>Роль</th><th>Дата регистрации</th><th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in users" :key="u.id">
                  <td>{{ u.id }}</td>
                  <td>{{ u.username }}</td>
                  <td>{{ u.email }}</td>
                  <td>
                    <select v-model="u.role" @change="updateRole(u)" :disabled="u.id === authStore.user?.id">
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{{ formatDate(u.created_at) }}</td>
                  <td>
                    <button v-if="u.id !== authStore.user?.id" @click="deleteUser(u.id)" class="btn-sm danger">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty">Загрузка...</div>
          </div>
        </section>

        <!-- ========== Форум ========== -->
        <section v-if="activeTab === 'forum'">
          <h2>Форум</h2>
          <div class="tab-nav">
            <button @click="forumSubtab = 'categories'" :class="{ active: forumSubtab === 'categories' }">Категории</button>
            <button @click="forumSubtab = 'topics'" :class="{ active: forumSubtab === 'topics' }">Темы</button>
            <button @click="forumSubtab = 'posts'" :class="{ active: forumSubtab === 'posts' }">Посты</button>
          </div>
          <!-- Категории -->
          <div v-if="forumSubtab === 'categories'" class="sub-panel">
            <div class="header-row">
              <h3>Категории</h3>
              <button @click="openCategoryModal()" class="btn-primary">+ Категория</button>
            </div>
            <div class="table-responsive">
              <table v-if="categories.length" class="table">
                <thead>
                  <tr>
                    <th>ID</th><th>Название</th><th>Slug</th><th>Порядок</th><th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="cat in categories" :key="cat.id">
                    <td>{{ cat.id }}</td>
                    <td>{{ cat.name }}</td>
                    <td>{{ cat.slug }}</td>
                    <td>{{ cat.order }}</td>
                    <td>
                      <button @click="openCategoryModal(cat)" class="btn-sm">✏️</button>
                      <button @click="deleteCategory(cat.id)" class="btn-sm danger">🗑️</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty">Нет категорий</div>
            </div>
          </div>
          <!-- Темы -->
          <div v-if="forumSubtab === 'topics'" class="sub-panel">
            <div class="table-responsive">
              <table v-if="forumTopics.length" class="table">
                <thead>
                  <tr>
                    <th>ID</th><th>Заголовок</th><th>Автор</th><th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="t in forumTopics" :key="t.id">
                    <td>{{ t.id }}</td>
                    <td>{{ t.title }}</td>
                    <td>{{ t.author?.username }}</td>
                    <td>
                      <button @click="deleteTopic(t.id)" class="btn-sm danger">🗑️</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty">Нет тем</div>
            </div>
          </div>
          <!-- Посты -->
          <div v-if="forumSubtab === 'posts'" class="sub-panel">
            <div class="table-responsive">
              <table v-if="forumPosts.length" class="table">
                <thead>
                  <tr>
                    <th>ID</th><th>Содержание</th><th>Автор</th><th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in forumPosts" :key="p.id">
                    <td>{{ p.id }}</td>
                    <td>{{ truncate(p.content, 60) }}</td>
                    <td>{{ p.author?.username }}</td>
                    <td>
                      <button @click="deletePost(p.id)" class="btn-sm danger">🗑️</button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty">Нет постов</div>
            </div>
          </div>
        </section>

        <!-- ========== Сообщения (обратная связь) ========== -->
        <section v-if="activeTab === 'feedback'">
          <h2>Сообщения от пользователей</h2>
          <div class="table-responsive">
            <table v-if="feedbacks.length" class="table">
              <thead>
                <tr>
                  <th>ID</th><th>Имя</th><th>Email</th><th>Сообщение</th><th>Статус</th><th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="fb in feedbacks" :key="fb.id">
                  <td>{{ fb.id }}</td>
                  <td>{{ fb.name }}</td>
                  <td>{{ fb.email }}</td>
                  <td>{{ truncate(fb.message, 50) }}</td>
                  <td>{{ fb.status }}</td>
                  <td>
                    <button @click="openFeedbackReply(fb)" class="btn-sm">Ответить</button>
                    <button @click="deleteFeedback(fb.id)" class="btn-sm danger">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty">Нет сообщений</div>
          </div>
        </section>

        <!-- Загрузка главы ZIP -->
        <section v-if="activeTab === 'upload'">
          <h2>Загрузка главы (ZIP)</h2>
          <form @submit.prevent="uploadChapterZip" class="form">
            <label>ID манги</label>
            <input type="number" v-model="uploadForm.mangaId" required />
            <label>Номер главы</label>
            <input type="number" v-model="uploadForm.chapterNumber" required />
            <label>Название главы</label>
            <input type="text" v-model="uploadForm.title" />
            <label>Архив ZIP</label>
            <input type="file" ref="zipFileInput" accept=".zip" required />
            <button type="submit" :disabled="uploadForm.submitting" class="btn-primary">
              {{ uploadForm.submitting ? 'Загрузка...' : 'Загрузить' }}
            </button>
            <p v-if="uploadForm.result" class="result-msg">{{ uploadForm.result }}</p>
          </form>
        </section>

        <!-- Импорт Excel -->
        <section v-if="activeTab === 'import'">
          <h2>Импорт манги из Excel</h2>
          <form @submit.prevent="importExcel" class="form">
            <label>Файл Excel (.xlsx)</label>
            <input type="file" ref="excelFileInput" accept=".xlsx,.xls" required />
            <button type="submit" :disabled="importing" class="btn-primary">
              {{ importing ? 'Импорт...' : 'Загрузить и импортировать' }}
            </button>
            <p v-if="importMessage" class="result-msg">{{ importMessage }}</p>
          </form>
        </section>

        <!-- Статистика -->
        <section v-if="activeTab === 'stats'">
          <h2>Статистика</h2>
          <div class="stats-grid">
            <div class="stat-card"><span>Пользователей</span><strong>{{ stats.users }}</strong></div>
            <div class="stat-card"><span>Манги</span><strong>{{ stats.manga }}</strong></div>
            <div class="stat-card"><span>Просмотров</span><strong>{{ stats.totalViews }}</strong></div>
          </div>
        </section>

        <!-- Синхронизация -->
        <section v-if="activeTab === 'sync'">
          <h2>Синхронизация</h2>
          <button @click="syncAll" class="btn-primary">Полная синхронизация</button>
        </section>
      </main>
    </div>

    <!-- ========== Модальные окна (единый стиль) ========== -->

    <!-- Модальное окно: Манга -->
    <div v-if="showMangaModal" class="modal-overlay" @click.self="closeMangaModal">
      <div class="modal-card">
        <h3>{{ editingManga ? 'Редактировать мангу' : 'Добавить мангу' }}</h3>
        <form @submit.prevent="saveManga">
          <input v-model="mangaForm.title" placeholder="Название *" required />
          <input v-model="mangaForm.author" placeholder="Автор" />
          <select v-model="mangaForm.status">
            <option value="ongoing">Онгоинг</option>
            <option value="completed">Завершена</option>
            <option value="hiatus">Хиатус</option>
          </select>
          <div class="modal-actions">
            <button type="submit" class="btn-primary">Сохранить</button>
            <button type="button" @click="closeMangaModal" class="btn-secondary">Отмена</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно: Глава -->
    <div v-if="showChapterModal" class="modal-overlay" @click.self="closeChapterModal">
      <div class="modal-card">
        <h3>{{ editingChapter ? 'Редактировать главу' : 'Добавить главу' }}</h3>
        <form @submit.prevent="saveChapter">
          <select v-model="chapterForm.manga_id">
            <option value="">Выберите мангу</option>
            <option v-for="m in mangaList" :key="m.id" :value="m.id">{{ m.title }}</option>
          </select>
          <input type="number" v-model.number="chapterForm.chapter_number" placeholder="Номер *" required />
          <input v-model="chapterForm.title" placeholder="Название" />
          <div class="modal-actions">
            <button type="submit" class="btn-primary">Сохранить</button>
            <button type="button" @click="closeChapterModal" class="btn-secondary">Отмена</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно: Категория форума -->
    <div v-if="showCategoryModal" class="modal-overlay" @click.self="closeCategoryModal">
      <div class="modal-card">
        <h3>{{ editingCategory ? 'Редактировать категорию' : 'Добавить категорию' }}</h3>
        <form @submit.prevent="saveCategory">
          <input v-model="categoryForm.name" placeholder="Название *" required />
          <input v-model="categoryForm.slug" placeholder="Slug *" required />
          <input v-model="categoryForm.description" placeholder="Описание" />
          <div class="modal-actions">
            <button type="submit" class="btn-primary">Сохранить</button>
            <button type="button" @click="closeCategoryModal" class="btn-secondary">Отмена</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно: Ответ пользователю -->
    <div v-if="showReplyModal" class="modal-overlay" @click.self="closeReplyModal">
      <div class="modal-card">
        <h3>Ответ пользователю {{ replyFeedback?.email }}</h3>
        <p class="original-message">{{ replyFeedback?.message }}</p>
        <textarea v-model="replyText" placeholder="Текст ответа" rows="5"></textarea>
        <div class="modal-actions">
          <button @click="sendReply" :disabled="!replyText.trim() || replySending" class="btn-primary">
            {{ replySending ? 'Отправка...' : 'Отправить' }}
          </button>
          <button @click="closeReplyModal" class="btn-secondary">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { adminAPI, mangaAPI, chaptersAPI, forumAPI } from '@/api'
import { getCoverUrl } from '@/utils/imageHelper'

const authStore = useAuthStore()
const activeTab = ref('manga')
const forumSubtab = ref('categories')

// Данные
const mangaList = ref([])
const users = ref([])
const chapters = ref([])
const chapterFilterId = ref('')
const categories = ref([])
const forumTopics = ref([])
const forumPosts = ref([])
const feedbacks = ref([])
const stats = reactive({ users: 0, manga: 0, totalViews: 0 })

const filteredChapters = computed(() => {
  if (!chapterFilterId.value) return chapters.value
  return chapters.value.filter(c => c.manga_id == chapterFilterId.value)
})

// Формы
const showMangaModal = ref(false)
const editingManga = ref(null)
const mangaForm = reactive({ title: '', author: '', status: 'ongoing' })

const showChapterModal = ref(false)
const editingChapter = ref(null)
const chapterForm = reactive({ manga_id: '', chapter_number: null, title: '' })

const showCategoryModal = ref(false)
const editingCategory = ref(null)
const categoryForm = reactive({ name: '', slug: '', description: '' })

const showReplyModal = ref(false)
const replyFeedback = ref(null)
const replyText = ref('')
const replySending = ref(false)

const uploadForm = reactive({ mangaId: '', chapterNumber: '', title: '', submitting: false, result: '' })
const zipFileInput = ref(null)
const excelFileInput = ref(null)
const importing = ref(false)
const importMessage = ref('')

// Вспомогательные
const statusText = (s) => ({ ongoing: 'Онгоинг', completed: 'Завершена', hiatus: 'Перерыв' }[s] || s)
const truncate = (text, n) => text?.length > n ? text.slice(0, n) + '…' : text
const formatDate = (d) => new Date(d).toLocaleDateString('ru-RU')
const getMangaTitle = (id) => mangaList.value.find(m => m.id == id)?.title || `ID ${id}`

// Загрузчики
const loadManga = async () => { try { mangaList.value = await mangaAPI.list({ limit: 100 }).then(d => d.manga || d) } catch {} }
const loadUsers = async () => { try { users.value = await adminAPI.getUsers() } catch {} }
const loadChapters = async () => { try { const params = {}; if (chapterFilterId.value) params.mangaId = chapterFilterId.value; chapters.value = (await chaptersAPI.list(params)).chapters || [] } catch {} }
const loadCategories = async () => { try { categories.value = await adminAPI.getForumCategories() } catch {} }
const loadForumTopics = async () => { try { const data = await adminAPI.getForumTopics({ limit: 100 }); forumTopics.value = data.topics || [] } catch {} }
const loadForumPosts = async () => { try { const data = await adminAPI.getForumPosts({ limit: 100 }); forumPosts.value = data.posts || [] } catch {} }
const loadFeedbacks = async () => { try { feedbacks.value = await adminAPI.getFeedback() } catch {} }
const loadStats = async () => { try { Object.assign(stats, await adminAPI.getStats()) } catch {} }

// Манга
const openMangaModal = (manga = null) => {
  editingManga.value = manga
  if (manga) { mangaForm.title = manga.title; mangaForm.author = manga.author || ''; mangaForm.status = manga.status }
  else { mangaForm.title = ''; mangaForm.author = ''; mangaForm.status = 'ongoing' }
  showMangaModal.value = true
}
const closeMangaModal = () => { showMangaModal.value = false }
const saveManga = async () => {
  try {
    if (editingManga.value) await adminAPI.updateManga(editingManga.value.id, mangaForm)
    else await adminAPI.createManga(mangaForm)
    closeMangaModal()
    loadManga()
  } catch (e) { alert('Ошибка: ' + e.message) }
}
const deleteManga = async (id) => { if (confirm('Удалить мангу?')) { await adminAPI.deleteManga(id); loadManga() } }

// Главы
const openChapterModal = (ch = null) => {
  editingChapter.value = ch
  if (ch) { chapterForm.manga_id = ch.manga_id; chapterForm.chapter_number = ch.chapter_number; chapterForm.title = ch.title || '' }
  else { chapterForm.manga_id = ''; chapterForm.chapter_number = null; chapterForm.title = '' }
  showChapterModal.value = true
}
const closeChapterModal = () => { showChapterModal.value = false }
const saveChapter = async () => {
  if (!chapterForm.manga_id || !chapterForm.chapter_number) return alert('Заполните поля')
  try {
    if (editingChapter.value) await chaptersAPI.update(editingChapter.value.id, chapterForm)
    else await chaptersAPI.create(chapterForm)
    closeChapterModal()
    loadChapters()
  } catch (e) { alert('Ошибка: ' + e.message) }
}
const deleteChapter = async (id) => { if (confirm('Удалить главу?')) { await chaptersAPI.delete(id); loadChapters() } }
const viewPages = async (ch) => {
  try { const data = await chaptersAPI.getPages(ch.id); alert(`Страниц: ${(data.pages || []).length}`) } catch { alert('Не удалось загрузить') }
}

// Пользователи
const updateRole = async (user) => { try { await adminAPI.updateUserRole(user.id, user.role) } catch {} }
const deleteUser = async (id) => { if (confirm('Удалить пользователя?')) { await adminAPI.deleteUser(id); loadUsers() } }

// Форум
const openCategoryModal = (cat = null) => {
  editingCategory.value = cat
  if (cat) { categoryForm.name = cat.name; categoryForm.slug = cat.slug; categoryForm.description = cat.description || '' }
  else { categoryForm.name = ''; categoryForm.slug = ''; categoryForm.description = '' }
  showCategoryModal.value = true
}
const closeCategoryModal = () => { showCategoryModal.value = false }
const saveCategory = async () => {
  try {
    if (editingCategory.value) await adminAPI.updateForumCategory(editingCategory.value.id, categoryForm)
    else await adminAPI.createForumCategory(categoryForm)
    closeCategoryModal()
    loadCategories()
  } catch (e) { alert('Ошибка: ' + e.message) }
}
const deleteCategory = async (id) => { if (confirm('Удалить категорию?')) { await adminAPI.deleteForumCategory(id); loadCategories() } }
const deleteTopic = async (id) => { if (confirm('Удалить тему?')) { await adminAPI.deleteForumTopic(id); loadForumTopics() } }
const deletePost = async (id) => { if (confirm('Удалить пост?')) { await adminAPI.deleteForumPost(id); loadForumPosts() } }

// Обратная связь
const openFeedbackReply = (fb) => {
  replyFeedback.value = fb
  replyText.value = ''
  showReplyModal.value = true
}
const closeReplyModal = () => { showReplyModal.value = false; replyFeedback.value = null }
const sendReply = async () => {
  if (!replyText.value.trim()) return
  replySending.value = true
  try {
    const res = await adminAPI.replyFeedback(replyFeedback.value.id, replyText.value)
    alert(res.message || 'Ответ отправлен')
    closeReplyModal()
    loadFeedbacks()
  } catch (e) {
    alert('Ошибка: ' + (e.message || 'Не удалось отправить ответ'))
  } finally {
    replySending.value = false
  }
}
const deleteFeedback = async (id) => { if (confirm('Удалить сообщение?')) { await adminAPI.deleteFeedback(id); loadFeedbacks() } }

// Загрузка ZIP
const uploadChapterZip = async () => {
  const file = zipFileInput.value?.files?.[0]
  if (!file) return alert('Выберите файл')
  uploadForm.submitting = true
  uploadForm.result = ''
  const formData = new FormData()
  formData.append('mangaId', uploadForm.mangaId)
  formData.append('chapterNumber', uploadForm.chapterNumber)
  formData.append('title', uploadForm.title)
  formData.append('pages', file)
  try {
    const res = await fetch('/api/admin/upload-chapter', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    uploadForm.result = 'Глава успешно загружена!'
    loadChapters()
  } catch (e) {
    uploadForm.result = 'Ошибка: ' + e.message
  } finally {
    uploadForm.submitting = false
  }
}

// Импорт Excel
const importExcel = async () => {
  const file = excelFileInput.value?.files?.[0]
  if (!file) return alert('Выберите файл')
  importing.value = true
  importMessage.value = ''
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await fetch('/api/admin/import-manga', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    importMessage.value = data.message
    loadManga()
  } catch (e) {
    importMessage.value = 'Ошибка: ' + e.message
  } finally {
    importing.value = false
  }
}

// Синхронизация
const syncAll = async () => { try { await adminAPI.syncAll(); alert('Синхронизация выполнена') } catch {} }

onMounted(() => {
  loadManga(); loadUsers(); loadChapters(); loadCategories(); loadForumTopics(); loadForumPosts(); loadFeedbacks(); loadStats()
})
</script>

<style scoped>
.admin-page { background: var(--color-background); min-height: 100vh; }
.admin-layout { display: grid; grid-template-columns: 220px 1fr; gap: 20px; max-width: 1400px; margin: 0 auto; padding: 20px; }
.sidebar { background: var(--color-panel); border-radius: 10px; padding: 20px; height: fit-content; }
.sidebar h2 { color: var(--color-primary); margin-bottom: 20px; }
.sidebar button { display: block; width: 100%; text-align: left; padding: 10px; background: none; border: none; color: white; margin-bottom: 5px; border-radius: 6px; cursor: pointer; font-size: 0.95rem; transition: background 0.2s; }
.sidebar button:hover { background: var(--color-panel-light); }
.sidebar button.active { background: var(--color-primary); font-weight: 600; }
.content { background: var(--color-panel); padding: 25px; border-radius: 10px; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h2 { color: var(--color-primary); margin: 0; }
.table-responsive { overflow-x: auto; border-radius: 8px; }
.table { width: 100%; border-collapse: collapse; background: var(--color-panel-light); }
.table th, .table td { padding: 10px; text-align: left; border-bottom: 1px solid var(--color-border); }
.table th { background: var(--color-panel); color: var(--color-secondary); font-weight: 600; text-transform: uppercase; font-size: 0.85rem; }

/* Кнопки */
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}
.btn-primary:hover { background: var(--color-primary-hover, #0c9624); }

.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-secondary);
  color: var(--color-secondary);
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary:hover { background: var(--color-secondary); color: white; }

.btn-sm {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
  background: var(--color-panel-light);
  color: white;
  font-weight: normal;
}
.btn-sm:hover { background: var(--color-primary); }
.btn-sm.danger { background: #f44336; }
.btn-sm.danger:hover { background: #d32f2f; }

.status { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: white; }
.status.ongoing { background: var(--color-primary); }
.status.completed { background: var(--color-secondary); }
.status.hiatus { background: #ff9800; }

/* Формы */
.form { display: flex; flex-direction: column; gap: 10px; max-width: 500px; }
.form input, .form select { padding: 8px; background: var(--color-panel-light); border: 1px solid var(--color-secondary); border-radius: 6px; color: white; }
.result-msg { padding: 8px; background: rgba(0,128,0,0.2); border-radius: 6px; }

/* Статистика */
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.stat-card { background: var(--color-panel-light); padding: 20px; text-align: center; border-radius: 8px; }
.stat-card span { display: block; color: var(--color-text-muted); }
.stat-card strong { font-size: 1.8rem; color: var(--color-primary); }

/* Табы форума */
.tab-nav { margin-bottom: 15px; display: flex; gap: 10px; }
.tab-nav button { background: var(--color-panel-light); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; }
.tab-nav button.active { background: var(--color-primary); }

/* Модальные окна */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: var(--color-panel); border-radius: 12px; padding: 25px; width: 90%; max-width: 600px; box-shadow: var(--shadow-heavy); }
.modal-card h3 { color: var(--color-primary); margin-bottom: 15px; }
.modal-card input, .modal-card select, .modal-card textarea { width: 100%; padding: 10px; margin-bottom: 15px; background: var(--color-panel-light); border: 1px solid var(--color-secondary); border-radius: 6px; color: white; font-family: inherit; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.original-message { background: var(--color-panel-light); border-radius: 8px; padding: 12px; margin-bottom: 15px; white-space: pre-wrap; }

.empty { text-align: center; color: var(--color-text-muted); padding: 30px; }
</style>