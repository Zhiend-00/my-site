import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { mangaAPI } from '@/api';

export const useCatalogStore = defineStore('catalog', () => {
  const mangaList = ref([]);
  const genres = ref([]);
  const isLoading = ref(false);
  const totalCount = ref(0);
  const filters = ref({
    searchQuery: '',
    selectedGenres: [],
    status: 'all',
    sortBy: 'popular',
    page: 1,
    itemsPerPage: 24,
  });

  const hasFilters = computed(() => !!filters.value.searchQuery || filters.value.selectedGenres.length > 0 || filters.value.status !== 'all');
  const totalPages = computed(() => Math.ceil(totalCount.value / filters.value.itemsPerPage));

  async function fetchManga() {
    isLoading.value = true;
    try {
      const params = {
        page: filters.value.page,
        limit: filters.value.itemsPerPage,
        search: filters.value.searchQuery,
        status: filters.value.status,
        sort: filters.value.sortBy,
      };
      if (filters.value.selectedGenres.length) params.genres = filters.value.selectedGenres.join(',');
      const data = await mangaAPI.list(params);
      mangaList.value = data.manga || data;
      totalCount.value = data.total || mangaList.value.length;
    } catch (err) {
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchGenres() {
    // Заглушка, потом можно сделать API запрос
    genres.value = [
      { id: 1, name: 'Экшен', manga_count: 12 },
      { id: 2, name: 'Фэнтези', manga_count: 15 },
      { id: 3, name: 'Драма', manga_count: 8 },
    ];
  }

  async function updateFilters(newFilters) {
    Object.assign(filters.value, newFilters, { page: 1 });
    await fetchManga();
  }

  async function resetFilters() {
    filters.value = {
      searchQuery: '',
      selectedGenres: [],
      status: 'all',
      sortBy: 'popular',
      page: 1,
      itemsPerPage: 24,
    };
    await fetchManga();
  }

  async function changePage(page) {
    if (page < 1 || page > totalPages.value) return;
    filters.value.page = page;
    await fetchManga();
  }

  async function init() {
    await fetchGenres();
    await fetchManga();
  }

  return {
    mangaList,
    genres,
    isLoading,
    totalCount,
    filters,
    hasFilters,
    totalPages,
    fetchManga,
    fetchGenres,
    updateFilters,
    resetFilters,
    changePage,
    init,
  };
});