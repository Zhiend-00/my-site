import { defineStore } from 'pinia';
import { mangaAPI } from '@/api';

export const useMangaStore = defineStore('manga', {
  state: () => ({
    mangaList: [],
    currentManga: null,
    isLoading: false,
    error: null,
    totalCount: 0,
  }),
  actions: {
    async fetchAllManga(params = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await mangaAPI.list({ ...params, limit: params.limit || 100 });
        // Поддержка нового формата { manga, total }
        this.mangaList = data.manga || data;
        this.totalCount = data.total || this.mangaList.length;
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
        // Преобразуем поля для совместимости
        this.currentManga = {
          ...manga,
          cover_image: manga.coverImage || manga.cover_image,
          chapters: manga.chapters || [],
          chapters_count: manga.chaptersCount ?? manga.chapters?.length ?? 0,
        };
        return this.currentManga;
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