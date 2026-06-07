<template>
  <div class="home">
    <section class="slider-section">
      <div class="container">
        <h1 class="welcome-title">Добро пожаловать в Forgotten Team</h1>
        <HeroSlider />
      </div>
    </section>

    <section class="latest-section" v-if="latestManga.length">
      <div class="container">
        <h2 class="section-heading">Последняя добавленная манга и главы</h2>
        <div class="latest-grid">
          <div
            v-for="manga in latestManga"
            :key="manga.id"
            class="manga-card"
            @click="goToManga(manga.id)"
          >
            <img
              :src="getCoverUrl(manga.cover_image)"
              :alt="manga.title"
              class="manga-cover"
            />
            <div class="manga-info">
              <span class="manga-title">{{ manga.title }}</span>
              <span class="manga-date">{{ formatDate(manga.created_at) }}</span>
              <span class="manga-chapters">{{ manga.chapters_count || 0 }} глав</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="forum-section" v-if="latestTopics.length">
      <div class="container">
        <h2 class="section-heading">Последние темы форума</h2>
        <div class="forum-list">
          <div
            v-for="topic in latestTopics"
            :key="topic.id"
            class="forum-item"
            @click="goToTopic(topic.id)"
          >
            <div class="forum-item-content">
              <span class="forum-item-title">{{ topic.title }}</span>
              <span class="forum-item-meta">
                {{ topic.author_name || 'Автор' }} · {{ topic.posts_count || 0 }} сообщений · {{ formatDate(topic.created_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="feedback-section">
      <div class="container">
        <h2 class="section-heading">Обратная связь</h2>
        <form @submit.prevent="submitFeedback" class="feedback-form">
          <div class="input-group">
            <input v-model="form.name" placeholder="Ваше имя" required />
          </div>
          <div class="input-group">
            <input v-model="form.email" type="email" placeholder="Email" required />
          </div>
          <div class="input-group">
            <textarea v-model="form.message" placeholder="Сообщение" rows="4" required></textarea>
          </div>
          <button type="submit" :disabled="sending" class="btn btn-submit">
            {{ sending ? 'Отправка...' : 'Отправить сообщение' }}
          </button>
          <p v-if="success" class="success-msg">Сообщение отправлено</p>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMangaStore } from '@/stores/manga'
import { getCoverUrl } from '@/utils/imageHelper'
import { formatDate } from '@/utils/helpers'
import { forumAPI, feedbackAPI } from '@/api'
import HeroSlider from '@/components/HeroSlider.vue'

const router = useRouter()
const mangaStore = useMangaStore()

const latestManga = computed(() => {
  return [...mangaStore.mangaList]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6)
})

const latestTopics = ref([])

const goToManga = (id) => router.push(`/manga/${id}`)
const goToTopic = (id) => router.push(`/forum/topic/${id}`)

const form = ref({ name: '', email: '', message: '' })
const sending = ref(false)
const success = ref(false)

const submitFeedback = async () => {
  sending.value = true
  success.value = false
  try {
    const response = await feedbackAPI.send({ ...form.value })
    form.value = { name: '', email: '', message: '' }
    success.value = true
    alert(response.message || 'Сообщение отправлено!')
  } catch (err) {
    alert(err.message || 'Ошибка отправки')
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  await mangaStore.fetchAllManga()
  try {
    const data = await forumAPI.getTopics({ limit: 5 })
    latestTopics.value = data.topics || []
  } catch (e) {
    console.error('Не удалось загрузить темы форума', e)
  }
})
</script>

<style scoped>
.home {
  background: #121212;
  color: #ffffff;
  padding: 10px 0 40px;
  margin-top: -10px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Заголовок "Добро пожаловать" */
.welcome-title {
  font-size: 3.2rem;
  font-weight: 740;
  color: #07660c;
  text-align: center;
  margin-bottom: 60px;
  letter-spacing: 5px;
}

/* Секция слайдера - увеличен отступ снизу */
.slider-section {
  margin-bottom: 60px;
}

/* Секция последней манги - увеличен отступ снизу */
.latest-section {
  margin-bottom: 60px;
}

/* Секция форума - увеличен отступ снизу */
.forum-section {
  margin-bottom: 60px;
}

/* Секция обратной связи - увеличен отступ снизу */
.feedback-section {
  margin-bottom: 40px;
}

.section-heading {
  font-size: 1.8rem;
  font-weight: 600;
  color: #07660c;
  text-align: center;
  margin-bottom: 25px;
  position: relative;
}
.section-heading::after {
  content: '';
  display: block;
  width: 60px;
  height: 3px;
  background: #80832a;
  margin: 12px auto 0;
  border-radius: 2px;
}

.latest-grid {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 10px;
  scroll-behavior: smooth;
}
.latest-grid::-webkit-scrollbar {
  height: 6px;
}
.latest-grid::-webkit-scrollbar-track {
  background: #2b2b2b;
  border-radius: 3px;
}
.latest-grid::-webkit-scrollbar-thumb {
  background: #07660c;
  border-radius: 3px;
}
.manga-card {
  flex: 0 0 180px;
  background: #202020;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.manga-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.5);
}
.manga-cover {
  width: 100%;
  height: 210px;
  object-fit: cover;
}
.manga-info {
  padding: 12px;
}
.manga-title {
  font-size: 0.95rem;
  font-weight: 500;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
}
.manga-date {
  font-size: 0.8rem;
  color: #80832a;
  display: block;
  margin-bottom: 2px;
}
.manga-chapters {
  font-size: 0.8rem;
  color: #a0a0a0;
}

.forum-list {
  background: #202020;
  border-radius: 10px;
  padding: 20px;
}
.forum-item {
  cursor: pointer;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 0;
}
.forum-item:last-child {
  border-bottom: none;
}
.forum-item:hover {
  background: #2b2b2b;
  padding-left: 24px;
  padding-right: 24px;
  margin: 0 -8px;
}
.forum-item-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.forum-item-title {
  font-weight: 500;
  color: #07660c;
  font-size: 1rem;
}
.forum-item-meta {
  font-size: 0.8rem;
  color: #a0a0a0;
}

.feedback-form {
  background: #202020;
  border-radius: 10px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.input-group {
  display: flex;
  align-items: center;
  background: #2b2b2b;
  border-radius: 10px;
  padding: 0 15px;
  border: 1px solid transparent;
  transition: border-color 0.3s;
}
.input-group:focus-within {
  border-color: #07660c;
}
.input-group input,
.input-group textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  padding: 14px 0;
  font-size: 1rem;
  outline: none;
}
.input-group textarea {
  resize: vertical;
}
.btn-submit {
  align-self: center;
  background: #07660c;
  color: white;
  border: none;
  padding: 14px 36px;
  border-radius: 30px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}
.btn-submit:hover:not(:disabled) {
  background: #0a7e0f;
  transform: translateY(-2px);
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.success-msg {
  text-align: center;
  color: #07660c;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 1.6rem;
  }
  .section-heading {
    font-size: 1.4rem;
  }
  .slider-section {
    margin-bottom: 40px;
  }
  .latest-section {
    margin-bottom: 40px;
  }
  .forum-section {
    margin-bottom: 40px;
  }
}

@media (max-width: 480px) {
  .welcome-title {
    font-size: 1.3rem;
  }
  .slider-section {
    margin-bottom: 30px;
  }
  .latest-section {
    margin-bottom: 30px;
  }
  .forum-section {
    margin-bottom: 30px;
  }
}
</style>