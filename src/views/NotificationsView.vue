<template>
  <div class="notif-page">
    <div class="container">
      <h1>Уведомления</h1>
      <div v-if="notifications.length === 0" class="empty">Пока нет уведомлений</div>
      <div v-else class="list">
        <div v-for="n in notifications" :key="n.id" class="item" :class="{ unread: !n.read }" @click="markRead(n)">
          <span class="icon">{{ getIcon(n.type) }}</span>
          <div class="text">{{ n.message }}</div>
          <span class="time">{{ formatTime(n.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { notificationsAPI } from '@/api'

const authStore = useAuthStore()
const notifications = ref([])

// Демо-уведомления при отсутствии данных (можно удалить, когда API заработает)
const demoNotifications = [
  { id: 'demo1', type: 'new_chapter', message: 'Вышла новая глава "О моем перерождении в меч"', read: false, createdAt: new Date().toISOString() },
  { id: 'demo2', type: 'like', message: 'Пользователь Ivan поставил лайк вашему комментарию', read: false, createdAt: new Date(Date.now()-3600000).toISOString() },
  { id: 'demo3', type: 'forum_reply', message: 'Новый ответ в теме «Любимая манга»', read: true, createdAt: new Date(Date.now()-86400000).toISOString() }
]

const getIcon = type => ({ new_chapter:'📖', forum_reply:'💬', like:'❤️', system:'ℹ️' }[type] || '🔔')
const formatTime = dateStr => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff/60000)
  if (mins < 1) return 'только что'
  if (mins < 60) return `${mins} мин`
  const hours = Math.floor(mins/60)
  if (hours < 24) return `${hours} ч`
  return `${Math.floor(hours/24)} д`
}
const markRead = async n => { if (!n.read) { try { await notificationsAPI.markAsRead(n.id); n.read = true } catch {} } }

onMounted(async () => {
  try {
    const data = await notificationsAPI.getAll()
    notifications.value = data && data.length ? data : demoNotifications
  } catch {
    notifications.value = demoNotifications
  }
})
</script>

<style scoped>
.notif-page { padding: 30px 0; min-height: 70vh; }
h1 { color: var(--color-primary); margin-bottom: 20px; }
.empty { text-align: center; color: var(--color-text-muted); padding: 40px; }
.list { background: var(--color-panel); border-radius: 10px; overflow: hidden; }
.item { display: flex; align-items: center; gap: 15px; padding: 12px 20px; border-bottom: 1px solid var(--color-border); cursor: pointer; }
.item:hover { background: var(--color-panel-light); }
.item.unread { border-left: 3px solid var(--color-primary); background: rgba(10,126,20,0.08); }
.icon { font-size: 1.4rem; }
.text { flex: 1; }
.time { color: var(--color-text-muted); font-size: 0.8rem; }
</style>