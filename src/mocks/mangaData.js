/**
 * Моковые данные для тестирования читалки
 */

export const mockManga = {
  id: 'berserk',
  slug: 'berserk',
  title: {
    ru: 'Берсерк',
    en: 'Berserk',
    original: 'ベルセルク'
  },
  description: 'Мрачная фэнтези-сага о воине Гатсе, известном как Чёрный мечник. История повествует о его пути мести, борьбе с демонами и поиске своего места в жестоком мире.',
  author: 'Кэнтаро Миура',
  status: 'ongoing',
  year: 1989,
  genres: ['Фэнтези', 'Драма', 'Ужасы', 'Приключения'],
  tags: ['Тёмное фэнтези', 'Меч и магия', 'Взрослая аудитория'],
  cover: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&auto=format&fit=crop',
  statistics: {
    rating: 4.9,
    views: 1250000,
    bookmarks: 50000,
    subscribers: 150000
  },
  chapters: [
    { id: 'ch1', number: '001', title: 'Чёрный мечник', pages: 24, date: '2024-01-15' },
    { id: 'ch2', number: '002', title: 'Банда Ястреба', pages: 22, date: '2024-01-22' },
    { id: 'ch3', number: '003', title: 'Первый отряд', pages: 26, date: '2024-01-29' },
    { id: 'ch4', number: '004', title: 'Рыцарь-череп', pages: 28, date: '2024-02-05' },
    { id: 'ch5', number: '005', title: 'Воины тьмы', pages: 25, date: '2024-02-12' }
  ]
}

export const mockChapters = [
  {
    id: 'ch1',
    mangaId: 'berserk',
    number: '001',
    title: 'Чёрный мечник',
    pages: Array.from({ length: 24 }, (_, i) => ({
      id: `page_${i + 1}`,
      number: i + 1,
      url: `https://images.unsplash.com/photo-${157831887 + i}?w=800&auto=format&fit=crop`,
      width: 800,
      height: 1200
    }))
  },
  {
    id: 'ch2',
    mangaId: 'berserk',
    number: '002',
    title: 'Банда Ястреба',
    pages: Array.from({ length: 22 }, (_, i) => ({
      id: `page_${i + 1}`,
      number: i + 1,
      url: `https://images.unsplash.com/photo-${157832000 + i}?w=800&auto=format&fit=crop`,
      width: 800,
      height: 1200
    }))
  }
]

/**
 * Генерирует URL для тестовых изображений
 */
export const generateTestImageUrl = (seed, width = 800, height = 1200) => {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`
}

/**
 * Создаёт моковые данные для тестовой манги
 */
export const createMockMangaData = (mangaId, chaptersCount = 5) => {
  const manga = {
    ...mockManga,
    id: mangaId,
    title: {
      ...mockManga.title,
      ru: `Тестовая манга ${mangaId}`
    }
  }
  
  const chapters = Array.from({ length: chaptersCount }, (_, i) => ({
    id: `ch${i + 1}`,
    mangaId,
    number: String(i + 1).padStart(3, '0'),
    title: `Глава ${i + 1}`,
    pages: Array.from({ length: 20 + Math.floor(Math.random() * 10) }, (_, pageIndex) => ({
      id: `page_${pageIndex + 1}`,
      number: pageIndex + 1,
      url: generateTestImageUrl(`${mangaId}_ch${i + 1}_page${pageIndex + 1}`),
      width: 800,
      height: 1200,
      loaded: false
    }))
  }))
  
  return { manga, chapters }
}