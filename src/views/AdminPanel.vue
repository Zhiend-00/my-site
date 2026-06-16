<template>
  <div class="admin-page">
    <div class="admin-layout">
      <aside class="sidebar">
        <h2>Админ-панель</h2>
        <nav>
          <button @click="activeTab = 'manga'" :class="{ active: activeTab === 'manga' }">
            <i class="fas fa-book nav-icon"></i> Манга
          </button>
          <button @click="activeTab = 'chapters'" :class="{ active: activeTab === 'chapters' }">
            <i class="fas fa-book-open nav-icon"></i> Главы
          </button>
          <button @click="activeTab = 'users'" :class="{ active: activeTab === 'users' }">
            <i class="fas fa-users nav-icon"></i> Пользователи
          </button>
          <button @click="activeTab = 'forum'" :class="{ active: activeTab === 'forum' }">
            <i class="fas fa-comments nav-icon"></i> Форум
          </button>
          <button @click="activeTab = 'feedback'" :class="{ active: activeTab === 'feedback' }">
            <i class="fas fa-envelope nav-icon"></i> Сообщения
          </button>
          <button @click="activeTab = 'upload'" :class="{ active: activeTab === 'upload' }">
            <i class="fas fa-upload nav-icon"></i> Загрузка главы
          </button>
          <button @click="activeTab = 'import'" :class="{ active: activeTab === 'import' }">
            <i class="fas fa-file-import nav-icon"></i> Импорт Excel
          </button>
          <button @click="activeTab = 'stats'" :class="{ active: activeTab === 'stats' }">
            <i class="fas fa-chart-line nav-icon"></i> Статистика
          </button>
        </nav>
      </aside>

      <main class="content">
        <!-- Манга -->
        <section v-if="activeTab === 'manga'">
          <div class="header-row">
            <h2>Управление мангой</h2>
            <button @click="openMangaModal()" class="btn-primary"><i class="fas fa-plus icon-outline-sm"></i> Добавить мангу</button>
          </div>
          <div class="table-responsive">
            <table v-if="mangaList.length" class="table">
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
                <tr v-for="m in mangaList" :key="m.id">
                  <td>{{ m.id }}</td>
                  <td><img :src="getCoverUrl(m.coverImage || m.cover_image)" class="cover-thumb" /></td>
                  <td>{{ m.title }}</td>
                  <td>{{ m.author || '—' }}</td>
                  <td><span :class="'status-badge ' + m.status">{{ getStatusText(m.status) }}</span></td>
                  <td>{{ m.chaptersCount || m.chapters_count || 0 }}</td>
                  <td class="actions">
                    <button @click="openMangaModal(m)" class="btn-sm edit"><i class="fas fa-edit"></i></button>
                    <button @click="deleteManga(m.id)" class="btn-sm delete"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty">Загрузка...</div>
          </div>
        </section>

        <!-- Главы -->
        <section v-if="activeTab === 'chapters'">
          <div class="header-row">
            <h2>Управление главами</h2>
            <button @click="openChapterModal()" class="btn-primary"><i class="fas fa-plus icon-outline-sm"></i> Добавить главу</button>
          </div>
          <div class="filter-row">
            <label>Фильтр по манге:</label>
            <select v-model="chapterFilterId" @change="loadChapters" class="form-select">
              <option value="">Все</option>
              <option v-for="m in mangaList" :key="m.id" :value="m.id">{{ m.title }}</option>
            </select>
          </div>
          <div class="table-responsive">
            <table v-if="filteredChapters.length" class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Манга</th>
                  <th>Номер главы</th>
                  <th>Название</th>
                  <th>Страниц</th>
                  <th>Просмотров</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ch in filteredChapters" :key="ch.id">
                  <td class="chapter-id">{{ ch.id }}</td>
                  <td><strong>{{ getMangaTitle(ch.manga_id) }}</strong></td>
                  <td><span class="chapter-number">Глава {{ ch.chapter_number }}</span></td>
                  <td>{{ ch.title || '—' }}</td>
                  <td class="pages-count">
                    <span v-if="loadingPages[ch.id]" class="loading-small"><i class="fas fa-spinner fa-spin icon-outline-sm"></i></span>
                    <span v-else-if="realPagesCount[ch.id] > 0" class="has-pages-real">{{ realPagesCount[ch.id] }}</span>
                    <span v-else class="no-pages">0</span>
                  </td>
                  <td><i class="far fa-eye icon-outline-sm"></i> {{ ch.views || 0 }}</td>
                  <td class="actions">
                    <button @click="openChapterModal(ch)" class="btn-sm edit"><i class="fas fa-edit"></i></button>
                    <button @click="deleteChapter(ch.id)" class="btn-sm delete"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty">Нет глав</div>
          </div>
        </section>

        <!-- Пользователи -->
        <section v-if="activeTab === 'users'">
          <h2>Пользователи</h2>
          <div class="table-responsive">
            <table v-if="users.length" class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Дата регистрации</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in users" :key="u.id">
                  <td>{{ u.id }}</td>
                  <td>{{ u.username }}</td>
                  <td>{{ u.email }}</td>
                  <td>
                    <select v-model="u.role" @change="updateRole(u)" :disabled="u.id === authStore.user?.id" class="form-select-sm">
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{{ formatDate(u.created_at) }}</td>
                  <td class="actions">
                    <button v-if="u.id !== authStore.user?.id" @click="deleteUser(u.id)" class="btn-sm delete"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty">Загрузка...</div>
          </div>
        </section>

        <!-- Форум -->
        <section v-if="activeTab === 'forum'">
          <h2>Управление форумом</h2>
          
          <div class="forum-admin-tabs">
            <button @click="switchForumTab('categories')" :class="{ active: forumSubtab === 'categories' }" class="forum-tab-btn"><i class="fas fa-folder icon-outline-sm"></i> Категории</button>
            <button @click="switchForumTab('topics')" :class="{ active: forumSubtab === 'topics' }" class="forum-tab-btn"><i class="fas fa-list icon-outline-sm"></i> Темы</button>
            <button @click="switchForumTab('posts')" :class="{ active: forumSubtab === 'posts' }" class="forum-tab-btn"><i class="fas fa-comment icon-outline-sm"></i> Посты</button>
            <button @click="switchForumTab('reviews')" :class="{ active: forumSubtab === 'reviews' }" class="forum-tab-btn"><i class="fas fa-star icon-outline-sm"></i> Рецензии</button>
          </div>

          <!-- Категории -->
          <div v-if="forumSubtab === 'categories'" class="forum-admin-section">
            <div class="section-header">
              <h3>Категории форума</h3>
              <button @click="openCategoryModal()" class="btn-primary"><i class="fas fa-plus icon-outline-sm"></i> Добавить категорию</button>
            </div>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Slug</th>
                    <th>Описание</th>
                    <th>Порядок</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="cat in forumCategories" :key="cat.id">
                    <td>{{ cat.id }}</td>
                    <td><strong>{{ cat.name }}</strong></td>
                    <td>{{ cat.slug }}</td>
                    <td>{{ cat.description || '—' }}</td>
                    <td>{{ cat.order || 0 }}</td>
                    <td class="actions">
                      <button @click="openCategoryModal(cat)" class="btn-sm edit"><i class="fas fa-edit"></i></button>
                      <button @click="deleteCategoryItem(cat.id)" class="btn-sm delete"><i class="fas fa-trash"></i></button>
                    </td>
                  </tr>
                </tbody>
                <tbody v-if="forumCategories.length === 0">
                  <tr>
                    <td colspan="6" class="empty-table">Нет категорий. Создайте первую!</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Темы -->
          <div v-if="forumSubtab === 'topics'" class="forum-admin-section">
            <div class="section-header">
              <h3>Темы форума</h3>
              <button @click="openTopicModal()" class="btn-primary"><i class="fas fa-plus icon-outline-sm"></i> Создать тему</button>
            </div>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Заголовок</th>
                    <th>Категория</th>
                    <th>Автор</th>
                    <th>Ответов</th>
                    <th>Просмотров</th>
                    <th>Дата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="topic in forumTopicsList" :key="topic.id">
                    <td>{{ topic.id }}</td>
                    <td><strong>{{ topic.title }}</strong></td>
                    <td>{{ getCategoryNameById(topic.category_id) }}</td>
                    <td>{{ topic.author?.username || 'Пользователь' }}</td>
                    <td>{{ getPostsCountForTopic(topic.id) }}</td>
                    <td>{{ topic.views || 0 }}</td>
                    <td>{{ formatDate(topic.created_at) }}</td>
                    <td class="actions">
                      <button @click="openTopicModal(topic)" class="btn-sm edit"><i class="fas fa-edit"></i></button>
                      <button @click="deleteTopicItem(topic.id)" class="btn-sm delete"><i class="fas fa-trash"></i></button>
                    </td>
                  </tr>
                </tbody>
                <tbody v-if="forumTopicsList.length === 0">
                  <tr>
                    <td colspan="8" class="empty-table">Нет тем. Создайте первую!</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Посты -->
          <div v-if="forumSubtab === 'posts'" class="forum-admin-section">
            <div class="section-header">
              <h3>Посты форума</h3>
            </div>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Содержание</th>
                    <th>Автор</th>
                    <th>Тема</th>
                    <th>Дата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="post in forumPostsList" :key="post.id">
                    <td>{{ post.id }}</td>
                    <td class="post-content-preview">{{ truncate(post.content, 60) }}</td>
                    <td>{{ post.author?.username || 'Пользователь' }}</td>
                    <td>{{ getTopicTitleById(post.topicId) }}</td>
                    <td>{{ formatDate(post.created_at) }}</td>
                    <td class="actions">
                      <button @click="deletePostItem(post.id)" class="btn-sm delete"><i class="fas fa-trash"></i></button>
                    </td>
                  </tr>
                </tbody>
                <tbody v-if="forumPostsList.length === 0">
                  <tr>
                    <td colspan="6" class="empty-table">Нет постов</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Рецензии -->
          <div v-if="forumSubtab === 'reviews'" class="forum-admin-section">
            <div class="section-header">
              <h3>Рецензии на модерации</h3>
            </div>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Манга</th>
                    <th>Пользователь</th>
                    <th>Оценка</th>
                    <th>Текст рецензии</th>
                    <th>Дата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="review in pendingReviews" :key="review.id">
                    <td>{{ review.id }}</td>
                    <td><strong>{{ review.mangaTitle }}</strong></td>
                    <td>{{ review.userName }}</td>
                    <td><span class="review-rating"><i class="fas fa-star icon-outline-sm" style="color: #ffcc00; -webkit-text-stroke: 1px #ffcc00;"></i> {{ review.rating }}</span></td>
                    <td class="review-content">
                      <span class="review-preview">{{ truncate(review.content, 50) }}</span>
                      <button @click="openReviewDetailModal(review)" class="btn-sm view" title="Просмотреть полностью"><i class="fas fa-eye"></i></button>
                    </td>
                    <td>{{ formatDate(review.createdAt) }}</td>
                    <td class="actions">
                      <button @click="approveReview(review.id)" class="btn-sm approve" title="Одобрить"><i class="fas fa-check"></i></button>
                      <button @click="rejectReview(review.id)" class="btn-sm reject" title="Отклонить"><i class="fas fa-times"></i></button>
                    </td>
                  </tr>
                </tbody>
                <tbody v-if="pendingReviews.length === 0">
                  <tr>
                    <td colspan="7" class="empty-table">Нет рецензий на модерации</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Сообщения обратной связи -->
        <section v-if="activeTab === 'feedback'">
          <h2>Сообщения от пользователей</h2>
          <div class="table-responsive">
            <table v-if="feedbacks.length" class="table">
              <thead>
                <tr><th>ID</th><th>Имя</th><th>Email</th><th>Сообщение</th><th>Статус</th><th>Действия</th></tr>
              </thead>
              <tbody>
                <tr v-for="fb in feedbacks" :key="fb.id">
                  <td>{{ fb.id }}</td>
                  <td>{{ fb.name }}</td>
                  <td>{{ fb.email }}</td>
                  <td>{{ truncate(fb.message, 50) }}</td>
                  <td><span :class="'status-badge ' + fb.status">{{ getFeedbackStatus(fb.status) }}</span></td>
                  <td class="actions">
                    <button @click="openFeedbackReply(fb)" class="btn-sm"><i class="fas fa-reply"></i></button>
                    <button @click="deleteFeedback(fb.id)" class="btn-sm delete"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty">Нет сообщений</div>
          </div>
        </section>

        <!-- Загрузка главы ZIP -->
        <section v-if="activeTab === 'upload'">
          <h2><i class="fas fa-upload icon-outline-sm"></i> Загрузка главы из ZIP архива</h2>
          <div class="upload-form">
            <div class="form-group"><label>Манга *</label><select v-model="uploadForm.mangaId" class="form-select"><option value="">Выберите мангу</option><option v-for="m in mangaList" :key="m.id" :value="m.id">{{ m.title }}</option></select></div>
            <div class="form-row"><div class="form-group"><label>Номер главы *</label><input type="number" v-model.number="uploadForm.chapterNumber" class="form-input" placeholder="например: 1" /></div><div class="form-group"><label>Название главы</label><input type="text" v-model="uploadForm.title" class="form-input" placeholder="Глава 1" /></div></div>
            <div class="form-group"><label>ZIP архив с изображениями *</label><div class="file-upload-area"><input type="file" ref="zipFileInput" accept=".zip" @change="handleZipFileSelect" class="file-input-hidden" /><button type="button" @click="$refs.zipFileInput.click()" class="btn-file"><i class="fas fa-folder-open icon-outline-sm"></i> Выбрать ZIP файл</button><span v-if="selectedFileName" class="file-name">{{ selectedFileName }}</span><span v-else class="file-name file-name-empty">Файл не выбран</span></div><p class="hint"><i class="fas fa-info-circle icon-outline-sm"></i> Поддерживаются файлы .zip с изображениями PNG, JPG, WEBP.</p></div>
            <button @click="uploadChapterZip" :disabled="uploadForm.submitting || !canUpload" class="btn-primary"><i class="fas fa-upload icon-outline-sm"></i> {{ uploadForm.submitting ? 'Загрузка...' : 'Загрузить главу' }}</button>
            <p v-if="uploadForm.result" class="result-msg" :class="{ error: uploadForm.result.includes('Ошибка') }">{{ uploadForm.result }}</p>
          </div>
        </section>

        <!-- Импорт Excel -->
        <section v-if="activeTab === 'import'">
          <h2><i class="fas fa-file-import icon-outline-sm"></i> Импорт манги из Excel</h2>
          <div class="upload-form">
            <div class="form-group"><label>Файл Excel (.xlsx)</label><div class="file-upload-area"><input type="file" ref="excelFileInput" accept=".xlsx,.xls" @change="handleExcelFileSelect" class="file-input-hidden" /><button type="button" @click="$refs.excelFileInput.click()" class="btn-file"><i class="fas fa-folder-open icon-outline-sm"></i> Выбрать Excel файл</button><span v-if="excelFileName" class="file-name">{{ excelFileName }}</span><span v-else class="file-name file-name-empty">Файл не выбран</span></div><p class="hint"><i class="fas fa-info-circle icon-outline-sm"></i> Поддерживаются файлы .xlsx, .xls.</p></div>
            <button @click="importMangaFromExcel" :disabled="importing || !excelFileName" class="btn-primary"><i class="fas fa-file-import icon-outline-sm"></i> {{ importing ? 'Импорт...' : 'Импортировать' }}</button>
            <p v-if="importMessage" class="result-msg" :class="{ error: importMessage.includes('Ошибка') }">{{ importMessage }}</p>
          </div>
        </section>

        <!-- Статистика -->
        <section v-if="activeTab === 'stats'">
          <h2><i class="fas fa-chart-line icon-outline-sm"></i> Статистика сайта</h2>
          <div class="stats-grid">
            <div class="stat-card"><span><i class="fas fa-users icon-outline-sm"></i> Пользователей</span><strong>{{ stats.users || 0 }}</strong></div>
            <div class="stat-card"><span><i class="fas fa-book icon-outline-sm"></i> Манги</span><strong>{{ stats.manga || 0 }}</strong></div>
            <div class="stat-card"><span><i class="fas fa-eye icon-outline-sm"></i> Просмотров</span><strong>{{ (stats.totalViews || 0).toLocaleString() }}</strong></div>
          </div>
          <div class="sync-section">
            <h3><i class="fas fa-sync icon-outline-sm"></i> Синхронизация</h3>
            <div class="sync-buttons">
              <button @click="syncPages" :disabled="syncing" class="btn-primary"><i class="fas fa-file-alt icon-outline-sm"></i> {{ syncing ? 'Синхронизация...' : 'Синхронизировать страницы' }}</button>
              <button @click="syncFull" :disabled="syncingFull" class="btn-primary"><i class="fas fa-sync-alt icon-outline-sm"></i> {{ syncingFull ? 'Полная синхронизация...' : 'Полная синхронизация' }}</button>
            </div>
            <div v-if="syncResult" class="sync-result" :class="{ success: syncResult.success, error: !syncResult.success }">
              <p>{{ syncResult.message }}</p>
              <p v-if="syncResult.updatedChapters !== undefined"><i class="fas fa-book icon-outline-sm"></i> Обновлено глав: {{ syncResult.updatedChapters }}</p>
              <p v-if="syncResult.totalPagesCreated !== undefined"><i class="fas fa-file icon-outline-sm"></i> Создано страниц: {{ syncResult.totalPagesCreated }}</p>
            </div>
          </div>
        </section>
      </main>
    </div>

    <!-- Модальные окна -->
    <div v-if="showMangaModal" class="modal-overlay" @click.self="closeMangaModal">
      <div class="modal-card">
        <h3><i class="fas fa-edit icon-outline-sm" style="color: var(--color-primary, #07660c); -webkit-text-stroke: 1.5px var(--color-primary, #07660c);"></i> {{ editingManga ? 'Редактировать мангу' : 'Добавить мангу' }}</h3>
        <form @submit.prevent="saveManga" class="manga-form">
          <div class="form-group"><label>Название *</label><input v-model="mangaForm.title" type="text" required class="form-input" /></div>
          <div class="form-group"><label>Альтернативные названия</label><input v-model="mangaForm.alternative_titles_str" placeholder="Название1, Название2" class="form-input" /></div>
          <div class="form-group"><label>Описание</label><textarea v-model="mangaForm.description" rows="4" class="form-textarea"></textarea></div>
          <div class="form-group">
            <label>Обложка</label>
            <div class="cover-upload">
              <div v-if="mangaForm.cover_image" class="cover-preview"><img :src="getCoverUrl(mangaForm.cover_image)" alt="Обложка" /><button type="button" @click="mangaForm.cover_image = ''" class="remove-cover"><i class="fas fa-times"></i></button></div>
              <div class="cover-upload-area"><input type="file" ref="coverInput" accept="image/*" @change="uploadCover" class="file-input-hidden" /><button type="button" @click="$refs.coverInput.click()" class="btn-file"><i class="fas fa-image icon-outline-sm"></i> Выбрать изображение</button><span class="hint">PNG, JPG до 5MB</span></div>
            </div>
          </div>
          <div class="form-row"><div class="form-group"><label>Автор</label><input v-model="mangaForm.author" class="form-input" /></div><div class="form-group"><label>Художник</label><input v-model="mangaForm.artist" class="form-input" /></div></div>
          <div class="form-row"><div class="form-group"><label>Статус</label><select v-model="mangaForm.status" class="form-select"><option value="ongoing">Онгоинг</option><option value="completed">Завершена</option><option value="hiatus">Перерыв</option><option value="cancelled">Отменена</option></select></div><div class="form-group"><label>Год</label><input type="number" v-model.number="mangaForm.year" class="form-input" /></div></div>
          <div class="form-group"><label>Жанры (через запятую)</label><input v-model="mangaForm.genres_str" placeholder="Экшен, Фэнтези, Комедия" class="form-input" /></div>
          <div class="modal-actions"><button type="submit" class="btn-primary"><i class="fas fa-save icon-outline-sm"></i> Сохранить</button><button type="button" @click="closeMangaModal" class="btn-secondary">Отмена</button></div>
        </form>
      </div>
    </div>

    <div v-if="showChapterModal" class="modal-overlay" @click.self="closeChapterModal">
      <div class="modal-card">
        <h3><i class="fas fa-edit icon-outline-sm" style="color: var(--color-primary, #07660c); -webkit-text-stroke: 1.5px var(--color-primary, #07660c);"></i> {{ editingChapter ? 'Редактировать главу' : 'Добавить главу' }}</h3>
        <form @submit.prevent="saveChapter">
          <div class="form-group"><label>Манга *</label><select v-model="chapterForm.manga_id" class="form-select" required><option value="">Выберите мангу</option><option v-for="m in mangaList" :key="m.id" :value="m.id">{{ m.title }}</option></select></div>
          <div class="form-row"><div class="form-group"><label>Номер главы *</label><input type="number" v-model.number="chapterForm.chapter_number" class="form-input" required placeholder="например: 1" /></div><div class="form-group"><label>Название главы</label><input v-model="chapterForm.title" class="form-input" placeholder="Глава 1 - Название" /></div></div>
          <div class="modal-actions"><button type="submit" class="btn-primary"><i class="fas fa-save icon-outline-sm"></i> Сохранить</button><button type="button" @click="closeChapterModal" class="btn-secondary">Отмена</button></div>
        </form>
      </div>
    </div>

    <!-- Модальное окно для категории -->
    <div v-if="showCategoryModal" class="modal-overlay" @click.self="closeCategoryModal">
      <div class="modal-card">
        <h3><i class="fas fa-folder icon-outline-sm" style="color: var(--color-primary, #07660c); -webkit-text-stroke: 1.5px var(--color-primary, #07660c);"></i> {{ editingCategory ? 'Редактировать категорию' : 'Добавить категорию' }}</h3>
        <form @submit.prevent="saveCategory">
          <div class="form-group">
            <label>Название *</label>
            <input v-model="categoryForm.name" type="text" required class="form-input" />
          </div>
          <div class="form-group">
            <label>Slug *</label>
            <input v-model="categoryForm.slug" type="text" required class="form-input" />
            <small class="form-hint">Уникальный идентификатор, например: manga-discussion</small>
          </div>
          <div class="form-group">
            <label>Описание</label>
            <textarea v-model="categoryForm.description" rows="3" class="form-textarea"></textarea>
          </div>
          <div class="form-group">
            <label>Иконка</label>
            <input v-model="categoryForm.icon" type="text" class="form-input" placeholder="fas fa-folder" />
          </div>
          <div class="form-group">
            <label>Порядок</label>
            <input v-model.number="categoryForm.order" type="number" class="form-input" />
          </div>
          <div class="modal-actions">
            <button type="submit" class="btn-primary"><i class="fas fa-save icon-outline-sm"></i> Сохранить</button>
            <button type="button" @click="closeCategoryModal" class="btn-secondary">Отмена</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно для темы -->
    <div v-if="showTopicModal" class="modal-overlay" @click.self="closeTopicModal">
      <div class="modal-card wide">
        <h3><i class="fas fa-list icon-outline-sm" style="color: var(--color-primary, #07660c); -webkit-text-stroke: 1.5px var(--color-primary, #07660c);"></i> {{ editingTopic ? 'Редактировать тему' : 'Создать тему' }}</h3>
        <form @submit.prevent="saveTopic">
          <div class="form-group">
            <label>Категория *</label>
            <select v-model="topicForm.category_id" class="form-select" required>
              <option value="">Выберите категорию</option>
              <option v-for="cat in forumCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Заголовок *</label>
            <input v-model="topicForm.title" type="text" required class="form-input" />
          </div>
          <div class="form-group">
            <label>Содержание *</label>
            <textarea v-model="topicForm.content" rows="6" required class="form-textarea"></textarea>
          </div>
          <div class="modal-actions">
            <button type="submit" class="btn-primary"><i class="fas fa-save icon-outline-sm"></i> Сохранить</button>
            <button type="button" @click="closeTopicModal" class="btn-secondary">Отмена</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Модальное окно просмотра рецензии -->
    <div v-if="showReviewDetailModal" class="modal-overlay" @click.self="closeReviewDetailModal">
      <div class="modal-content wide">
        <div class="modal-header">
          <h3><i class="fas fa-star icon-outline-sm" style="color: #ffcc00; -webkit-text-stroke: 1.5px #ffcc00;"></i> Рецензия на "{{ selectedReview?.mangaTitle }}"</h3>
          <button @click="closeReviewDetailModal" class="close-modal">&times;</button>
        </div>
        <div class="review-detail">
          <div class="review-detail-header">
            <div class="review-detail-author">
              <span class="author-name"><i class="fas fa-user icon-outline-sm"></i> {{ selectedReview?.userName }}</span>
              <span class="review-date"><i class="far fa-calendar-alt icon-outline-sm"></i> {{ formatDate(selectedReview?.createdAt) }}</span>
            </div>
            <div class="review-detail-rating">
              <span v-for="i in 10" :key="i" class="star-detail" :class="{ active: i <= (selectedReview?.rating || 0) }"><i class="fas fa-star"></i></span>
              <span class="rating-number">{{ selectedReview?.rating }}/10</span>
            </div>
          </div>
          <div class="review-detail-content">
            <p>{{ selectedReview?.content }}</p>
          </div>
          <div class="review-detail-actions">
            <button @click="approveReview(selectedReview?.id)" class="btn-sm approve"><i class="fas fa-check icon-outline-sm"></i> Одобрить</button>
            <button @click="rejectReview(selectedReview?.id)" class="btn-sm reject"><i class="fas fa-times icon-outline-sm"></i> Отклонить</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showReplyModal" class="modal-overlay" @click.self="closeReplyModal">
      <div class="modal-card">
        <h3><i class="fas fa-reply icon-outline-sm" style="color: var(--color-primary, #07660c); -webkit-text-stroke: 1.5px var(--color-primary, #07660c);"></i> Ответ пользователю {{ replyFeedback?.email }}</h3>
        <div class="original-message"><strong>Сообщение:</strong><p>{{ replyFeedback?.message }}</p></div>
        <div class="form-group"><label>Текст ответа *</label><textarea v-model="replyText" placeholder="Введите ваш ответ..." rows="5" class="form-textarea"></textarea></div>
        <div class="modal-actions"><button @click="sendReply" :disabled="!replyText.trim() || replySending" class="btn-primary"><i class="fas fa-paper-plane icon-outline-sm"></i> {{ replySending ? 'Отправка...' : 'Отправить ответ' }}</button><button @click="closeReplyModal" class="btn-secondary">Отмена</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { adminAPI, mangaAPI, chaptersAPI, getCoverUrl } from '@/api'

