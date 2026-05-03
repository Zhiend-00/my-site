<template>
  <footer class="footer">
    <div class="container footer-container">
      <div class="footer-info">
        <p>Forgotten Team — читай мангу с комфортом.</p>
        <p class="copyright">© {{ currentYear }}</p>
      </div>
      <div class="footer-links">
        <a href="https://rutube.ru" target="_blank" rel="noopener" class="social-link">Rutube</a>
        <a href="https://vk.com" target="_blank" rel="noopener" class="social-link">VK</a>
        <router-link to="/about" class="footer-link">О нас</router-link>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.footer {
  height: var(--footer-height);
  background: var(--color-panel);
  border-top: 1px solid var(--color-primary);
  display: flex;
  align-items: center;
}
.footer-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.footer-info {
  display: flex;
  gap: 20px;
  align-items: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
.social-link, .footer-link {
  color: var(--color-secondary);
  text-decoration: none;
  margin-left: 15px;
  transition: color var(--transition-fast);
}
.social-link:hover, .footer-link:hover {
  color: var(--color-primary);
}
@media (max-width: 768px) {
  .footer-container {
    flex-direction: column;
    gap: 5px;
    text-align: center;
  }
}
</style>