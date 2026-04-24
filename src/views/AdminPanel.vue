<template>
  <div class="admin-page">
    <div class="container">
      <h1>⚙️ Административная панель</h1>

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
                    <td class="actions-cell">
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
                <option v-for="m in mangaList" :key="m.id" :value="m.id">{{ m.title }}</option>
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
                    <td class="actions-cell">
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
                    <td class="actions-cell">
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

          <!-- ========== Вкладка Форум ========== -->
          <div v-if="activeTab === 'forum'" class="tab-pane">
            <h2>💬 Управление форумом</h2>
            
            <div class="forum-subtabs">
              <button @click="forumSubtab = 'categories'" :class="{ active: forumSubtab === 'categories' }">📁 Категории</button>
              <button @click="forumSubtab = 'topics'" :class="{ active: forumSubtab === 'topics' }">📌 Темы</button>
              <button @click="forumSubtab = 'posts'" :class="{ active: forumSubtab === 'posts' }">💬 Посты</button>
            </div>

            <!-- Категории -->
            <div v-if="forumSubtab === 'categories'" class="forum-pane">
              <div class="pane-header">
                <h3>Категории форума</h3>
                <button class="add-btn" @click="openCategoryModal()">➕ Новая категория</button>
              </div>
              <div v-if="categoriesLoading" class="loading">Загрузка...</div>
              <div v-else class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Иконка</th>
                      <th>Название</th>
                      <th>Slug</th>
                      <th>Тем</th>
                      <th>Сообщений</th>
                      <th>Порядок</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="cat in categories" :key="cat.id">
                      <td>{{ cat.id }}</td>
                      <td>{{ cat.icon || '📁' }}</td>
                      <td>{{ cat.name }}</td>
                      <td>{{ cat.slug }}</td>
                      <td>{{ cat.topicsCount || 0 }}</td>
                      <td>{{ cat.postsCount || 0 }}</td>
                      <td>{{ cat.order }}</td>
                      <td class="actions-cell">
                        <button class="edit-btn" @click="openCategoryModal(cat)">✏️</button>
                        <button class="delete-btn" @click="deleteCategory(cat.id)">🗑️</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Темы -->
            <div v-if="forumSubtab === 'topics'" class="forum-pane">
              <div class="filter-section">
                <label>Фильтр по категории:</label>
                <select v-model="topicFilterCategoryId" @change="loadTopics">
                  <option value="">Все категории</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>
              <div v-if="topicsLoading" class="loading">Загрузка...</div>
              <div v-else class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Категория</th>
                      <th>Заголовок</th>
                      <th>Автор</th>
                      <th>Просмотры</th>
                      <th>Посты</th>
                      <th>Закреплена</th>
                      <th>Закрыта</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="topic in topics" :key="topic.id">
                      <td>{{ topic.id }}</td>
                      <td>{{ topic.category?.name || '—' }}</td>
                      <td>{{ topic.title }}</td>
                      <td>{{ topic.author?.username || '—' }}</td>
                      <td>{{ topic.views }}</td>
                      <td>{{ topic.postsCount }}</td>
                      <td>{{ topic.isPinned ? '📌' : '—' }}</td>
                      <td>{{ topic.isLocked ? '🔒' : '—' }}</td>
                      <td class="actions-cell">
                        <button class="edit-btn" @click="togglePinTopic(topic)">{{ topic.isPinned ? '📌' : '📍' }}</button>
                        <button class="edit-btn" @click="toggleLockTopic(topic)">{{ topic.isLocked ? '🔓' : '🔒' }}</button>
                        <button class="delete-btn" @click="deleteTopic(topic.id)">🗑️</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <Pagination
                  v-if="topicsTotalPages > 1"
                  :current-page="topicsPage"
                  :total-pages="topicsTotalPages"
                  @page-change="changeTopicsPage"
                />
              </div>
            </div>

            <!-- Посты -->
            <div v-if="forumSubtab === 'posts'" class="forum-pane">
              <div class="filter-section">
                <label>Фильтр по теме (ID):</label>
                <input type="number" v-model.number="postFilterTopicId" placeholder="ID темы" @input="loadPosts" />
              </div>
              <div v-if="postsLoading" class="loading">Загрузка...</div>
              <div v-else class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Тема</th>
                      <th>Автор</th>
                      <th>Содержание</th>
                      <th>Лайки</th>
                      <th>Дата</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="post in posts" :key="post.id">
                      <td>{{ post.id }}</td>
                      <td>{{ post.topic?.title || '—' }}</td>
                      <td>{{ post.author?.username || '—' }}</td>
                      <td>{{ truncateText(post.content, 50) }}</td>
                      <td>{{ post.likes }}</td>
                      <td>{{ formatDate(post.createdAt) }}</td>
                      <td class="actions-cell">
                        <button class="delete-btn" @click="deletePost(post.id)">🗑️</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <Pagination
                  v-if="postsTotalPages > 1"
                  :current-page="postsPage"
                  :total-pages="postsTotalPages"
                  @page-change="changePostsPage"
                />
              </div>
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

          <!-- ========== Вкладка Сообщения ========== -->
          <div v-if="activeTab === 'feedback'" class="tab-pane">
            <h2>📬 Сообщения от пользователей</h2>
            <div v-if="feedbackLoading" class="loading">Загрузка...</div>
            <div v-else class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Имя</th>
                    <th>Email</th>
                    <th>Сообщение</th>
                    <th>Статус</th>
                    <th>Дата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="msg in feedbackList" :key="msg.id">
                    <td>{{ msg.id }}</td>
                    <td>{{ msg.name }}</td>
                    <td>{{ msg.email }}</td>
                    <td>{{ truncateText(msg.message, 50) }}</td>
                    <td>
                      <select v-model="msg.status" @change="updateFeedbackStatus(msg)" class="status-select">
                        <option value="new">Новое</option>
                        <option value="read">Прочитано</option>
                        <option value="replied">Отвечено</option>
                      </select>
                    </td>
                    <td>{{ formatDate(msg.created_at) }}</td>
                    <td class="actions-cell">
                      <button class="view-btn" @click="viewFeedback(msg)">Просмотр</button>
                      <button class="delete-btn" @click="deleteFeedback(msg.id)">Удалить</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ========== Загрузка главы ========== -->
          <div v-if="activeTab === 'upload'" class="tab-pane">
            <div class="pane-header">
              <h2>📤 Загрузка главы (ZIP)</h2>
            </div>
            <form @submit.prevent="uploadChapter" class="upload-form">
              <div class="form-row">
                <div class="form-group">
                  <label>ID манги</label>
                  <input v-model="upload.mangaId" type="number" placeholder="Например: 1" required />
                </div>
                <div class="form-group">
                  <label>Номер главы</label>
                  <input v-model="upload.chapterNumber" type="number" placeholder="Например: 5" required />
                </div>
              </div>
              <div class="form-group">
                <label>Название главы</label>
                <input v-model="upload.title" type="text" placeholder="Необязательно" />
              </div>
              <div class="form-group">
                <label>Архив со страницами (.zip)</label>
                <input type="file" accept=".zip" ref="zipFile" required />
              </div>
              <button type="submit" :disabled="uploading" class="submit-btn">
                {{ uploading ? 'Загрузка...' : 'Загрузить главу' }}
              </button>
              <p v-if="uploadMessage" class="result-msg">{{ uploadMessage }}</p>
            </form>
          </div>

          <!-- ========== Импорт Excel ========== -->
          <div v-if="activeTab === 'import'" class="tab-pane">
            <div class="pane-header">
              <h2>📥 Импорт манги из Excel</h2>
            </div>
            <form @submit.prevent="importExcel" class="upload-form">
              <div class="form-group">
                <label>Файл Excel (.xlsx, .xls)</label>
                <input type="file" accept=".xlsx,.xls" ref="excelFile" required />
              </div>
              <button type="submit" :disabled="importing" class="submit-btn">
                {{ importing ? 'Импорт...' : 'Загрузить и импортировать' }}
              </button>
              <p v-if="importMessage" class="result-msg">{{ importMessage }}</p>
            </form>
          </div>

          <!-- ========== Статистика ========== -->
          <div v-if="activeTab === 'stats'" class="tab-pane">
            <div class="pane-header">
              <h2>📊 Статистика сайта</h2>
              <button class="refresh-btn" @click="loadStats" :disabled="statsLoading">
                🔄 Обновить
              </button>
            </div>
            <div v-if="statsLoading" class="loading">Загрузка...</div>
            <div v-else class="stats-dashboard">
              <div class="stat-card">
                <h3>{{ stats.users }}</h3>
                <p>Пользователей</p>
              </div>
              <div class="stat-card">
                <h3>{{ stats.manga }}</h3>
                <p>Тайтлов</p>
              </div>
              <div class="stat-card">
                <h3>{{ stats.totalViews }}</h3>
                <p>Просмотров</p>
              </div>
            </div>
            <h3 class="popular-title">Популярные тайтлы</h3>
            <ul class="popular-list">
              <li v-for="m in stats.popular" :key="m.title">
                {{ m.title }} — {{ m.views }} просмотров
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно: Манга -->
    <div v-if="showMangaModal" class="modal-overlay">
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
            <label>Обложка (путь)</label>
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

    <!-- Модальное окно: Глава -->
    <div v-if="showChapterModal" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ editingChapter ? 'Редактировать главу' : 'Добавить главу' }}</h2>
        <form @submit.prevent="saveChapter">
          <div class="form-group">
            <label>Манга *</label>
            <select v-model="chapterForm.manga_id" required>
              <option value="">Выберите мангу</option>
              <option v-for="m in mangaList" :key="m.id" :value="m.id">{{ m.title }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Номер главы *</label>
            <input type="number" v-model.number="chapterForm.chapter_number" required min="1" />
          </div>
          <div class="form-group">
            <label>Название главы</label>
            <input v-model="chapterForm.title" />
          </div>
          <div class="modal-actions">
            <button type="submit" class="save-btn">Сохранить</button>
            <button type="button" class="cancel-btn" @click="closeChapterModal">Отмена</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно: Страницы главы -->
    <div v-if="showPagesModal" class="modal-overlay">
      <div class="modal-content pages-modal">
        <h2>📄 Страницы главы {{ pagesChapterTitle }}</h2>
        <div v-if="pagesLoading" class="loading">Загрузка страниц...</div>
        <div v-else class="pages-grid">
          <div v-for="page in pagesList" :key="page.page_number" class="page-item">
            <img :src="page.image_url" :alt="'Стр. ' + page.page_number" @error="handleImageError" />
            <span>{{ page.page_number }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="closePagesModal">Закрыть</button>
        </div>
      </div>
    </div>

    <!-- Модальное окно: Категория форума -->
    <div v-if="showCategoryModal" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ editingCategory ? 'Редактировать категорию' : 'Новая категория' }}</h2>
        <form @submit.prevent="saveCategory">
          <div class="form-group">
            <label>Название *</label>
            <input v-model="categoryForm.name" required />
          </div>
          <div class="form-group">
            <label>Slug *</label>
            <input v-model="categoryForm.slug" required />
          </div>
          <div class="form-group">
            <label>Описание</label>
            <textarea v-model="categoryForm.description" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>Иконка (эмодзи)</label>
            <input v-model="categoryForm.icon" placeholder="📁" />
          </div>
          <div class="form-group">
            <label>Порядок</label>
            <input type="number" v-model.number="categoryForm.order" />
          </div>
          <div class="modal-actions">
            <button type="submit" class="save-btn">Сохранить</button>
            <button type="button" class="cancel-btn" @click="closeCategoryModal">Отмена</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно: Просмотр сообщения -->
    <div v-if="showFeedbackModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Сообщение от {{ selectedFeedback.name }}</h3>
        <p><strong>Email:</strong> {{ selectedFeedback.email }}</p>
        <p><strong>Дата:</strong> {{ formatDate(selectedFeedback.created_at) }}</p>
        <div class="message-body">{{ selectedFeedback.message }}</div>
        <div class="reply-section">
          <textarea v-model="replyText" placeholder="Ответить пользователю..."></textarea>
          <button @click="sendReply" :disabled="!replyText.trim() || replySending">Отправить ответ</button>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="closeFeedbackModal">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { mangaAPI, chaptersAPI, adminAPI, forumAPI } from '@/api';
