import { defineStore } from 'pinia';
import { progressAPI } from '@/api';

export const useProgressStore = defineStore('progress', {
  state: () => ({}),
  actions: {
    async save(userId, mangaId, chapterId, pageNumber) {
      return progressAPI.save(userId, { mangaId, chapterId, pageNumber });
    },
    async get(userId, mangaId) {
      return progressAPI.get(userId, mangaId);
    }
  }
});