const authStore = useAuthStore()
const activeTab = ref('manga')
const forumSubtab = ref('categories')

const mangaList = ref([])
const users = ref([])
const chapters = ref([])
const chapterFilterId = ref('')
const categories = ref([])
const forumTopics = ref([])
const forumPosts = ref([])
const feedbacks = ref([])
const stats = reactive({ users: 0, manga: 0, totalViews: 0 })

// Переменные для форума в админ-панели
const forumCategories = ref([])
const forumTopicsList = ref([])
const forumPostsList = ref([])
const postsStoreData = ref({})
const showTopicModal = ref(false)
const editingTopic = ref(null)

// Переменные для рецензий
const pendingReviews = ref([])
const showReviewDetailModal = ref(false)
const selectedReview = ref(null)

const topicForm = reactive({
  category_id: '',
  title: '',
  content: ''
})

const realPagesCount = ref({})
const loadingPages = ref({})

const filteredChapters = computed(() => {
  if (!chapterFilterId.value) return chapters.value
  return chapters.value.filter(c => c.manga_id == chapterFilterId.value)
})

const checkRealPages = async (chapterId) => {
  if (realPagesCount.value[chapterId] !== undefined && realPagesCount.value[chapterId] !== null) return
  loadingPages.value[chapterId] = true
  try {
    const pagesData = await chaptersAPI.getPages(chapterId)
    const pagesCount = (pagesData.pages || []).length
    realPagesCount.value[chapterId] = pagesCount
    if (pagesCount === 0) {
      const chapter = chapters.value.find(c => c.id == chapterId)
      if (chapter && chapter.pages_count) realPagesCount.value[chapterId] = chapter.pages_count
    }
  } catch (err) {
    const chapter = chapters.value.find(c => c.id == chapterId)
    realPagesCount.value[chapterId] = (chapter && chapter.pages_count) ? chapter.pages_count : 0
  } finally {
    loadingPages.value[chapterId] = false
  }
}

