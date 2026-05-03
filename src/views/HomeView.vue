<template>
  <div class="home">
    <!-- 1. Слайдер с информацией и анимированным фоном -->
    <section class="slider-section">
      <div class="container">
        <h2 class="section-heading">Слайдер с информацией</h2>
        <div class="slider-placeholder" ref="sliderContainer">
          <img
            src="/src/about-team.png"
            alt="Слайдер"
            class="slider-image"
          />
          <canvas
            ref="animatedCanvas"
            class="slider-canvas"
          ></canvas>
        </div>
      </div>
    </section>

    <!-- 2. Последняя добавленная манга и главы -->
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

    <!-- 3. Последние темы форума -->
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

    <!-- 4. Форма обратной связи (такая же ширина, как и предыдущие блоки) -->
    <section class="feedback-section">
      <div class="container">
        <h2 class="section-heading">📨 Обратная связь</h2>
        <form @submit.prevent="submitFeedback" class="feedback-form">
          <div class="input-group">
            <span class="input-icon">👤</span>
            <input v-model="form.name" placeholder="Ваше имя" required />
          </div>
          <div class="input-group">
            <span class="input-icon">📧</span>
            <input v-model="form.email" type="email" placeholder="Email" required />
          </div>
          <div class="input-group">
            <span class="input-icon">💬</span>
            <textarea v-model="form.message" placeholder="Сообщение" rows="4" required></textarea>
          </div>
          <button type="submit" :disabled="sending" class="btn btn-submit">
            {{ sending ? 'Отправка...' : 'Отправить сообщение' }}
          </button>
          <p v-if="success" class="success-msg">✅ Сообщение отправлено</p>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useMangaStore } from '@/stores/manga'
import { getCoverUrl } from '@/utils/imageHelper'
import { formatDate } from '@/utils/helpers'
import { forumAPI, feedbackAPI } from '@/api'

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

// ---------- Canvas анимация ----------
const sliderContainer = ref(null)
const animatedCanvas = ref(null)
let animationId = null

const startCanvasAnimation = () => {
  const canvas = animatedCanvas.value
  const container = sliderContainer.value
  if (!canvas || !container) return

  const ctx = canvas.getContext('2d')
  let width, height

  const resizeCanvas = () => {
    const rect = container.getBoundingClientRect()
    width = rect.width
    height = rect.height
    canvas.width = width
    canvas.height = height
  }
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  const particles = []
  const numParticles = 50
  const connectionDistance = 100

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 1,
    })
  }

  const animate = () => {
    ctx.clearRect(0, 0, width, height)

    particles.forEach(p => {
      p.x += p.vx
      p.y += p.vy

      if (p.x < 0 || p.x > width) p.vx *= -1
      if (p.y < 0 || p.y > height) p.vy *= -1

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(158, 163, 68, 0.7)'
      ctx.fill()
    })

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < connectionDistance) {
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `rgba(158, 163, 68, ${1 - dist / connectionDistance})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    }

    animationId = requestAnimationFrame(animate)
  }

  animate()
}

// ---------- Обратная связь ----------
const form = ref({ name: '', email: '', message: '' })
const sending = ref(false)
const success = ref(false)

const submitFeedback = async () => {
  sending.value = true;
  success.value = false;
  try {
    const response = await feedbackAPI.send({ ...form.value });
    // response может содержать { message: '...' }
    form.value = { name: '', email: '', message: '' };
    success.value = true;
    // Показываем сообщение от сервера (опционально)
    alert(response.message || 'Сообщение отправлено!');
  } catch (err) {
    // Пытаемся извлечь сообщение из тела ответа
    let errorMsg = 'Ошибка отправки';
    if (err.message) {
      errorMsg = err.message; // это может быть текст ошибки от api
    }
    alert(errorMsg);
  } finally {
    sending.value = false;
  }
};

onMounted(async () => {
  await mangaStore.fetchAllManga()
  try {
    const data = await forumAPI.getTopics({ limit: 5 })
    latestTopics.value = data.topics || []
  } catch (e) {
    console.error('Не удалось загрузить темы форума', e)
  }

  await nextTick()
  startCanvasAnimation()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.home {
  background: var(--color-background, #111);
  color: var(--color-text, #fff);
  padding: 10px 0 40px;
  margin-top: -10px;
}

/* Контейнер одинаковый для всех секций — max-width: 1200px */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-heading {
  font-size: 1.8rem;
  color: var(--color-primary, #0a7e14);
  text-align: center;
  margin-bottom: 15px;
  position: relative;
}
.section-heading::after {
  content: '';
  display: block;
  width: 60px;
  height: 3px;
  background: var(--color-secondary, #9ea344);
  margin: 10px auto 0;
  border-radius: 2px;
}

/* ========== Слайдер ========== */
.slider-placeholder {
  position: relative;
  background: var(--color-panel, #1e1e1e);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-top: 5px;
}
.slider-image {
  width: 100%;
  height: auto;
  max-height: 350px;
  object-fit: cover;
  display: block;
}
.slider-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border-radius: 10px;
}

/* ========== Последняя добавленная манга ========== */
.latest-grid {
  display: flex;
  gap: 20px;
  overflow-x: auto;          /* горизонтальный скролл, если карточки не влезают */
  padding-bottom: 10px;      /* чтобы скролл не перекрывал карточки */
  scroll-behavior: smooth;
}

/* чтобы скроллбар выглядел аккуратно (опционально) */
.latest-grid::-webkit-scrollbar {
  height: 6px;
}
.latest-grid::-webkit-scrollbar-track {
  background: var(--color-panel-light);
  border-radius: 3px;
}
.latest-grid::-webkit-scrollbar-thumb {
  background: var(--color-primary);
  border-radius: 3px;
}

/* карточки получают фиксированную ширину, чтобы не сжимались */
.manga-card {
  flex: 0 0 180px;           /* ширина 180px, не растягивается и не сжимается */
  background: var(--color-panel);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.manga-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
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
  color: var(--color-secondary);
  display: block;
  margin-bottom: 2px;
}
.manga-chapters {
  font-size: 0.8rem;
  color: var(--color-text-muted, #aaa);
}

/* ========== Форум ========== */
.forum-list {
  background: var(--color-panel);
  border-radius: 10px;
  padding: 20px;
}
.forum-item {
  cursor: pointer;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: background 0.2s;
}
.forum-item:last-child {
  border-bottom: none;
}
.forum-item:hover {
  background: var(--color-panel-light);
  border-radius: 6px;
}
.forum-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.forum-item-title {
  font-weight: 500;
  color: var(--color-primary);
}
.forum-item-meta {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

/* ========== Обратная связь ========== */
.feedback-form {
  background: var(--color-panel);
  border-radius: 10px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.input-group {
  display: flex;
  align-items: center;
  background: var(--color-panel-light);
  border-radius: 10px;
  padding: 0 15px;
  border: 1px solid transparent;
  transition: border-color 0.3s;
}
.input-group:focus-within {
  border-color: var(--color-primary);
}
.input-icon {
  font-size: 1.2rem;
  margin-right: 10px;
  opacity: 0.8;
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
  background: var(--color-primary);
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
  background: var(--color-primary-hover, #0c9624);
  transform: translateY(-2px);
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.success-msg {
  text-align: center;
  color: var(--color-primary);
  margin-top: 10px;
}
</style>