import { getCoverUrl, handleImageError } from '@/utils/imageHelper';
import Pagination from '@/components/catalog/Pagination.vue';

const authStore = useAuthStore();

const activeTab = ref('manga');
const tabs = [
  { id: 'manga', name: '📚 Манга' },
  { id: 'chapters', name: '📖 Главы' },
  { id: 'users', name: '👥 Пользователи' },
  { id: 'forum', name: '💬 Форум' },
  { id: 'sync', name: '🔄 Синхронизация' },
  { id: 'feedback', name: '📬 Сообщения' },
  { id: 'upload', name: '📤 Загрузка главы' },
  { id: 'import', name: '📥 Импорт Excel' },
  { id: 'stats', name: '📊 Статистика' },
];

// --- Манга ---
const mangaList = ref([]);
const mangaLoading = ref(false);
const showMangaModal = ref(false);
const editingManga = ref(null);
const mangaForm = reactive({
  title: '', description: '', author: '', cover_image: '', status: 'ongoing', genresInput: '', year: null
});

const loadManga = async () => {
  mangaLoading.value = true;
  try {
    const data = await mangaAPI.list({ limit: 100 });
    mangaList.value = data.manga || data;
  } catch (e) { console.error(e); }
  finally { mangaLoading.value = false; }
};

