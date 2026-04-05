<template>
  <div class="forum-category">
    <h1>Категория: {{ categoryName }}</h1>
    
    <div v-if="loading" class="loading">
      Загрузка...
    </div>
    
    <div v-else>
      <div v-if="threads.length === 0" class="no-threads">
        <p>В этой категории пока нет обсуждений.</p>
        <router-link 
          v-if="isAuthenticated"
          :to="`/forum/category/${$route.params.slug}/create-thread`"
          class="btn btn-primary"
        >
          Создать новое обсуждение
        </router-link>
      </div>
      
      <div v-else class="threads-list">
        <div v-for="thread in threads" :key="thread.id" class="thread-card">
          <div class="thread-header">
            <h3>
              <router-link :to="`/forum/thread/${thread.id}`">
                {{ thread.title }}
              </router-link>
            </h3>
            <span class="thread-status" v-if="thread.isClosed">[Закрыто]</span>
            <span class="thread-status" v-if="thread.isPinned">[Закреплено]</span>
          </div>
          
          <div class="thread-meta">
            <span class="author">
              Автор: {{ thread.author }}
            </span>
            <span class="date">
              {{ formatDate(thread.createdAt) }}
            </span>
            <span class="replies">
              Ответов: {{ thread.replyCount }}
            </span>
            <span class="views">
              Просмотров: {{ thread.viewCount }}
            </span>
          </div>
          
          <div class="thread-preview" v-if="thread.lastPost">
            Последний ответ: {{ thread.lastPost.author }}, 
            {{ formatDate(thread.lastPost.date) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ForumCategoryView',
  data() {
    return {
      categoryName: '',
      threads: [],
      loading: true,
      isAuthenticated: false
    }
  },
  mounted() {
    this.loadCategoryData()
    this.checkAuth()
  },
  methods: {
    async loadCategoryData() {
      const slug = this.$route.params.slug
      this.loading = true
      
      try {
        // В реальном приложении здесь будет запрос к API
        // const response = await fetch(`/api/forum/category/${slug}`)
        // const data = await response.json()
        
        // Имитация загрузки данных
        setTimeout(() => {
          this.categoryName = this.formatSlug(slug)
          this.threads = [
            {
              id: 1,
              title: 'Первое обсуждение в категории',
              author: 'Иван Иванов',
              createdAt: new Date(Date.now() - 86400000 * 2),
              replyCount: 15,
              viewCount: 120,
              isClosed: false,
              isPinned: true,
              lastPost: {
                author: 'Петр Петров',
                date: new Date(Date.now() - 3600000)
              }
            },
            {
              id: 2,
              title: 'Второе обсуждение',
              author: 'Мария Сидорова',
              createdAt: new Date(Date.now() - 86400000),
              replyCount: 8,
              viewCount: 65,
              isClosed: false,
              isPinned: false,
              lastPost: {
                author: 'Алексей Алексеев',
                date: new Date(Date.now() - 7200000)
              }
            },
            {
              id: 3,
              title: 'Закрытое обсуждение',
              author: 'Администратор',
              createdAt: new Date(Date.now() - 86400000 * 3),
              replyCount: 42,
              viewCount: 300,
              isClosed: true,
              isPinned: false,
              lastPost: {
                author: 'Модератор',
                date: new Date(Date.now() - 172800000)
              }
            }
          ]
          this.loading = false
        }, 500)
      } catch (error) {
        console.error('Ошибка загрузки категории:', error)
        this.loading = false
      }
    },
    
    formatSlug(slug) {
      // Преобразуем slug в читаемое название
      return slug.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },
    
    formatDate(date) {
      if (!(date instanceof Date)) {
        date = new Date(date)
      }
      
      const now = new Date()
      const diff = now - date
      
      // Если меньше минуты назад
      if (diff < 60000) return 'только что'
      
      // Если меньше часа назад
      if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000)
        return `${minutes} ${this.pluralize(minutes, 'минуту', 'минуты', 'минут')} назад`
      }
      
      // Если сегодня
      if (date.toDateString() === now.toDateString()) {
        return `сегодня в ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      }
      
      // Если вчера
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (date.toDateString() === yesterday.toDateString()) {
        return `вчера в ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      }
      
      // Иначе полная дата
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    pluralize(number, one, two, five) {
      let n = Math.abs(number)
      n %= 100
      if (n >= 5 && n <= 20) return five
      n %= 10
      if (n === 1) return one
      if (n >= 2 && n <= 4) return two
      return five
    },
    
    checkAuth() {
      // Проверка авторизации
      // В реальном приложении здесь будет проверка токена или состояния Vuex
      this.isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    }
  },
  watch: {
    '$route.params.slug'() {
      this.loadCategoryData()
    }
  }
}
</script>

<style scoped>
.forum-category {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.no-threads {
  text-align: center;
  padding: 40px;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 20px 0;
}

.no-threads p {
  margin-bottom: 20px;
  color: #666;
}

.threads-list {
  margin-top: 20px;
}

.thread-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  transition: box-shadow 0.3s;
}

.thread-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.thread-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.thread-header h3 {
  margin: 0;
  flex-grow: 1;
}

.thread-header h3 a {
  color: #333;
  text-decoration: none;
}

.thread-header h3 a:hover {
  color: #007bff;
}

.thread-status {
  margin-left: 10px;
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.thread-meta {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.thread-preview {
  font-size: 13px;
  color: #888;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.btn-primary {
  background: #007bff;
}

.btn-primary:hover {
  background: #0056b3;
}

@media (max-width: 768px) {
  .thread-meta {
    flex-direction: column;
    gap: 5px;
  }
  
  .forum-category {
    padding: 10px;
  }
}
</style>