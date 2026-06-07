<template>
  <div class="topic-page">
    <div class="topic-container">
      <button @click="goBack" class="back-btn">← Назад к форуму</button>

      <div v-if="!topic" class="error-state">
        <h2>❌ Тема не найдена</h2>
        <p>Возможно, она была удалена или ссылка неверна</p>
        <button @click="goBack" class="back-btn">Вернуться на форум</button>
      </div>

      <template v-else>
        <div class="topic-header">
          <h1 class="topic-title">{{ topic.title }}</h1>
          <div class="topic-meta">
            <span>Автор: {{ topic.author?.username || 'Пользователь' }}</span>
            <span>📅 {{ formatDate(topic.created_at) }}</span>
            <span>👁 {{ topic.views || 0 }} просмотров</span>
          </div>
        </div>

        <div class="posts-list">
          <div v-if="posts.length === 0" class="empty-posts">
            <p>😔 В этой теме пока нет сообщений. Будьте первым!</p>
          </div>
          <div v-for="post in posts" :key="post.id" class="post-card">
            <div class="post-header">
              <div class="post-author">
                <span class="author-avatar">👤</span>
                <span class="author-name">{{ post.author?.username || 'Пользователь' }}</span>
                <span class="post-date">{{ formatDate(post.created_at) }}</span>
              </div>
              <div class="post-likes">
                <button 
                  @click="toggleLike(post.id)" 
                  class="like-btn"
                  :class="{ liked: post.is_liked }"
                >
                  ❤️ {{ post.likes || 0 }}
                </button>
              </div>
            </div>
            <div class="post-content">
              <p>{{ post.content }}</p>
            </div>
          </div>
        </div>

        <div class="reply-section" v-if="authStore.isLoggedIn">
          <h3>Ответить в тему</h3>
          <textarea 
            v-model="replyContent" 
            class="reply-input" 
            rows="4" 
            placeholder="Введите ваш ответ..."
          ></textarea>
          <button @click="addReply" :disabled="!replyContent.trim() || sendingReply" class="reply-btn">
            {{ sendingReply ? 'Отправка...' : 'Отправить ответ' }}
          </button>
        </div>
        <div v-else class="login-prompt">
          <p>🔐 <router-link to="/login">Войдите</router-link>, чтобы оставить ответ</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const topic = ref(null);
const posts = ref([]);
const replyContent = ref('');
const sendingReply = ref(false);

const loadData = () => {
  const topics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
  const topicId = parseInt(route.params.id);
  topic.value = topics.find(t => t.id === topicId);
  
  if (!topic.value) return;
  
  // Увеличиваем просмотры (один раз за сессию)
  const viewedKey = `topic_viewed_${topicId}`;
  if (!sessionStorage.getItem(viewedKey)) {
    topic.value.views = (topic.value.views || 0) + 1;
    sessionStorage.setItem(viewedKey, 'true');
    const allTopics = JSON.parse(localStorage.getItem('forum_topics') || '[]');
    const index = allTopics.findIndex(t => t.id === topicId);
    if (index !== -1) {
      allTopics[index].views = topic.value.views;
      localStorage.setItem('forum_topics', JSON.stringify(allTopics));
    }
  }
  
  const postsStore = JSON.parse(localStorage.getItem('forum_posts_store') || '{}');
  posts.value = postsStore[topicId] || [];
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes === 0 ? 'только что' : `${minutes} мин назад`;
    }
    return `${hours} ч назад`;
  } else if (days === 1) {
    return 'вчера';
  } else if (days < 7) {
    return `${days} дн назад`;
  }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const goBack = () => {
  router.push('/forum');
};

const toggleLike = (postId) => {
  if (!authStore.isLoggedIn) {
    alert('Войдите в аккаунт, чтобы ставить лайки');
    return;
  }
  
  const post = posts.value.find(p => p.id === postId);
  if (!post) return;
  
  if (post.is_liked) {
    post.likes--;
    post.is_liked = false;
  } else {
    post.likes++;
    post.is_liked = true;
  }
  
  const postsStore = JSON.parse(localStorage.getItem('forum_posts_store') || '{}');
  postsStore[topic.value.id] = posts.value;
  localStorage.setItem('forum_posts_store', JSON.stringify(postsStore));
};

