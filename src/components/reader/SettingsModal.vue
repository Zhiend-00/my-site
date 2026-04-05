<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h3>Настройки изображения</h3>
      <div class="controls">
        <button @click="$emit('zoom-out')">− Уменьшить</button>
        <span>Масштаб: {{ Math.round(zoom * 100) }}%</span>
        <button @click="$emit('zoom-in')">+ Увеличить</button>
        <button @click="$emit('reset-zoom')">Сброс</button>
      </div>
      <button class="close-btn" @click="$emit('close')">Закрыть</button>
    </div>
  </div>
</template>

<script setup>
defineProps(['zoom']);
defineEmits(['close', 'zoom-in', 'zoom-out', 'reset-zoom']);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal-content {
  background: #202020;
  padding: 30px;
  border-radius: 16px;
  text-align: center;
  min-width: 300px;
}
.controls {
  display: flex;
  gap: 15px;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
}
button {
  background: #07660C;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}
.close-btn {
  background: #80832A;
}
</style>