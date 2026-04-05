<script setup>
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import '@/styles/global.css'
</script>

<template>
  <div class="app">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
}
.main-content {
  flex: 1;
  margin-top: var(--header-height);
  margin-bottom: var(--footer-height);
  padding: var(--spacing-lg) 0;
}
</style>