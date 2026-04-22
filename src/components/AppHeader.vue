<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <header class="header">
    <div class="container header-container">
      <div class="logo">
        <router-link to="/" class="logo-link">Forgotten Team</router-link>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-link">Главная</router-link>
        <router-link to="/catalog" class="nav-link">Каталог</router-link>
        <router-link to="/forum" class="nav-link">Форум</router-link>
        <router-link v-if="authStore.isLoggedIn" to="/notifications" class="nav-link">
        Уведомления
        </router-link>

        <div v-if="authStore.isLoggedIn" class="user-menu">
          <router-link v-if="authStore.isAdmin" to="/admin" class="nav-link admin-link">
            Админ-панель
          </router-link>
          <router-link to="/profile" class="nav-link">Профиль</router-link>
          <button @click="handleLogout" class="logout-btn">Выйти</button>
        </div>
        <router-link v-else to="/login" class="login-btn">Войти</router-link>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: var(--color-panel);
  border-bottom: 2px solid var(--color-primary);
  z-index: 1000;
}
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}
.logo-link {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-primary);
  text-decoration: none;
}
.nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
.nav-link {
  color: var(--color-text);
  text-decoration: none;
  padding: 8px 0;
  position: relative;
  transition: color var(--transition-fast);
  font-size: 1rem;
}
.nav-link:hover {
  color: var(--color-primary);
}
.nav-link.router-link-active {
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
}
.login-btn {
  background: var(--color-primary);
  color: white;
  padding: 6px 16px;
  border-radius: 30px;
  text-decoration: none;
  font-weight: 600;
  transition: background var(--transition-fast);
}
.login-btn:hover {
  background: var(--color-primary-hover);
}
.logout-btn {
  background: transparent;
  border: 1px solid var(--color-secondary);
  color: var(--color-secondary);
  padding: 6px 16px;
  border-radius: 30px;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.logout-btn:hover {
  background: var(--color-secondary);
  color: white;
}
.admin-link {
  color: var(--color-primary) !important;
  font-weight: 600;
}
.admin-link:hover {
  color: var(--color-primary-hover) !important;
}
@media (max-width: 768px) {
  .logo-link {
    font-size: 1.2rem;
  }
  .nav {
    gap: var(--spacing-sm);
  }
}
</style>