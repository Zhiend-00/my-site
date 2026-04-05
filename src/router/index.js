import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/catalog',
    name: 'Catalog',
    component: () => import('@/views/CatalogView.vue')
  },
  {
    path: '/manga/:id',
    name: 'Manga',
    component: () => import('@/views/MangaView.vue'),
    props: true
  },
  {
    path: '/chapter/:id',
    name: 'ChapterReader',
    component: () => import('@/views/ChapterReaderView.vue'),
    props: true
  },
  {
    path: '/forum',
    name: 'Forum',
    component: () => import('@/views/ForumView.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/AdminPanel.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue')
  },
  {
  path: '/forum/category/:id',
  name: 'ForumCategory',
  component: () => import('@/views/ForumCategoryView.vue'),
  props: true
},
{
  path: '/forum/topic/:id',
  name: 'ForumTopic',
  component: () => import('@/views/ForumTopicView.vue'),
  props: true
},
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    else return { top: 0 }
  }
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router