const loadAllRealPages = async () => { for (const ch of chapters.value) await checkRealPages(ch.id) }

const getStatusText = (status) => ({ ongoing: 'Онгоинг', completed: 'Завершена', hiatus: 'Перерыв', cancelled: 'Отменена' }[status] || status)
const getFeedbackStatus = (status) => ({ new: 'Новое', read: 'Прочитано', replied: 'Отвечено' }[status] || status)
const truncate = (text, n) => text?.length > n ? text.slice(0, n) + '…' : text
const formatDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : ''
const getMangaTitle = (id) => mangaList.value.find(m => m.id == id)?.title || `ID ${id}`

const handleZipFileSelect = (event) => { selectedFileName.value = event.target.files[0]?.name || '' }
const handleExcelFileSelect = (event) => { excelFileName.value = event.target.files[0]?.name || '' }

const showMangaModal = ref(false)
const editingManga = ref(null)
const coverInput = ref(null)
const mangaForm = reactive({ title: '', alternative_titles_str: '', description: '', cover_image: '', author: '', artist: '', status: 'ongoing', year: new Date().getFullYear(), genres_str: '' })

const showChapterModal = ref(false)
const editingChapter = ref(null)
const chapterForm = reactive({ manga_id: '', chapter_number: null, title: '' })

