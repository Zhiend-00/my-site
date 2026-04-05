import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authAPI } from '@/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  const isLoggedIn = computed(() => !!user.value);
  const username = computed(() => user.value?.username || 'Гость');
  const isAdmin = computed(() => user.value?.role === 'admin');

  async function login(credentials) {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await authAPI.login(credentials);
      localStorage.setItem('token', data.token);
      user.value = data.user;
      return { success: true };
    } catch (err) {
      error.value = err.message;
      return { success: false };
    } finally {
      isLoading.value = false;
    }
  }

  async function register(userData) {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await authAPI.register(userData);
      localStorage.setItem('token', data.token);
      user.value = data.user;
      return { success: true };
    } catch (err) {
      error.value = err.message;
      return { success: false };
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    localStorage.removeItem('token');
    user.value = null;
    error.value = null;
  }

  async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const data = await authAPI.me();
      user.value = data.user;
    } catch {
      logout();
    }
  }

  checkAuth();

  return {
    user,
    isLoading,
    error,
    isLoggedIn,
    username,
    isAdmin,
    login,
    register,
    logout,
    checkAuth,
  };
});