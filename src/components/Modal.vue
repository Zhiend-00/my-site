<!-- src/components/Modal.vue -->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <slot></slot>
    </div>
  </div>
</template>
<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: var(--color-panel); padding: 25px; border-radius: 8px; max-width: 500px; width: 90%; }
</style>