const openMangaModal = (manga = null) => {
  editingManga.value = manga;
  if (manga) {
    mangaForm.title = manga.title || '';
    mangaForm.description = manga.description || '';
    mangaForm.author = manga.author || '';
    mangaForm.cover_image = manga.coverImage || manga.cover_image || '';
    mangaForm.status = manga.status || 'ongoing';
    mangaForm.genresInput = (manga.genres || []).join(', ');
    mangaForm.year = manga.year || null;
  } else {
    Object.assign(mangaForm, { title: '', description: '', author: '', cover_image: '', status: 'ongoing', genresInput: '', year: null });
  }
  showMangaModal.value = true;
};

const closeMangaModal = () => { showMangaModal.value = false; };

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
    if (editingManga.value) await adminAPI.updateManga(editingManga.value.id, data);
    else await adminAPI.createManga(data);
    closeMangaModal();
    loadManga();
  } catch (e) { alert('Ошибка сохранения манги: ' + e.message); }
};

const deleteManga = async (id) => {
  if (!confirm('Удалить мангу?')) return;
  try { await adminAPI.deleteManga(id); loadManga(); }
  catch (e) { alert('Ошибка удаления'); }
};

// --- Главы ---
const chaptersList = ref([]);
const chaptersLoading = ref(false);
const chapterFilterMangaId = ref('');
const showChapterModal = ref(false);
const editingChapter = ref(null);
const chapterForm = reactive({ manga_id: '', chapter_number: null, title: '' });
const showPagesModal = ref(false);
const pagesList = ref([]);
const pagesLoading = ref(false);
const pagesChapterTitle = ref('');

