/**
 * Типы данных для системы манги
 */

export interface Manga {
  id: string
  slug: string
  title: {
    ru: string
    en?: string
    original?: string
  }
  description: string
  author: string
  artist?: string
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled'
  year: number
  genres: string[]
  tags: string[]
  cover: string
  chapters: Chapter[]
  statistics: {
    rating: number
    views: number
    bookmarks: number
    subscribers: number
  }
}

export interface Chapter {
  id: string
  number: string
  title?: string
  volume?: number
  pages: number
  date: string
  scanlation?: string
}

export interface Page {
  id: string
  number: number
  url: string
  width: number
  height: number
  loaded?: boolean
}

export interface ReadingProgress {
  mangaId: string
  chapterId: string
  page: number
  timestamp: number
}

export interface UserBookmark {
  mangaId: string
  chapterId: string
  page: number
  note?: string
  timestamp: number
}

export interface ReaderSettings {
  readingMode: 'single' | 'double' | 'webtoon' | 'manga'
  readingDirection: 'ltr' | 'rtl'
  zoomLevel: number
  imageQuality: 'low' | 'medium' | 'high' | 'original'
  preloadPages: boolean
  autoSaveProgress: boolean
  theme: 'dark' | 'light' | 'sepia'
}