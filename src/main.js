import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

/**
 * Создает и настраивает экземпляр Vue приложения
 */
const initApp = () => {
  // Создание экземпляра приложения
  const app = createApp(App)
  
  // Подключение маршрутизатора
  app.use(router)
  
  // Подключение хранилища состояний
  const pinia = createPinia()
  app.use(pinia)
  
  // Глобальные конфигурации
  app.config.globalProperties.$filters = {
    /**
     * Форматирует число с разделителями тысяч
     * @param {number} value - Число для форматирования
     * @returns {string} Отформатированная строка
     */
    formatNumber(value) {
      return new Intl.NumberFormat('ru-RU').format(value)
    },
    
    /**
     * Обрезает текст до указанной длины
     * @param {string} text - Исходный текст
     * @param {number} length - Максимальная длина
     * @returns {string} Обрезанный текст
     */
    truncate(text, length = 100) {
      if (text.length <= length) return text
      return text.substring(0, length) + '...'
    }
  }
  
  // Глобальные обработчики ошибок
  app.config.errorHandler = (error, instance, info) => {
    console.error('Глобальная ошибка Vue:', error)
    console.log('Компонент:', instance)
    console.log('Информация:', info)
    
    // Здесь можно добавить отправку ошибок в сервис мониторинга
    // sendToMonitoringService(error)
  }
  
  // Монтирование приложения
  app.mount('#app')
  
  return app
}

// Запуск приложения
initApp()