const filteredChapters = computed(() => {
  if (!chapterFilterMangaId.value) return chaptersList.value;
  return chaptersList.value.filter(ch => ch.manga_id == chapterFilterMangaId.value);
});

const loadChapters = async () => {
  chaptersLoading.value = true;
  try {
    const params = {};
    if (chapterFilterMangaId.value) params.mangaId = chapterFilterMangaId.value;
    const data = await chaptersAPI.list(params);
    chaptersList.value = data.chapters || [];
  } catch (e) { console.error(e); }
  finally { chaptersLoading.value = false; }
};

const openChapterModal = (chapter = null) => {
  editingChapter.value = chapter;
  if (chapter) {
    chapterForm.manga_id = chapter.manga_id;
    chapterForm.chapter_number = chapter.chapter_number;
    chapterForm.title = chapter.title || '';
  } else {
    chapterForm.manga_id = '';
    chapterForm.chapter_number = null;
    chapterForm.title = '';
  }
  showChapterModal.value = true;
};

const closeChapterModal = () => { showChapterModal.value = false; };

const saveChapter = async () => {
  if (!chapterForm.manga_id || !chapterForm.chapter_number) return alert('Заполните обязательные поля');
  const data = {
    manga_id: chapterForm.manga_id,
    chapter_number: chapterForm.chapter_number,
    title: chapterForm.title,
  };
  try {
    if (editingChapter.value) await chaptersAPI.update(editingChapter.value.id, data);
    else await chaptersAPI.create(data);
    closeChapterModal();
    loadChapters();
  } catch (e) { alert('Ошибка сохранения главы'); }
};

