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
      // не сохраняем токен автоматически, ждём подтверждения
      return { success: true, message: data.message || 'Регистрация успешна' };
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
      user.value = data.user || data; // API может вернуть просто объект пользователя
    } catch {
      logout();
    }
  }

  // Восстановление пароля
  async function forgotPassword(email) {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await authAPI.forgotPassword(email);
      return { success: true, message: data.message };
    } catch (err) {
      error.value = err.message;
      return { success: false };
    } finally {
      isLoading.value = false;
    }
  }

  // Сброс пароля (для ResetPasswordView)
  async function resetPassword(token, password) {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await authAPI.resetPassword(token, password);
      return { success: true, message: data.message };
    } catch (err) {
      error.value = err.message;
      return { success: false };
    } finally {
      isLoading.value = false;
    }
  }

  // Инициализация
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
    forgotPassword,
    resetPassword
  };
});