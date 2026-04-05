<template>
  <div class="not-found">
    <div class="container">
      <div class="error-content">
        <div class="error-code">404</div>
        <h1 class="error-title">Страница не найдена</h1>
        <p class="error-message">
          Запрошенная страница не существует или была перемещена.
        </p>
        <div class="action-buttons">
          <router-link to="/" class="btn-primary">
            ← Вернуться на главную
          </router-link>
          <button @click="goBack" class="btn-secondary">
            Назад
          </button>
        </div>
        <div class="search-suggestion">
          <p>Попробуйте найти нужную страницу через поиск:</p>
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Введите название манги или главы..."
              @keyup.enter="performSearch"
              class="search-input"
            >
            <button @click="performSearch" class="search-button">
              🔍
            </button>
          </div>
        </div>
      </div>
      <div class="popular-links">
        <h3>Популярные разделы:</h3>
        <div class="links-grid">
          <router-link to="/catalog" class="link-item">
            <span>📚</span>
            Каталог манги
          </router-link>
          <router-link to="/forum" class="link-item">
            <span>💬</span>
            Форум
          </router-link>
          <router-link to="/profile" class="link-item">
            <span>👤</span>
            Профиль
          </router-link>
          <router-link to="/login" class="link-item">
            <span>🔐</span>
            Вход в аккаунт
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}

const performSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({
      path: '/catalog',
      query: { search: searchQuery.value.trim() }
    })
  }
}
</script>

<style scoped>
.not-found {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) 0;
}
.error-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}
.error-code {
  font-size: 8rem;
  font-weight: 900;
  color: var(--color-primary);
  line-height: 1;
  margin-bottom: var(--spacing-md);
}
.error-title {
  font-size: 2rem;
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
}
.error-message {
  font-size: 1.1rem;
  color: var(--color-text);
  opacity: 0.8;
  margin-bottom: var(--spacing-xl);
}
.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-bottom: var(--spacing-xl);
}
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all var(--transition-normal);
}
.btn-primary:hover {
  background: color-mix(in srgb, var(--color-primary) 90%, white);
  transform: translateY(-2px);
}
.btn-secondary {
  background: transparent;
  color: var(--color-text);
  border: 2px solid var(--color-secondary);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.btn-secondary:hover {
  background: var(--color-secondary);
  color: white;
}
.search-suggestion {
  background: var(--color-panel);
  padding: var(--spacing-lg);
  border-radius: 12px;
  margin-bottom: var(--spacing-xl);
}
.search-box {
  display: flex;
  gap: var(--spacing-sm);
}
.search-input {
  flex: 1;
  padding: var(--spacing-md);
  border: 2px solid var(--color-secondary);
  border-radius: 8px;
  background: rgba(255,255,255,0.1);
  color: var(--color-text);
}
.search-button {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 var(--spacing-lg);
  cursor: pointer;
}
.popular-links {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid rgba(255,255,255,0.1);
}
.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
  gap: var(--spacing-md);
}
.link-item {
  background: var(--color-panel);
  padding: var(--spacing-md);
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: all 0.3s;
}
.link-item:hover {
  transform: translateY(-3px);
  border-color: var(--color-primary);
}
@media (max-width: 768px) {
  .error-code { font-size: 6rem; }
  .error-title { font-size: 1.5rem; }
  .action-buttons { flex-direction: column; align-items: center; }
  .links-grid { grid-template-columns: 1fr 1fr; }
}
</style>