const showCategoryModal = ref(false)
const editingCategory = ref(null)
const categoryForm = reactive({ name: '', slug: '', description: '', icon: '📚', order: 0 })

const showReplyModal = ref(false)
const replyFeedback = ref(null)
const replyText = ref('')
const replySending = ref(false)

const uploadForm = reactive({ mangaId: '', chapterNumber: '', title: '', submitting: false, result: '' })
const zipFileInput = ref(null)
const selectedFileName = ref('')

const excelFileInput = ref(null)
const excelFileName = ref('')
const importing = ref(false)
const importMessage = ref('')

const syncing = ref(false)
const syncingFull = ref(false)
const syncResult = ref(null)

const canUpload = computed(() => uploadForm.mangaId && uploadForm.chapterNumber && selectedFileName.value)

const loadManga = async () => { try { const data = await mangaAPI.list({ limit: 100 }); mangaList.value = data.manga || data } catch(e) { console.error(e) } }
const loadUsers = async () => { try { users.value = await adminAPI.getUsers() } catch (e) { console.error(e) } }
const loadChapters = async () => { try { const params = {}; if (chapterFilterId.value) params.mangaId = chapterFilterId.value; const data = await chaptersAPI.list(params); chapters.value = data.chapters || data || []; realPagesCount.value = {}; setTimeout(() => loadAllRealPages(), 300) } catch (e) { console.error(e); chapters.value = [] } }
const loadFeedbacks = async () => { try { feedbacks.value = await adminAPI.getFeedback() } catch (e) { console.error(e) } }
const loadStats = async () => { try { Object.assign(stats, await adminAPI.getStats()) } catch (e) { console.error(e) } }

// ========== ФУНКЦИИ ДЛЯ ФОРУМА ==========

const loadForumDataFromStorage = () => {
  loadCategories()
  const savedTopics = localStorage.getItem('forum_topics')
  if (savedTopics) {
    forumTopicsList.value = JSON.parse(savedTopics)
    forumTopicsList.value.sort((a, b) => b.id - a.id)
  } else { forumTopicsList.value = [] }
  
  const savedPosts = localStorage.getItem('forum_posts_store')
  if (savedPosts) {
    const postsData = JSON.parse(savedPosts)
    postsStoreData.value = postsData
    forumPostsList.value = []
    Object.keys(postsData).forEach(topicId => {
      const posts = postsData[topicId] || []
      posts.forEach(post => { forumPostsList.value.push({ ...post, topicId: parseInt(topicId) }) })
    })
    forumPostsList.value.sort((a, b) => b.id - a.id)
  } else { forumPostsList.value = [] }
}

const getPostsCountForTopic = (topicId) => postsStoreData.value[topicId]?.length || 0
const getTopicTitleById = (topicId) => { if (!topicId) return 'Неизвестно'; const topic = forumTopicsList.value.find(t => t.id === topicId); return topic?.title || 'Неизвестно' }
const getCategoryNameById = (id) => { if (!id) return 'Без категории'; const cat = forumCategories.value.find(c => c.id == id); return cat ? cat.name : 'Без категории' }

