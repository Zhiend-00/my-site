import { defineStore } from 'pinia';
import { mangaAPI } from '@/api';

export const useMangaStore = defineStore('manga', {
  state: () => ({
    mangaList: [],
    currentManga: null,
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchAllManga() {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await mangaAPI.list({ limit: 100 });
        this.mangaList = Array.isArray(data) ? data : (data.manga || []);
        return this.mangaList;
      } catch (err) {
        this.error = err.message;
        console.error(err);
        return [];
      } finally {
        this.isLoading = false;
      }
    },
    async fetchMangaById(id) {
      this.isLoading = true;
      this.error = null;
      try {
        const manga = await mangaAPI.get(id);
        this.currentManga = manga;
        return manga;
      } catch (err) {
        this.error = err.message;
        console.error(err);
        return null;
      } finally {
        this.isLoading = false;
      }
    },
  },
});