const deleteChapter = async (id) => {
  if (!confirm('Удалить главу?')) return;
  try { await chaptersAPI.delete(id); loadChapters(); }
  catch (e) { alert('Ошибка удаления'); }
};

const viewChapterPages = async (chapter) => {
  pagesChapterTitle.value = `Глава ${chapter.chapter_number}${chapter.title ? ' — ' + chapter.title : ''}`;
  pagesLoading.value = true;
  showPagesModal.value = true;
  try {
    const data = await chaptersAPI.getPages(chapter.id);
    pagesList.value = data.pages || [];
  } catch (e) { alert('Не удалось загрузить страницы'); pagesList.value = []; }
  finally { pagesLoading.value = false; }
};

const closePagesModal = () => { showPagesModal.value = false; pagesList.value = []; };

// --- Пользователи ---
const userList = ref([]);
const usersLoading = ref(false);
const loadUsers = async () => {
  usersLoading.value = true;
  try { userList.value = await adminAPI.getUsers(); }
  catch (e) { console.error(e); }
  finally { usersLoading.value = false; }
};

const updateUserRole = async (user) => {
  try { await adminAPI.updateUserRole(user.id, user.role); }
  catch (e) { alert('Не удалось обновить роль'); loadUsers(); }
};

const deleteUser = async (id) => {
  if (!confirm('Удалить пользователя?')) return;
  try { await adminAPI.deleteUser(id); loadUsers(); }
  catch (e) { alert('Ошибка удаления'); }
};

// --- Форум ---
const forumSubtab = ref('categories');
const categories = ref([]);
const categoriesLoading = ref(false);
const showCategoryModal = ref(false);
const editingCategory = ref(null);
const categoryForm = reactive({ name: '', slug: '', description: '', icon: '📁', order: 1 });

const topics = ref([]);
const topicsLoading = ref(false);
const topicFilterCategoryId = ref('');
const topicsPage = ref(1);
const topicsTotal = ref(0);
const topicsLimit = 20;
const topicsTotalPages = computed(() => Math.ceil(topicsTotal.value / topicsLimit));

const posts = ref([]);
const postsLoading = ref(false);
const postFilterTopicId = ref(null);
const postsPage = ref(1);
const postsTotal = ref(0);
const postsLimit = 20;
const postsTotalPages = computed(() => Math.ceil(postsTotal.value / postsLimit));

const loadCategories = async () => {
  categoriesLoading.value = true;
  try { categories.value = await adminAPI.getForumCategories(); }
  catch (e) { console.error(e); }
  finally { categoriesLoading.value = false; }
};

const openCategoryModal = (cat = null) => {
  editingCategory.value = cat;
  if (cat) {
    categoryForm.name = cat.name;
    categoryForm.slug = cat.slug;
    categoryForm.description = cat.description || '';
    categoryForm.icon = cat.icon || '📁';
    categoryForm.order = cat.order || 1;
  } else {
    categoryForm.name = ''; categoryForm.slug = ''; categoryForm.description = ''; categoryForm.icon = '📁'; categoryForm.order = 1;
  }
  showCategoryModal.value = true;
};

const closeCategoryModal = () => { showCategoryModal.value = false; };

const saveCategory = async () => {
  try {
    if (editingCategory.value) await adminAPI.updateForumCategory(editingCategory.value.id, categoryForm);
    else await adminAPI.createForumCategory(categoryForm);
    closeCategoryModal();
    loadCategories();
  } catch (e) { alert('Ошибка сохранения категории: ' + e.message); }
};

const deleteCategory = async (id) => {
  if (!confirm('Удалить категорию?')) return;
  try { await adminAPI.deleteForumCategory(id); loadCategories(); }
  catch (e) { alert('Ошибка удаления: ' + e.message); }
};