const switchForumTab = (tab) => { 
  forumSubtab.value = tab
  if (tab === 'categories') loadCategories()
  if (tab === 'topics') loadForumDataFromStorage()
  if (tab === 'posts') loadForumDataFromStorage()
  if (tab === 'reviews') loadPendingReviews()
}

const loadCategories = async () => { 
  try { 
    const data = await adminAPI.getForumCategories()
    categories.value = data
    forumCategories.value = data
  } catch (e) { 
    console.error(e)
    forumCategories.value = []
  } 
}

// ========== ФУНКЦИИ ДЛЯ РЕЦЕНЗИЙ ==========

const loadPendingReviews = () => {
  const saved = localStorage.getItem('pending_reviews')
  if (saved) {
    pendingReviews.value = JSON.parse(saved)
  } else {
    pendingReviews.value = []
  }
}

const openReviewDetailModal = (review) => {
  selectedReview.value = review
  showReviewDetailModal.value = true
}

const closeReviewDetailModal = () => {
  showReviewDetailModal.value = false
  selectedReview.value = null
}

const approveReview = (reviewId) => {
  const review = pendingReviews.value.find(r => r.id === reviewId)
  if (!review) return
  
  pendingReviews.value = pendingReviews.value.filter(r => r.id !== reviewId)
  localStorage.setItem('pending_reviews', JSON.stringify(pendingReviews.value))
  
  const approved = JSON.parse(localStorage.getItem('approved_reviews') || '[]')
  approved.push({ ...review, status: 'approved', approvedAt: new Date().toISOString() })
  localStorage.setItem('approved_reviews', JSON.stringify(approved))
  
  closeReviewDetailModal()
  alert('Рецензия одобрена и опубликована на странице манги')
}

const rejectReview = (reviewId) => {
  if (!confirm('Удалить рецензию?')) return
  pendingReviews.value = pendingReviews.value.filter(r => r.id !== reviewId)
  localStorage.setItem('pending_reviews', JSON.stringify(pendingReviews.value))
  closeReviewDetailModal()
  alert('Рецензия удалена')
}

// ========== КАТЕГОРИИ ==========

const openCategoryModal = (cat = null) => {
  editingCategory.value = cat
  if (cat) {
    categoryForm.name = cat.name || ''
    categoryForm.slug = cat.slug || ''
    categoryForm.description = cat.description || ''
    categoryForm.icon = cat.icon || '📚'
    categoryForm.order = cat.order || 0
  } else {
    categoryForm.name = ''; categoryForm.slug = ''; categoryForm.description = ''; categoryForm.icon = '📚'; categoryForm.order = 0
  }
  showCategoryModal.value = true
}

const closeCategoryModal = () => { showCategoryModal.value = false; editingCategory.value = null }

const saveCategory = async () => {
  try {
    if (!categoryForm.name.trim()) { alert('Введите название категории'); return }
    if (!categoryForm.slug.trim()) { categoryForm.slug = categoryForm.name.toLowerCase().replace(/[^a-zа-яё0-9]+/g, '-') }
    const data = { name: categoryForm.name, slug: categoryForm.slug, description: categoryForm.description, icon: categoryForm.icon, order: categoryForm.order }
    if (editingCategory.value) await adminAPI.updateForumCategory(editingCategory.value.id, data)
    else await adminAPI.createForumCategory(data)
    closeCategoryModal()
    await loadCategories()
  } catch (error) { console.error('Ошибка сохранения категории:', error); alert('Ошибка: ' + (error.message || 'Не удалось сохранить категорию')) }
}

const deleteCategoryItem = async (id) => {
  if (!confirm('Удалить категорию?')) return
  try { await adminAPI.deleteForumCategory(id); await loadCategories() } 
  catch (error) { console.error('Ошибка удаления категории:', error); alert('Ошибка: ' + (error.message || 'Не удалось удалить категорию')) }
}

// ========== ТЕМЫ ==========

const openTopicModal = (topic = null) => {
  editingTopic.value = topic
  if (topic) {
    topicForm.category_id = topic.category_id || ''
    topicForm.title = topic.title || ''
    topicForm.content = topic.content || ''
  } else {
    topicForm.category_id = ''; topicForm.title = ''; topicForm.content = ''
  }
  showTopicModal.value = true
}

const closeTopicModal = () => { showTopicModal.value = false; editingTopic.value = null }

const saveTopic = async () => {
  try {
    if (!topicForm.title.trim()) { alert('Введите заголовок темы'); return }
    if (!topicForm.content.trim()) { alert('Введите содержание темы'); return }
    
    const currentUser = authStore.user?.username || 'Админ'
    const newTopicId = Date.now()
    const newTopicData = { id: newTopicId, category_id: topicForm.category_id || null, title: topicForm.title, author: { username: currentUser }, created_at: new Date().toISOString(), views: 0 }
    
    const existingTopics = JSON.parse(localStorage.getItem('forum_topics') || '[]')
    existingTopics.unshift(newTopicData)
    localStorage.setItem('forum_topics', JSON.stringify(existingTopics))
    
    const postsStore = JSON.parse(localStorage.getItem('forum_posts_store') || '{}')
    postsStore[newTopicId] = [{ id: newTopicId + 1, author: { username: currentUser }, content: topicForm.content, created_at: new Date().toISOString(), likes: 0, is_liked: false }]
    localStorage.setItem('forum_posts_store', JSON.stringify(postsStore))
    
    closeTopicModal()
    loadForumDataFromStorage()
    window.dispatchEvent(new CustomEvent('forumDataUpdated'))
    alert('Тема успешно создана!')
  } catch (error) { console.error('Ошибка сохранения темы:', error); alert('Ошибка: ' + (error.message || 'Не удалось сохранить тему')) }
}

const deleteTopicItem = async (id) => {
  if (!confirm('Удалить тему? Все посты в теме также будут удалены.')) return
  const existingTopics = JSON.parse(localStorage.getItem('forum_topics') || '[]')
  const updatedTopics = existingTopics.filter(t => t.id !== id)
  localStorage.setItem('forum_topics', JSON.stringify(updatedTopics))
  const postsStore = JSON.parse(localStorage.getItem('forum_posts_store') || '{}')
  delete postsStore[id]
  localStorage.setItem('forum_posts_store', JSON.stringify(postsStore))
  loadForumDataFromStorage()
  window.dispatchEvent(new CustomEvent('forumDataUpdated'))
  alert('Тема удалена')
}

// ========== ПОСТЫ ==========

const deletePostItem = async (id) => {
  if (!confirm('Удалить пост?')) return
  const postsStore = JSON.parse(localStorage.getItem('forum_posts_store') || '{}')
  for (const [topicId, posts] of Object.entries(postsStore)) {
    const postIndex = posts.findIndex(p => p.id === id)
    if (postIndex !== -1) { posts.splice(postIndex, 1); postsStore[topicId] = posts; break }
  }
  localStorage.setItem('forum_posts_store', JSON.stringify(postsStore))
  loadForumDataFromStorage()
  window.dispatchEvent(new CustomEvent('forumDataUpdated'))
  alert('Пост удален')
}

// ========== МАНГА ==========

const openMangaModal = (manga = null) => {
  editingManga.value = manga
  if (manga) {
    mangaForm.title = manga.title || ''
    mangaForm.alternative_titles_str = (manga.alternativeTitles || manga.alternative_titles || []).join(', ')
    mangaForm.description = manga.description || ''
    mangaForm.cover_image = manga.coverImage || manga.cover_image || ''
    mangaForm.author = manga.author || ''
    mangaForm.artist = manga.artist || ''
    mangaForm.status = manga.status || 'ongoing'
    mangaForm.year = manga.year || new Date().getFullYear()
    mangaForm.genres_str = (manga.genres || []).join(', ')
  } else {
    mangaForm.title = ''; mangaForm.alternative_titles_str = ''; mangaForm.description = ''; mangaForm.cover_image = ''
    mangaForm.author = ''; mangaForm.artist = ''; mangaForm.status = 'ongoing'; mangaForm.year = new Date().getFullYear(); mangaForm.genres_str = ''
  }
  showMangaModal.value = true
}

