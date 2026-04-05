/**
 * Утилиты для работы с изображениями в читалке
 */

/**
 * Предзагружает изображения
 * @param {Array<string>} urls - URL изображений для загрузки
 * @returns {Promise<void>}
 */
export const preloadImages = (urls) => {
  const promises = urls.map(url => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = url
      img.onload = resolve
      img.onerror = reject
    })
  })
  
  return Promise.all(promises)
}

/**
 * Оптимизирует URL изображения в зависимости от качества
 * @param {string} url - Оригинальный URL
 * @param {'low'|'medium'|'high'|'original'} quality - Желаемое качество
 * @returns {string} Оптимизированный URL
 */
export const getOptimizedImageUrl = (url, quality = 'high') => {
  if (quality === 'original') return url
  
  const qualityMap = {
    low: 'w=400&auto=format&fit=crop',
    medium: 'w=800&auto=format&fit=crop',
    high: 'w=1200&auto=format&fit=crop'
  }
  
  const qualityParams = qualityMap[quality] || qualityMap.high
  
  // Если URL уже содержит параметры
  if (url.includes('?')) {
    return `${url}&${qualityParams}`
  }
  
  return `${url}?${qualityParams}`
}

/**
 * Рассчитывает оптимальный размер контейнера для изображения
 * @param {number} imgWidth - Ширина изображения
 * @param {number} imgHeight - Высота изображения
 * @param {number} containerWidth - Ширина контейнера
 * @returns {{width: number, height: number}} Оптимальные размеры
 */
export const calculateOptimalSize = (imgWidth, imgHeight, containerWidth) => {
  const aspectRatio = imgHeight / imgWidth
  const width = Math.min(imgWidth, containerWidth)
  const height = width * aspectRatio
  
  return { width, height }
}

/**
 * Создает placeholder для загрузки изображения
 * @param {number} width - Ширина
 * @param {number} height - Высота
 * @param {string} text - Текст для placeholder
 * @returns {string} Data URL placeholder
 */
export const createPlaceholder = (width, height, text = 'Загрузка...') => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  
  const ctx = canvas.getContext('2d')
  
  // Фон
  ctx.fillStyle = '#2B2B2B'
  ctx.fillRect(0, 0, width, height)
  
  // Текст
  ctx.fillStyle = '#80832A'
  ctx.font = 'bold 20px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height / 2)
  
  return canvas.toDataURL()
}

/**
 * Кэширует изображения в IndexedDB
 */
export class ImageCache {
  constructor(dbName = 'manga-image-cache', storeName = 'images') {
    this.dbName = dbName
    this.storeName = storeName
  }
  
  /**
   * Инициализирует базу данных
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'url' })
        }
      }
      
      request.onsuccess = (event) => {
        this.db = event.target.result
        resolve(this.db)
      }
      
      request.onerror = (event) => {
        reject(event.target.error)
      }
    })
  }
  
  /**
   * Сохраняет изображение в кэш
   */
  async set(url, blob) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put({ url, blob, timestamp: Date.now() })
      
      request.onsuccess = () => resolve()
      request.onerror = (event) => reject(event.target.error)
    })
  }
  
  /**
   * Получает изображение из кэша
   */
  async get(url) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(url)
      
      request.onsuccess = (event) => {
        const result = event.target.result
        resolve(result ? result.blob : null)
      }
      
      request.onerror = (event) => reject(event.target.error)
    })
  }
  
  /**
   * Очищает старые записи (старше 7 дней)
   */
  async cleanup(olderThan = 7 * 24 * 60 * 60 * 1000) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.openCursor()
      const now = Date.now()
      
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          if (now - cursor.value.timestamp > olderThan) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      
      request.onerror = (event) => reject(event.target.error)
    })
  }
}