const addReply = async () => {
  if (!replyContent.value.trim()) return;
  if (!authStore.isLoggedIn) {
    alert('Необходимо авторизоваться');
    return;
  }
  
  sendingReply.value = true;
  
  try {
    const currentUser = authStore.user?.username || authStore.user?.email || 'Пользователь';
    
    const newPost = {
      id: Date.now(),
      author: { username: currentUser },
      content: replyContent.value,
      created_at: new Date().toISOString(),
      likes: 0,
      is_liked: false
    };
    
    posts.value.push(newPost);
    
    const postsStore = JSON.parse(localStorage.getItem('forum_posts_store') || '{}');
    postsStore[topic.value.id] = posts.value;
    localStorage.setItem('forum_posts_store', JSON.stringify(postsStore));
    
    replyContent.value = '';
  } catch (error) {
    console.error('Ошибка добавления ответа:', error);
    alert('Ошибка при добавлении ответа');
  } finally {
    sendingReply.value = false;
  }
};

let refreshTimer = null;
const refreshData = () => {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    loadData();
  }, 100);
};

onMounted(() => {
  loadData();
  window.addEventListener('focus', refreshData);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshData();
  });
});

onUnmounted(() => {
  window.removeEventListener('focus', refreshData);
  document.removeEventListener('visibilitychange', refreshData);
  if (refreshTimer) clearTimeout(refreshTimer);
});
</script>

<style scoped>
.topic-page {
  min-height: calc(100vh - var(--header-height, 60px) - var(--footer-height, 60px));
  padding: 30px 0 50px;
  background: var(--color-background, #0a0a0a);
}

.topic-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

.back-btn {
  background: rgba(128, 131, 42, 0.2);
  border: 1px solid var(--color-secondary, #9ea344);
  color: var(--color-secondary);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.back-btn:hover {
  background: var(--color-secondary);
  color: white;
}

.topic-header {
  background: var(--color-panel, #1a1a1a);
  border-radius: 12px;
  padding: 20px 25px;
  margin-bottom: 25px;
  border: 1px solid rgba(128, 131, 42, 0.2);
}

.topic-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-primary, #07660c);
  margin: 0 0 12px 0;
}

.topic-meta {
  display: flex;
  gap: 20px;
  font-size: 0.8rem;
  color: var(--color-text-muted, #aaa);
  flex-wrap: wrap;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 30px;
}

.empty-posts {
  text-align: center;
  padding: 40px;
  background: var(--color-panel, #1a1a1a);
  border-radius: 12px;
  color: var(--color-text-muted, #aaa);
}

.post-card {
  background: var(--color-panel, #1a1a1a);
  border-radius: 12px;
  border: 1px solid rgba(128, 131, 42, 0.2);
  overflow: hidden;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  background: rgba(7, 102, 12, 0.1);
  border-bottom: 1px solid rgba(128, 131, 42, 0.2);
  flex-wrap: wrap;
  gap: 10px;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.author-name {
  font-weight: 600;
  color: var(--color-primary, #07660c);
}

.post-date {
  font-size: 0.7rem;
  color: var(--color-text-muted, #aaa);
}

.like-btn {
  background: none;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 20px;
  color: #aaa;
}

.like-btn.liked {
  color: #ff4444;
}

.post-content {
  padding: 18px;
}

.post-content p {
  margin: 0;
  line-height: 1.6;
  color: var(--color-text, #ffffff);
  white-space: pre-wrap;
}

.reply-section {
  background: var(--color-panel, #1a1a1a);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(128, 131, 42, 0.2);
}

.reply-section h3 {
  color: var(--color-secondary, #9ea344);
  margin: 0 0 15px 0;
  font-size: 1.1rem;
}

.reply-input {
  width: 100%;
  padding: 12px 15px;
  background: var(--color-panel-light, #2a2a2a);
  border: 1px solid rgba(128, 131, 42, 0.3);
  border-radius: 10px;
  color: var(--color-text, #ffffff);
  font-size: 0.9rem;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 15px;
}

.reply-input:focus {
  outline: none;
  border-color: var(--color-primary, #07660c);
}

.reply-btn {
  padding: 10px 24px;
  background: var(--color-primary, #07660c);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.reply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-prompt {
  text-align: center;
  padding: 30px;
  background: var(--color-panel, #1a1a1a);
  border-radius: 12px;
}

.login-prompt a {
  color: var(--color-primary, #07660c);
  text-decoration: none;
}

.error-state {
  text-align: center;
  padding: 50px;
  background: var(--color-panel, #1a1a1a);
  border-radius: 12px;
}

.error-state h2 {
  color: #ff4444;
  margin-bottom: 15px;
}

@media (max-width: 768px) {
  .topic-title {
    font-size: 1.3rem;
  }
  
  .post-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>