const closeMangaModal = () => { showMangaModal.value = false; editingManga.value = null }

const uploadCover = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('cover', file)
  try {
    const res = await fetch('/api/admin/upload-cover', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: formData })
    const data = await res.json()
    if (res.ok) mangaForm.cover_image = data.coverUrl
    else alert('Ошибка загрузки: ' + data.message)
  } catch (err) { alert('Ошибка загрузки обложки') }
}

const saveManga = async () => {
  try {
    const data = { title: mangaForm.title, alternative_titles: mangaForm.alternative_titles_str.split(',').map(s => s.trim()).filter(s => s), description: mangaForm.description, cover_image: mangaForm.cover_image, author: mangaForm.author, artist: mangaForm.artist, status: mangaForm.status, year: mangaForm.year, genres: mangaForm.genres_str.split(',').map(g => g.trim()).filter(g => g) }
    if (editingManga.value) await adminAPI.updateManga(editingManga.value.id, data)
    else await adminAPI.createManga(data)
    closeMangaModal()
    await loadManga()
  } catch (err) { alert('Ошибка: ' + err.message) }
}

const deleteManga = async (id) => { if (confirm('Удалить мангу?')) { await adminAPI.deleteManga(id); await loadManga() } }

const openChapterModal = (ch = null) => {
  editingChapter.value = ch
  if (ch) { chapterForm.manga_id = ch.manga_id; chapterForm.chapter_number = ch.chapter_number; chapterForm.title = ch.title || '' }
  else { chapterForm.manga_id = ''; chapterForm.chapter_number = null; chapterForm.title = '' }
  showChapterModal.value = true
}

const closeChapterModal = () => { showChapterModal.value = false }

const saveChapter = async () => {
  if (!chapterForm.manga_id) { alert('Выберите мангу'); return }
  if (!chapterForm.chapter_number || chapterForm.chapter_number <= 0) { alert('Введите корректный номер главы'); return }
  if (!editingChapter.value) {
    const existing = chapters.value.find(ch => ch.manga_id == chapterForm.manga_id && ch.chapter_number == chapterForm.chapter_number)
    if (existing) { alert(`Глава ${chapterForm.chapter_number} уже существует в этой манге!`); return }
  }
  try {
    const data = { manga_id: chapterForm.manga_id, chapter_number: chapterForm.chapter_number, title: chapterForm.title || `Глава ${chapterForm.chapter_number}` }
    if (editingChapter.value) await chaptersAPI.update(editingChapter.value.id, data)
    else await chaptersAPI.create(data)
    closeChapterModal()
    await loadChapters()
    await loadManga()
  } catch (e) { alert('Ошибка: ' + e.message) }
}

const deleteChapter = async (id) => { if (confirm('Удалить главу?')) { await chaptersAPI.delete(id); loadChapters(); loadManga() } }

const updateRole = async (user) => { try { await adminAPI.updateUserRole(user.id, user.role) } catch(e) { console.error(e) } }
const deleteUser = async (id) => { if (confirm('Удалить пользователя?')) { await adminAPI.deleteUser(id); loadUsers() } }

const openFeedbackReply = (fb) => { replyFeedback.value = fb; replyText.value = ''; showReplyModal.value = true }
const closeReplyModal = () => { showReplyModal.value = false; replyFeedback.value = null }

const sendReply = async () => {
  if (!replyText.value.trim()) return
  replySending.value = true
  try {
    const res = await adminAPI.replyFeedback(replyFeedback.value.id, replyText.value)
    alert(res.message || 'Ответ отправлен')
    closeReplyModal()
    loadFeedbacks()
  } catch (e) { alert('Ошибка: ' + (e.message || 'Не удалось отправить ответ')) }
  finally { replySending.value = false }
}

const deleteFeedback = async (id) => { if (confirm('Удалить сообщение?')) { await adminAPI.deleteFeedback(id); loadFeedbacks() } }

const uploadChapterZip = async () => {
  const file = zipFileInput.value?.files?.[0]
  if (!file) { uploadForm.result = '❌ Выберите ZIP файл'; return }
  if (!uploadForm.mangaId) { uploadForm.result = '❌ Выберите мангу'; return }
  if (!uploadForm.chapterNumber) { uploadForm.result = '❌ Введите номер главы'; return }
  uploadForm.submitting = true
  uploadForm.result = ''
  const formData = new FormData()
  formData.append('mangaId', uploadForm.mangaId); formData.append('chapterNumber', uploadForm.chapterNumber); formData.append('title', uploadForm.title || `Глава ${uploadForm.chapterNumber}`); formData.append('pages', file)
  try {
    const res = await fetch('/api/admin/upload-chapter', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: formData })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    uploadForm.result = '✅ ' + data.message
    uploadForm.mangaId = ''; uploadForm.chapterNumber = ''; uploadForm.title = ''; selectedFileName.value = ''
    if (zipFileInput.value) zipFileInput.value.value = ''
    await loadManga(); await loadChapters()
  } catch (err) { uploadForm.result = '❌ Ошибка: ' + err.message }
  finally { uploadForm.submitting = false }
}

const importMangaFromExcel = async () => {
  const file = excelFileInput.value?.files?.[0]
  if (!file) { importMessage.value = '❌ Выберите файл'; return }
  importing.value = true
  importMessage.value = ''
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await fetch('/api/admin/import-manga', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: formData })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    importMessage.value = '✅ ' + data.message
    excelFileName.value = ''
    if (excelFileInput.value) excelFileInput.value.value = ''
    await loadManga()
  } catch (err) { importMessage.value = '❌ Ошибка: ' + err.message }
  finally { importing.value = false }
}

