<template>
  <div class="forum-topic-page">
    <div class="container">
      <div class="topic-header">
        <button class="back-btn" @click="$router.back()">← Назад</button>
        <h1>{{ topic?.title }}</h1>
        <div class="topic-meta">
          <span>👤 {{ topic?.author_name || 'Аноним' }}</span>
          <span>📅 {{ formatDate(topic?.created_at) }}</span>
          <span>👁 {{ topic?.views || 0 }} просмотров</span>
          <span>💬 {{ posts.length }} ответов</span>
        </div>
        <div v-if="topic?.is_locked" class="locked-badge">🔒 Тема закрыта</div>
      </div>

      <div v-if="loading" class="loading-state">Загрузка...</div>
      <div v-else class="posts-list">
        <div v-for="(post, index) in posts" :key="post.id" class="post-card" :id="`post-${post.id}`">
          <div class="post-sidebar">
            <div class="post-author-avatar">{{ getInitials(post.author_name) }}</div>
            <div class="post-author-name">{{ post.author_name || 'Аноним' }}</div>
            <div class="post-author-role" :class="post.author_role">{{ post.author_role || 'user' }}</div>
            <div class="post-number">#{{ index + 1 }}</div>
          </div>
          <div class="post-content">
            <div class="post-header">
              <span class="post-date">{{ formatDateTime(post.created_at) }}</span>
              <button v-if="authStore.isLoggedIn" @click="likePost(post.id)" class="like-btn">
                ❤ {{ post.likes_count || 0 }}
              </button>
            </div>
            <div class="post-message">{{ post.content }}</div>
          </div>
        </div>
      </div>

      <div v-if="authStore.isLoggedIn && !authStore.user?.emailVerified" class="verification-warning">
        <p>⚠️ Чтобы отвечать и ставить лайки, подтвердите Email.</p>
        <router-link to="/verify-email" class="verify-link">Подтвердить Email</router-link>
      </div>
      <div v-else-if="authStore.isLoggedIn && !topic?.is_locked" class="reply-section">
        <h3>Ваш ответ</h3>
        <textarea v-model="replyContent" placeholder="Напишите ваш ответ..." rows="5" class="reply-input"></textarea>
        <button @click="submitReply" :disabled="!replyContent.trim() || submitting" class="submit-reply-btn">
          {{ submitting ? 'Отправка...' : '📤 Отправить ответ' }}
        </button>
      </div>
      <div v-else-if="!authStore.isLoggedIn" class="login-prompt">
        <router-link to="/login">Войдите</router-link> или <router-link to="/register">зарегистрируйтесь</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { forumAPI } from '@/api';

const route = useRoute();
const authStore = useAuthStore();

const topic = ref(null);
const posts = ref([]);
const loading = ref(true);
const replyContent = ref('');
const submitting = ref(false);

const formatDate = (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '';
const formatDateTime = (date) => date ? new Date(date).toLocaleString('ru-RU') : '';
const getInitials = (name) => name?.charAt(0).toUpperCase() || '?';

const loadTopic = async () => {
  try {
    const data = await forumAPI.getTopic(route.params.id);
    topic.value = data;
    posts.value = data.posts || [];
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const submitReply = async () => {
  if (!replyContent.value.trim()) return;
  if (!authStore.isLoggedIn) return;
  if (!authStore.user.emailVerified) {
    alert('Подтвердите email для участия в обсуждении');
    return;
  }
  submitting.value = true;
  try {
    const newPost = await forumAPI.createPost({ topicId: route.params.id, content: replyContent.value });
    posts.value.push({ ...newPost, author_name: authStore.user.username, likes_count: 0 });
    replyContent.value = '';
  } catch (err) {
    console.error(err);
    alert('Ошибка отправки сообщения');
  } finally {
    submitting.value = false;
  }
};

const likePost = async (postId) => {
  if (!authStore.isLoggedIn) return;
  if (!authStore.user.emailVerified) {
    alert('Подтвердите email для взаимодействия');
    return;
  }
  try {
    const result = await forumAPI.likePost(postId);
    const post = posts.value.find(p => p.id === postId);
    if (post) post.likes_count = result.likes_count;
  } catch (err) {
    console.error(err);
  }
};

onMounted(loadTopic);
</script>


<style scoped>
.forum-topic-page {
  background: #000000;
  color: #ffffff;
  min-height: 100vh;
  padding: 40px 0;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
.back-btn {
  background: none;
  border: none;
  color: #80832A;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 20px;
}
.back-btn:hover {
  color: #07660C;
}
.topic-header h1 {
  font-size: 1.8rem;
  color: #07660C;
  margin-bottom: 15px;
}
.topic-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  color: #80832A;
  font-size: 0.9rem;
  margin-bottom: 15px;
}
.locked-badge {
  display: inline-block;
  background: #ff4444;
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
}
.posts-list {
  margin: 30px 0;
}
.post-card {
  display: flex;
  gap: 20px;
  background: #202020;
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
}
.post-sidebar {
  width: 150px;
  background: #2B2B2B;
  padding: 20px;
  text-align: center;
}
.post-author-avatar {
  width: 60px;
  height: 60px;
  background: #07660C;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 auto 10px;
}
.post-author-name {
  font-weight: 600;
  margin-bottom: 5px;
}
.post-author-role {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
  margin-bottom: 10px;
}
.post-author-role.admin { background: #ff4444; }
.post-author-role.moderator { background: #ffaa00; }
.post-author-role.user { background: #80832A; }
.post-number {
  color: #80832A;
  font-size: 0.8rem;
}
.post-content {
  flex: 1;
  padding: 20px;
}
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #2B2B2B;
}
.post-date {
  color: #80832A;
  font-size: 0.8rem;
}
.like-btn {
  background: none;
  border: none;
  color: #80832A;
  cursor: pointer;
  font-size: 1rem;
}
.like-btn:hover {
  color: #ff4444;
}
.post-message {
  line-height: 1.6;
  white-space: pre-wrap;
}
.reply-section {
  background: #202020;
  border-radius: 12px;
  padding: 25px;
  margin-top: 30px;
}
.reply-section h3 {
  color: #07660C;
  margin-bottom: 15px;
}
.reply-input {
  width: 100%;
  padding: 15px;
  background: #2B2B2B;
  border: 1px solid #80832A;
  border-radius: 8px;
  color: #fff;
  font-family: inherit;
  resize: vertical;
}
.submit-reply-btn {
  margin-top: 15px;
  background: #07660C;
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
}
.submit-reply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.login-prompt, .locked-prompt {
  text-align: center;
  padding: 40px;
  background: #202020;
  border-radius: 12px;
  margin-top: 30px;
}
.login-prompt a {
  color: #07660C;
  text-decoration: none;
}
.loading-state {
  text-align: center;
  padding: 60px;
}
.spinner {
  border: 4px solid #2B2B2B;
  border-top: 4px solid #07660C;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@media (max-width: 768px) {
  .post-card {
    flex-direction: column;
  }
  .post-sidebar {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
  }
  .post-author-avatar {
    margin: 0;
  }
}

.verification-warning {
  text-align: center; padding: 20px; background: #202020; border-radius: 8px; margin: 20px 0;
}
.verify-link {
  background: #07660c; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 10px;
}
</style>