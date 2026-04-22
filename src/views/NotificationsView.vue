<template>
  <div class="notifications-page">
    <div class="container">
      <h1>Уведомления</h1>
      <div v-if="loading" class="loading">Загрузка...</div>
      <div v-else-if="notifications.length === 0" class="empty">
        У вас пока нет уведомлений
      </div>
      <div v-else class="notifications-list">
        <div
          v-for="notif in notifications"
          :key="notif.id"
          class="notification-item"
          :class="{ unread: !notif.read }"
          @click="handleNotificationClick(notif)"
        >
          <div class="notif-icon">{{ getIcon(notif.type) }}</div>
          <div class="notif-content">
            <div class="notif-text">{{ notif.message }}</div>
            <div class="notif-time">{{ formatTime(notif.createdAt) }}</div>
          </div>
          <button
            v-if="!notif.read"
            class="mark-read-btn"
            @click.stop="markAsRead(notif)"
            title="Отметить прочитанным"
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { notificationsAPI } from '@/api'

const authStore = useAuthStore()
const router = useRouter()

const notifications = ref([])
const loading = ref(true)

const getIcon = (type) => {
  const icons = {
    new_chapter: '📖',
    forum_reply: '💬',
    like: '❤️',
    system: 'ℹ️',
  }
  return icons[type] || '🔔'
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const mins = Math.floor(diff / (1000 * 60))
      return mins <= 1 ? 'только что' : `${mins} мин. назад`
    }
    return `${hours} ч. назад`
  }
  if (days === 1) return 'вчера'
  if (days < 7) return `${days} дн. назад`
  return date.toLocaleDateString('ru-RU')
}

const markAsRead = async (notif) => {
  try {
    await notificationsAPI.markAsRead(notif.id)
    notif.read = true
  } catch (error) {
    console.error('Ошибка отметки уведомления:', error)
  }
}

const handleNotificationClick = async (notif) => {
  if (!notif.read) {
    await markAsRead(notif)
  }
  if (notif.link) {
    router.push(notif.link)
  }
}

const loadNotifications = async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  loading.value = true
  try {
    const data = await notificationsAPI.getAll()
    notifications.value = data || []
  } catch (error) {
    console.error('Ошибка загрузки уведомлений:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notifications-page {
  padding: 40px 0;
  min-height: 70vh;
}
h1 {
  color: #07660c;
  margin-bottom: 30px;
}
.loading,
.empty {
  text-align: center;
  color: #80832a;
  padding: 40px;
}
.notifications-list {
  background: #202020;
  border-radius: 12px;
  overflow: hidden;
}
.notification-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid #2b2b2b;
  cursor: pointer;
  transition: background 0.2s;
}
.notification-item:hover {
  background: #2b2b2b;
}
.notification-item.unread {
  background: rgba(7, 102, 12, 0.15);
  border-left: 4px solid #07660c;
}
.notif-icon {
  font-size: 1.5rem;
  width: 30px;
  text-align: center;
}
.notif-content {
  flex: 1;
}
.notif-text {
  color: #fff;
  margin-bottom: 5px;
}
.notif-time {
  font-size: 0.8rem;
  color: #80832a;
}
.mark-read-btn {
  background: none;
  border: 1px solid #80832a;
  color: #80832a;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}
.mark-read-btn:hover {
  background: #07660c;
  border-color: #07660c;
  color: white;
}
</style>