const syncPages = async () => {
  syncing.value = true
  syncResult.value = null
  try {
    const res = await fetch('/api/admin/sync-pages', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    const data = await res.json()
    syncResult.value = data
    if (data.success) { await loadChapters(); await loadManga() }
  } catch (err) { syncResult.value = { success: false, message: 'Ошибка: ' + err.message } }
  finally { syncing.value = false }
}

const syncFull = async () => {
  syncingFull.value = true
  syncResult.value = null
  try {
    const res = await fetch('/api/admin/sync', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
    const data = await res.json()
    syncResult.value = data
    if (data.success) { await loadChapters(); await loadManga() }
  } catch (err) { syncResult.value = { success: false, message: 'Ошибка: ' + err.message } }
  finally { syncingFull.value = false }
}

onMounted(() => {
  loadManga(); loadUsers(); loadChapters(); loadCategories(); loadForumDataFromStorage(); loadFeedbacks(); loadStats(); loadPendingReviews()
  window.addEventListener('forumDataUpdated', loadForumDataFromStorage)
  window.addEventListener('reviewsUpdated', loadPendingReviews)
})

onUnmounted(() => {
  window.removeEventListener('forumDataUpdated', loadForumDataFromStorage)
  window.removeEventListener('reviewsUpdated', loadPendingReviews)
})
</script>

<style scoped>
.admin-page { background: var(--color-background, #0a0a0a); min-height: 100vh; }
.admin-layout { display: grid; grid-template-columns: 260px 1fr; gap: 20px; max-width: 1600px; margin: 0 auto; padding: 20px; }
.sidebar { background: var(--color-panel, #1a1a1a); border-radius: 12px; padding: 20px; height: fit-content; position: sticky; top: 80px; border: 1px solid rgba(128, 131, 42, 0.2); }
.sidebar h2 { color: var(--color-primary, #07660c); margin-bottom: 20px; font-size: 1.3rem; padding-bottom: 10px; border-bottom: 2px solid var(--color-primary); }
.sidebar nav { display: flex; flex-direction: column; gap: 5px; }
.sidebar button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 15px; background: transparent; border: none; color: var(--color-text, #ffffff); border-radius: 8px; cursor: pointer; font-size: 0.95rem; transition: all 0.2s; text-align: left; }
.sidebar button:hover { background: rgba(128, 131, 42, 0.2); }
.sidebar button.active { background: var(--color-primary, #07660c); color: white; }
.content { background: var(--color-panel, #1a1a1a); border-radius: 12px; padding: 25px; border: 1px solid rgba(128, 131, 42, 0.2); }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
.content h2 { color: var(--color-primary, #07660c); margin: 0 0 20px 0; }
.filter-row { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
.filter-row label { color: var(--color-secondary, #9ea344); font-weight: 600; }
.table-responsive { overflow-x: auto; border-radius: 8px; }
.table { width: 100%; border-collapse: collapse; background: var(--color-panel-light, #2a2a2a); border-radius: 8px; overflow: hidden; }
.table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
.table th { background: rgba(128, 131, 42, 0.2); color: var(--color-secondary, #9ea344); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; }
.table tr:hover { background: rgba(255, 255, 255, 0.05); }
.cover-thumb { width: 40px; height: 56px; object-fit: cover; border-radius: 4px; background: var(--color-panel); }
.chapter-id { font-family: monospace; font-size: 0.8rem; color: var(--color-text-muted); }
.chapter-number { font-weight: 600; color: var(--color-primary); }
.pages-count .has-pages { color: #00cc44; font-weight: 600; }
.actions { white-space: nowrap; }
.btn-primary { background: var(--color-primary, #07660c); color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover, #0a8a10); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: transparent; border: 1px solid var(--color-secondary, #9ea344); color: var(--color-secondary); padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
.btn-secondary:hover { background: var(--color-secondary); color: white; }
.btn-file { background: rgba(128, 131, 42, 0.2); border: 1px solid var(--color-secondary); color: var(--color-secondary); padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
.btn-file:hover { background: var(--color-secondary); color: white; }
.btn-sm { padding: 5px 10px; background: rgba(255, 255, 255, 0.1); border: none; border-radius: 6px; cursor: pointer; margin-right: 5px; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; }
.btn-sm:hover { background: var(--color-primary); color: white; }
.btn-sm.edit:hover { background: var(--color-primary); color: white; }
.btn-sm.delete:hover { background: #dc3545; color: white; }
.btn-sm.approve { color: #00cc44; }
.btn-sm.approve:hover { background: #00cc44; color: white; }
.btn-sm.reject { color: #ff4444; }
.btn-sm.reject:hover { background: #ff4444; color: white; }
.btn-sm.view { color: #9ea344; }
.btn-sm.view:hover { background: #9ea344; color: white; }
.btn-icon-small { background: rgba(128, 131, 42, 0.2); border: 1px solid var(--color-secondary); color: var(--color-secondary); padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 0.7rem; transition: all 0.2s; margin-left: 6px; }
.btn-icon-small:hover { background: var(--color-secondary); color: white; }
.status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
.status-badge.ongoing { background: rgba(7, 102, 12, 0.2); color: #00cc44; border: 1px solid #00cc44; }
.status-badge.completed { background: rgba(0, 100, 255, 0.2); color: #0066ff; border: 1px solid #0066ff; }
.status-badge.hiatus { background: rgba(255, 165, 0, 0.2); color: #ffaa00; border: 1px solid #ffaa00; }
.status-badge.cancelled { background: rgba(255, 0, 0, 0.2); color: #ff4444; border: 1px solid #ff4444; }
.status-badge.new { background: rgba(255, 165, 0, 0.2); color: #ffaa00; border: 1px solid #ffaa00; }
.status-badge.read { background: rgba(0, 100, 255, 0.2); color: #0066ff; border: 1px solid #0066ff; }
.status-badge.replied { background: rgba(7, 102, 12, 0.2); color: #00cc44; border: 1px solid #00cc44; }
.upload-form, .manga-form { max-width: 600px; display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { color: var(--color-secondary, #9ea344); font-weight: 600; font-size: 0.9rem; }
.form-input, .form-select, .form-textarea { padding: 12px 15px; background: var(--color-panel-light, #2a2a2a); border: 1px solid rgba(128, 131, 42, 0.3); border-radius: 8px; color: var(--color-text, #ffffff); font-size: 0.95rem; transition: all 0.2s; }
.form-select-sm { padding: 5px 10px; background: var(--color-panel-light, #2a2a2a); border: 1px solid rgba(128, 131, 42, 0.3); border-radius: 6px; color: var(--color-text); }
.form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: var(--color-primary, #07660c); box-shadow: 0 0 0 2px rgba(7, 102, 12, 0.2); }
.form-textarea { resize: vertical; font-family: inherit; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.hint { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); margin-top: 5px; }
.file-upload-area { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.file-input-hidden { display: none; }
.file-name { padding: 8px 12px; background: var(--color-panel-light, #2a2a2a); border-radius: 6px; font-size: 0.9rem; color: var(--color-text); word-break: break-all; max-width: 300px; }
.file-name-empty { color: rgba(255, 255, 255, 0.4); }
.cover-upload { display: flex; flex-direction: column; gap: 10px; }
.cover-preview { position: relative; display: inline-block; width: 120px; }
.cover-preview img { width: 100%; height: auto; border-radius: 8px; border: 1px solid var(--color-secondary); }
.remove-cover { position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; background: #dc3545; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; }
.cover-upload-area { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
.result-msg { padding: 12px; background: rgba(7, 102, 12, 0.1); border-radius: 8px; color: #00cc44; border-left: 3px solid #00cc44; }
.result-msg.error { background: rgba(220, 53, 69, 0.1); color: #ff6b6b; border-left-color: #dc3545; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
.stat-card { background: var(--color-panel-light, #2a2a2a); padding: 20px; text-align: center; border-radius: 12px; border: 1px solid rgba(128, 131, 42, 0.2); }
.stat-card span { display: block; color: var(--color-text-muted, #aaa); font-size: 0.9rem; margin-bottom: 10px; }
.stat-card strong { font-size: 2rem; color: var(--color-primary, #07660c); }
.sync-section { margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(128, 131, 42, 0.3); }
.sync-section h3 { color: var(--color-primary); margin-bottom: 15px; }
.sync-buttons { display: flex; gap: 15px; flex-wrap: wrap; }
.sync-result { margin-top: 15px; padding: 15px; border-radius: 8px; }
.sync-result.success { background: rgba(7, 102, 12, 0.1); border-left: 4px solid #00cc44; color: #00cc44; }
.sync-result.error { background: rgba(220, 53, 69, 0.1); border-left: 4px solid #dc3545; color: #ff6b6b; }
.sync-result p { margin: 5px 0; }
.tab-nav { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.tab-nav button { background: var(--color-panel-light, #2a2a2a); border: none; color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.tab-nav button.active { background: var(--color-primary, #07660c); }
.sub-panel { margin-top: 15px; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 3000; }
.modal-card { background: var(--color-panel, #1a1a1a); border-radius: 16px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 25px; border: 1px solid rgba(128, 131, 42, 0.3); }
.modal-card h3 { color: var(--color-primary, #07660c); margin-bottom: 20px; font-size: 1.4rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); }
.original-message { background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 20px; }
.original-message p { margin-top: 8px; color: var(--color-text-muted); }
.empty { text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.5); }
.real-pages { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.has-pages-real { color: #00cc44; font-weight: 600; background: rgba(0, 204, 68, 0.1); padding: 2px 8px; border-radius: 12px; }
.no-pages { color: #ff4444; background: rgba(255, 68, 68, 0.1); padding: 2px 8px; border-radius: 12px; }
.loading-small { font-size: 0.8rem; animation: pulse 1s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* Стили для админ-панели форума */
.forum-admin-tabs { display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid rgba(128, 131, 42, 0.3); padding-bottom: 10px; flex-wrap: wrap; }
.forum-tab-btn { background: transparent; border: none; padding: 8px 20px; font-size: 0.95rem; cursor: pointer; color: var(--color-text-muted, #aaa); border-radius: 20px; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
.forum-tab-btn:hover { background: rgba(128, 131, 42, 0.2); color: var(--color-secondary, #9ea344); }
.forum-tab-btn.active { background: var(--color-primary, #07660c); color: white; }
.forum-admin-section { background: var(--color-panel, #1a1a1a); border-radius: 12px; padding: 20px; border: 1px solid rgba(128, 131, 42, 0.2); margin-top: 5px; }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
.section-header h3 { font-size: 1.2rem; color: var(--color-secondary, #9ea344); margin: 0; font-weight: 600; }
.section-header .btn-primary { background: var(--color-primary, #07660c); color: white; padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.2s; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; }
.section-header .btn-primary:hover { background: var(--color-primary-hover, #0a8a10); transform: translateY(-1px); }

.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th, .admin-table td { padding: 12px 10px; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.08); vertical-align: middle; }
.admin-table th { background: rgba(7, 102, 12, 0.15); color: var(--color-secondary, #9ea344); font-weight: 600; font-size: 0.8rem; white-space: nowrap; }
.admin-table td { font-size: 0.85rem; color: var(--color-text, #ffffff); }
.admin-table tr:hover td { background: rgba(255, 255, 255, 0.03); }

.admin-table .actions { white-space: nowrap; text-align: center; width: 80px; }
.admin-table .btn-sm { padding: 5px 10px; margin: 0 3px; background: rgba(255, 255, 255, 0.1); border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; }
.admin-table .btn-sm.edit { color: var(--color-secondary, #9ea344); }
.admin-table .btn-sm.edit:hover { background: var(--color-primary, #07660c); color: white; }
.admin-table .btn-sm.delete { color: #ff8888; }
.admin-table .btn-sm.delete:hover { background: #dc3545; color: white; }
.admin-table .btn-sm.approve { color: #00cc44; }
.admin-table .btn-sm.approve:hover { background: #00cc44; color: white; }
.admin-table .btn-sm.reject { color: #ff4444; }
.admin-table .btn-sm.reject:hover { background: #ff4444; color: white; }
.admin-table .btn-sm.view { color: #9ea344; }
.admin-table .btn-sm.view:hover { background: #9ea344; color: white; }

.review-preview { max-width: 200px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 8px; }
.review-content { white-space: nowrap; }

/* Модальное окно просмотра рецензии */
.modal-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 15px; margin-bottom: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
.modal-header h3 { color: var(--color-primary, #07660c); margin: 0; font-size: 1.3rem; }
.close-modal { background: none; border: none; font-size: 1.8rem; cursor: pointer; color: var(--color-text-muted, #aaa); padding: 0; line-height: 1; }
.close-modal:hover { color: #ff4444; }

.review-detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
.review-detail-author { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
.review-detail-author .author-name { font-weight: 600; color: #07660c; font-size: 1rem; display: inline-flex; align-items: center; gap: 6px; }
.review-detail-author .review-date { font-size: 0.75rem; color: #aaa; display: inline-flex; align-items: center; gap: 4px; }
.review-detail-rating { display: flex; align-items: center; gap: 8px; }
.star-detail { font-size: 1rem; color: #444; }
.star-detail.active { color: #ffcc00; }
.rating-number { font-size: 0.85rem; font-weight: 600; color: #9ea344; }
.review-detail-content { background: #2a2a2a; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
.review-detail-content p { margin: 0; line-height: 1.8; white-space: pre-wrap; }
.review-detail-actions { display: flex; justify-content: flex-end; gap: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1); }

.post-content-preview { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty-table { text-align: center; padding: 30px; color: var(--color-text-muted, #aaa); }

@media (max-width: 900px) {
  .section-header { flex-direction: column; align-items: flex-start; }
  .admin-table th, .admin-table td { padding: 8px 6px; font-size: 0.75rem; }
  .post-content-preview, .review-preview { max-width: 150px; }
  .review-content { white-space: normal; }
  .review-detail-header { flex-direction: column; align-items: flex-start; }
}

@media (max-width: 768px) {
  .forum-admin-tabs { gap: 5px; }
  .forum-tab-btn { padding: 6px 14px; font-size: 0.85rem; }
  .forum-admin-section { padding: 15px; }
  .section-header h3 { font-size: 1rem; }
  .section-header .btn-primary { padding: 6px 12px; font-size: 0.75rem; }
}

@media (max-width: 480px) {
  .post-content-preview, .review-preview { max-width: 100px; }
  .admin-table th, .admin-table td { padding: 6px 4px; font-size: 0.7rem; }
  .admin-table .btn-sm { padding: 3px 6px; font-size: 0.7rem; }
}

.form-hint {
  display: block;
  margin-top: 5px;
  font-size: 0.7rem;
  color: var(--color-text-muted, #aaa);
}

/* ===== СТИЛИ ДЛЯ ИКОНОК С ОБВОДКОЙ ===== */

/* Базовый стиль для всех иконок с обводкой */
.icon-outline {
  color: transparent;
  -webkit-text-stroke: 1.5px #ffffff;
  text-stroke: 1.5px #ffffff;
  font-size: 1.2rem;
}

/* Маленькие иконки */
.icon-outline-sm {
  color: transparent;
  -webkit-text-stroke: 1.2px #ffffff;
  text-stroke: 1.2px #ffffff;
  font-size: 0.9rem;
}

/* Иконки в сайдбаре */
.nav-icon {
  color: transparent;
  -webkit-text-stroke: 1.5px #ffffff;
  text-stroke: 1.5px #ffffff;
  font-size: 1.3rem;
  width: 1.8rem;
  text-align: center;
  display: inline-block;
  transition: all 0.3s ease;
}

/* Активная иконка в сайдбаре - белая заливка */
.sidebar button.active .nav-icon {
  color: #ffffff;
  -webkit-text-stroke: 0px;
  text-stroke: 0px;
}

/* При наведении на кнопку в сайдбаре */
.sidebar button:hover .nav-icon {
  color: #ffffff;
  -webkit-text-stroke: 0px;
  text-stroke: 0px;
}

/* Иконки в кнопках таблиц */
.table .btn-sm i,
.admin-table .btn-sm i {
  color: transparent;
  -webkit-text-stroke: 1.2px #ffffff;
  text-stroke: 1.2px #ffffff;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

/* При наведении на кнопки в таблицах */
.table .btn-sm:hover i,
.admin-table .btn-sm:hover i {
  color: #ffffff;
  -webkit-text-stroke: 0px;
  text-stroke: 0px;
}

/* Иконки в главных кнопках (btn-primary) */
.btn-primary i,
.btn-file i {
  color: transparent;
  -webkit-text-stroke: 1.2px #ffffff;
  text-stroke: 1.2px #ffffff;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.btn-primary:hover i,
.btn-file:hover i {
  color: #ffffff;
  -webkit-text-stroke: 0px;
  text-stroke: 0px;
}

/* Заголовки в модальных окнах */
.modal-card h3 i,
.modal-header h3 i {
  color: transparent;
  -webkit-text-stroke: 1.5px var(--color-primary, #07660c);
  text-stroke: 1.5px var(--color-primary, #07660c);
  margin-right: 8px;
}

/* Звездочки рейтинга */
.star-detail {
  color: transparent;
  -webkit-text-stroke: 1px #ffcc00;
  text-stroke: 1px #ffcc00;
  font-size: 1.2rem;
}
.star-detail.active {
  color: #ffcc00;
  -webkit-text-stroke: 0px;
  text-stroke: 0px;
}

/* Иконки в статистике */
.stat-card i {
  color: transparent;
  -webkit-text-stroke: 1.5px var(--color-primary, #07660c);
  text-stroke: 1.5px var(--color-primary, #07660c);
  font-size: 1.3rem;
}

/* Иконки в результатах синхронизации */
.sync-result i {
  color: transparent;
  -webkit-text-stroke: 1.2px currentColor;
  text-stroke: 1.2px currentColor;
}
.sync-result.success i {
  color: #00cc44;
  -webkit-text-stroke-color: #00cc44;
}
.sync-result.error i {
  color: #ff6b6b;
  -webkit-text-stroke-color: #ff6b6b;
}

/* Иконка спиннера загрузки */
.fa-spinner {
  color: #ffffff;
  -webkit-text-stroke: 0px;
  text-stroke: 0px;
}

/* Иконка глаза (просмотры) */
.fa-eye {
  color: transparent;
  -webkit-text-stroke: 1.2px #ffffff;
  text-stroke: 1.2px #ffffff;
}

/* Кнопки Approve/Reject */
.btn-sm.approve i {
  color: transparent;
  -webkit-text-stroke: 1.2px #00cc44;
  text-stroke: 1.2px #00cc44;
}
.btn-sm.approve:hover i {
  color: #ffffff;
  -webkit-text-stroke: 0px;
  text-stroke: 0px;
}

.btn-sm.reject i {
  color: transparent;
  -webkit-text-stroke: 1.2px #ff4444;
  text-stroke: 1.2px #ff4444;
}
.btn-sm.reject:hover i {
  color: #ffffff;
  -webkit-text-stroke: 0px;
  text-stroke: 0px;
}
</style>