const loadTopics = async () => {
  topicsLoading.value = true;
  try {
    const params = { page: topicsPage.value, limit: topicsLimit };
    if (topicFilterCategoryId.value) params.categoryId = topicFilterCategoryId.value;
    const data = await adminAPI.getForumTopics(params);
    topics.value = data.topics || [];
    topicsTotal.value = data.total || 0;
  } catch (e) { console.error(e); }
  finally { topicsLoading.value = false; }
};

const changeTopicsPage = (page) => { topicsPage.value = page; loadTopics(); };

const togglePinTopic = async (topic) => {
  try { await adminAPI.updateForumTopic(topic.id, { isPinned: !topic.isPinned }); loadTopics(); }
  catch (e) { alert('Ошибка'); }
};

const toggleLockTopic = async (topic) => {
  try { await adminAPI.updateForumTopic(topic.id, { isLocked: !topic.isLocked }); loadTopics(); }
  catch (e) { alert('Ошибка'); }
};

const deleteTopic = async (id) => {
  if (!confirm('Удалить тему?')) return;
  try { await adminAPI.deleteForumTopic(id); loadTopics(); }
  catch (e) { alert('Ошибка удаления'); }
};

const loadPosts = async () => {
  postsLoading.value = true;
  try {
    const params = { page: postsPage.value, limit: postsLimit };
    if (postFilterTopicId.value) params.topicId = postFilterTopicId.value;
    const data = await adminAPI.getForumPosts(params);
    posts.value = data.posts || [];
    postsTotal.value = data.total || 0;
  } catch (e) { console.error(e); }
  finally { postsLoading.value = false; }
};

const changePostsPage = (page) => { postsPage.value = page; loadPosts(); };

const deletePost = async (id) => {
  if (!confirm('Удалить пост?')) return;
  try { await adminAPI.deleteForumPost(id); loadPosts(); }
  catch (e) { alert('Ошибка удаления'); }
};

// --- Синхронизация ---
const syncLoading = reactive({ all: false, pages: false });
const syncResult = ref(null);
const runSync = async (type) => {
  syncLoading[type] = true;
  syncResult.value = null;
  try {
    let data;
    if (type === 'all') data = await adminAPI.syncAll();
    else if (type === 'pages') data = await adminAPI.syncPages();
    syncResult.value = data;
    loadManga();
    loadChapters();
  } catch (e) { alert('Ошибка синхронизации: ' + e.message); }
  finally { syncLoading[type] = false; }
};

// --- Обратная связь ---
const feedbackList = ref([]);
const feedbackLoading = ref(false);
const showFeedbackModal = ref(false);
const selectedFeedback = ref(null);
const replyText = ref('');
const replySending = ref(false);

const loadFeedback = async () => {
  feedbackLoading.value = true;
  try { feedbackList.value = await adminAPI.getFeedback(); }
  catch (e) { console.error(e); }
  finally { feedbackLoading.value = false; }
};

const updateFeedbackStatus = async (msg) => {
  try { await adminAPI.updateFeedback(msg.id, { status: msg.status }); }
  catch (e) { alert('Ошибка обновления'); }
};

const deleteFeedback = async (id) => {
  if (!confirm('Удалить сообщение?')) return;
  try { await adminAPI.deleteFeedback(id); loadFeedback(); }
  catch (e) { alert('Ошибка удаления'); }
};

const viewFeedback = (msg) => {
  selectedFeedback.value = msg;
  replyText.value = '';
  showFeedbackModal.value = true;
};

const closeFeedbackModal = () => { showFeedbackModal.value = false; selectedFeedback.value = null; };

const sendReply = async () => {
  if (!replyText.value.trim()) return;
  replySending.value = true;
  try {
    await adminAPI.replyFeedback(selectedFeedback.value.id, replyText.value);
    alert('Ответ отправлен');
    replyText.value = '';
    selectedFeedback.value.status = 'replied';
    closeFeedbackModal();
    loadFeedback();
  } catch (e) { alert('Ошибка отправки'); }
  finally { replySending.value = false; }
};

// --- Загрузка главы ---
const upload = reactive({ mangaId: '', chapterNumber: '', title: '' });
const zipFile = ref(null);
const uploading = ref(false);
const uploadMessage = ref('');

