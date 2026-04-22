<template>
  <footer class="footer">
    <div class="container footer-container">
      <div class="social-links">
        <a href="#" class="social-link">Rutube</a>
        <a href="#" class="social-link">Telegram</a>
        <a href="#" class="social-link">Discord</a>
      </div>
      <div class="footer-links">
        <router-link to="/about" class="footer-link">О нас</router-link>
      </div>
      <p class="copyright">© {{ currentYear }} Forgotten Team</p>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--footer-height);
  background: var(--color-panel);
  border-top: 1px solid var(--color-primary);
  z-index: 1000;
}
.footer-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  gap: 20px;
}
.social-link {
  color: var(--color-secondary);
  text-decoration: none;
  margin-right: var(--spacing-md);
  transition: color var(--transition-fast);
}
.social-link:hover {
  color: var(--color-primary);
}
.footer-link {
  color: var(--color-text);
  text-decoration: none;
  margin: 0 10px;
  opacity: 0.8;
}
.footer-link:hover {
  color: var(--color-primary);
}
.copyright {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  margin-left: auto;
}
@media (max-width: 768px) {
  .footer-container {
    flex-direction: column;
    justify-content: center;
    gap: 5px;
  }
  .copyright {
    margin-left: 0;
  }
}
</style>