const uploadChapter = async () => {
  if (!zipFile.value.files[0]) return alert('Выберите файл');
  uploading.value = true;
  uploadMessage.value = '';
  const formData = new FormData();
  formData.append('mangaId', upload.mangaId);
  formData.append('chapterNumber', upload.chapterNumber);
  formData.append('title', upload.title);
  formData.append('pages', zipFile.value.files[0]);
  try {
    const res = await fetch('/api/admin/upload-chapter', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    uploadMessage.value = 'Глава успешно загружена!';
  } catch (e) {
    uploadMessage.value = 'Ошибка: ' + e.message;
  } finally {
    uploading.value = false;
  }
};

// --- Импорт Excel ---
const excelFile = ref(null);
const importing = ref(false);
const importMessage = ref('');

const importExcel = async () => {
  if (!excelFile.value.files[0]) return alert('Выберите файл');
  importing.value = true;
  importMessage.value = '';
  const formData = new FormData();
  formData.append('file', excelFile.value.files[0]);
  try {
    const res = await fetch('/api/admin/import-manga', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    importMessage.value = data.message;
  } catch (e) {
    importMessage.value = 'Ошибка: ' + e.message;
  } finally {
    importing.value = false;
  }
};

// --- Статистика ---
const stats = reactive({ users: 0, manga: 0, totalViews: 0, popular: [] });
const statsLoading = ref(false);

const loadStats = async () => {
  statsLoading.value = true;
  try {
    const data = await adminAPI.getStats();
    Object.assign(stats, data);
  } catch (e) { console.error(e); }
  finally { statsLoading.value = false; }
};

// --- Вспомогательные ---
const getStatusText = (status) => {
  const map = { ongoing: 'Онгоинг', completed: 'Завершена', hiatus: 'Перерыв' };
  return map[status] || status;
};
const formatDate = (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '—';
const getMangaTitle = (mangaId) => {
  const manga = mangaList.value.find(m => m.id == mangaId);
  return manga ? manga.title : `ID: ${mangaId}`;
};
const truncateText = (text, max) => text && text.length > max ? text.slice(0, max) + '…' : text || '—';

// --- Наблюдатели и инициализация ---
watch(activeTab, (tab) => {
  if (tab === 'manga') loadManga();
  if (tab === 'chapters') loadChapters();
  if (tab === 'users') loadUsers();
  if (tab === 'forum') loadCategories();
  if (tab === 'feedback') loadFeedback();
  if (tab === 'stats') loadStats();
});

onMounted(() => {
  loadManga();
});
</script>

<style scoped>
/* ========== ОБЩИЕ СТИЛИ АДМИНКИ ========== */
.admin-page {
  background: var(--color-background, #000000);
  color: var(--color-text, #ffffff);
  min-height: 100vh;
  padding: 40px 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

h1 {
  color: var(--color-primary, #07660c);
  margin-bottom: 30px;
  text-align: center;
  font-size: 2.5rem;
}

/* ========== ВКЛАДКИ ========== */
.admin-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 30px;
  background: var(--color-panel, #202020);
  padding: 8px;
  border-radius: 12px;
}

.tab-btn {
  flex: 1 1 auto;
  padding: 10px 16px;
  background: #2B2B2B;
  border: none;
  color: #ffffff;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;
  font-size: 0.95rem;
}

.tab-btn.active {
  background: var(--color-primary, #07660c);
  color: #ffffff;
}

.tab-btn:hover:not(.active) {
  background: var(--color-secondary, #80832a);
}

/* ========== КОНТЕНТ ВКЛАДОК ========== */
.tab-content {
  background: var(--color-panel, #202020);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.pane-header h2 {
  color: var(--color-primary);
  margin: 0;
  font-size: 1.5rem;
}

.add-btn,
.refresh-btn {
  background: var(--color-primary, #07660c);
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  font-size: 0.95rem;
}

.add-btn:hover,
.refresh-btn:hover {
  background: #0a7e0f;
  transform: translateY(-1px);
}

/* ========== ТАБЛИЦЫ ========== */
.table-responsive {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid #2B2B2B;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: #2B2B2B;
}

.data-table th,
.data-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #404040;
}

.data-table th {
  background: #202020;
  color: var(--color-secondary, #80832a);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85rem;
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
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
}

.status-badge.ongoing { background: #07660c; }
.status-badge.completed { background: #80832a; }
.status-badge.hiatus { background: #ff9800; }

.actions-cell {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.edit-btn, .delete-btn, .view-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.edit-btn { background: #80832a; color: white; }
.delete-btn { background: #f44336; color: white; }
.view-btn { background: #07660c; color: white; }

.edit-btn:hover, .delete-btn:hover, .view-btn:hover {
  opacity: 0.9;
}

.role-select, .status-select {
  background: #202020;
  color: white;
  border: 1px solid #80832a;
  padding: 6px 10px;
  border-radius: 4px;
}

/* ========== ФОРМЫ ========== */
.upload-form {
  max-width: 700px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--color-text);
}

input[type="text"],
input[type="number"],
input[type="file"],
select,
textarea {
  width: 100%;
  padding: 12px;
  background: #2B2B2B;
  border: 1px solid var(--color-secondary, #80832a);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus, select:focus, textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(7, 102, 12, 0.2);
}

input[type="file"] {
  padding: 10px;
}

.submit-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
  font-size: 1rem;
}

.submit-btn:hover:not(:disabled) {
  background: #0a7e0f;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-msg {
  margin-top: 15px;
  padding: 12px 16px;
  background: rgba(128, 131, 42, 0.15);
  border-left: 4px solid var(--color-secondary);
  border-radius: 8px;
}

/* ========== СТАТИСТИКА ========== */
.stats-dashboard {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  flex: 1;
  background: #2B2B2B;
  padding: 30px 20px;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.2s, background 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
  background: #333;
}

.stat-card h3 {
  font-size: 2.8rem;
  color: var(--color-primary);
  margin: 0 0 8px;
  font-weight: 700;
}

.stat-card p {
  color: var(--color-text);
  opacity: 0.7;
  margin: 0;
  font-size: 1rem;
}

.popular-title {
  margin-top: 30px;
  margin-bottom: 15px;
  color: var(--color-primary);
}

.popular-list {
  list-style: none;
  padding: 0;
}

.popular-list li {
  background: #2B2B2B;
  padding: 12px 18px;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background 0.2s;
  display: flex;
  justify-content: space-between;
}

.popular-list li:hover {
  background: #333;
}

/* ========== ФОРУМ ВКЛАДКА ========== */
.forum-subtabs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  border-bottom: 1px solid #2B2B2B;
  padding-bottom: 10px;
}

.forum-subtabs button {
  background: transparent;
  border: none;
  color: var(--color-secondary);
  padding: 8px 16px;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 6px 6px 0 0;
  transition: background 0.2s, color 0.2s;
  font-weight: 500;
}

.forum-subtabs button:hover {
  background: #2B2B2B;
}

.forum-subtabs button.active {
  background: var(--color-primary);
  color: white;
}

/* ========== МОДАЛЬНЫЕ ОКНА ========== */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
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
  color: var(--color-primary);
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: var(--color-secondary);
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

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.save-btn, .cancel-btn {
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

.message-body {
  background: #2b2b2b;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
  white-space: pre-wrap;
}

.reply-section {
  margin: 20px 0;
}

.reply-section textarea {
  width: 100%;
  padding: 10px;
  background: #2b2b2b;
  border: 1px solid #80832a;
  color: white;
  border-radius: 6px;
  resize: vertical;
}

.reply-section button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #07660c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* ========== РАЗНОЕ ========== */
.loading {
  text-align: center;
  padding: 40px;
  color: var(--color-secondary);
  font-size: 1rem;
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
  border: 1px solid var(--color-secondary);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.sync-btn.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.sync-btn:hover:not(:disabled) {
  background: var(--color-secondary);
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
  color: var(--color-secondary);
}

.filter-section {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-section label {
  color: var(--color-secondary);
  white-space: nowrap;
}

.filter-section select,
.filter-section input {
  padding: 8px 12px;
  background: #2B2B2B;
  color: white;
  border: 1px solid #80832A;
  border-radius: 6px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .admin-tabs { flex-direction: column; }
  .stats-dashboard { flex-direction: column; }
  .pane-header { flex-direction: column; align-items: flex-start; gap: 10px; }
}
</style>