<template>
  <div class="hero-slider">
    <div class="slider-container">
      <div
        v-for="(slide, index) in slides"
        :key="index"
        class="slide"
        :class="{ active: currentIndex === index }"
      >
        <div class="slide-content">
          <h1>{{ slide.title }}</h1>
          <p>{{ slide.description }}</p>
        </div>
        <!-- Два слоя свечения, как в Suno -->
        <div class="suno-shimmer"></div>
        <div class="suno-shimmer suno-shimmer--second"></div>
      </div>

      <button class="slider-btn prev" @click="prevSlide">❮</button>
      <button class="slider-btn next" @click="nextSlide">❯</button>
      <div class="dots">
        <span
          v-for="(_, index) in slides"
          :key="index"
          class="dot"
          :class="{ active: currentIndex === index }"
          @click="goToSlide(index)"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const slides = ref([
  {
    title: 'ЗДАРОВА, БАНДИТЫ!',
    description: 'ВЫ НА САЙТЕ, НАКОНЕЦ-ТО СПУСТЯ 6 ЛЕТ,\nПЕРЕВОДЧИКОВ\nАЛЬЯНС КУСТАРНИКОВ !\nНЫНЕ ИЗВЕСТНЫЕ КАК:\nFORGOTTEN TEAM!\nЗДЕСЬ ПОКА НИЧЕГО НЕТ И\nДАЖЕ НЕТ НИЧЕЙ РЕКЛАМЫ...'
  },
  {
    title: 'Добро пожаловать в Forgotten Team',
    description: 'Мы команда энтузиастов, создающих удобную платформу для чтения манги. Следите за обновлениями!'
  },
  {
    title: 'Читайте мангу вместе с нами',
    description: 'Удобный читалка, обсуждения, закладки и многое другое.'
  }
])

const currentIndex = ref(0)
let autoInterval = null

const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % slides.value.length
}
const prevSlide = () => {
  currentIndex.value = (currentIndex.value - 1 + slides.value.length) % slides.value.length
}
const goToSlide = (index) => {
  currentIndex.value = index
}

onMounted(() => {
  autoInterval = setInterval(nextSlide, 8000) // 8 секунд на слайд
})
onUnmounted(() => {
  if (autoInterval) clearInterval(autoInterval)
})
</script>

<style scoped>
.hero-slider {
  width: 100%;
  margin: 20px auto 30px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0,0,0,0.5);
}
.slider-container {
  position: relative;
  background: #0a0a0a;
}
.slide {
  position: relative;
  display: none;
  padding: 60px 40px;
  min-height: 320px;
  background: linear-gradient(135deg, #111 0%, #080808 100%);
  overflow: hidden;
}
.slide.active {
  display: block;
  animation: fadeIn 0.5s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
.slide-content {
  position: relative;
  z-index: 5;
  max-width: 80%;
  margin: 0 auto;
  text-align: center;
}
.slide-content h1 {
  font-size: 2.2rem;
  color: #07660c;
  margin-bottom: 20px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}
.slide-content p {
  font-size: 1.1rem;
  line-height: 1.6;
  white-space: pre-line;
  color: #e0e0e0;
}

/* ===== ЭФФЕКТ ЛУЧА СТИЛЬ SUNO (ДИАГОНАЛЬНОЕ ДВИЖЕНИЕ) ===== */
.suno-shimmer {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    ellipse at 30% 40%,
    rgba(7, 102, 12, 0) 0%,
    rgba(7, 102, 12, 0.15) 30%,
    rgba(7, 102, 12, 0.4) 50%,
    rgba(7, 102, 12, 0.15) 70%,
    rgba(7, 102, 12, 0) 100%
  );
  filter: blur(60px);
  opacity: 0.6;
  pointer-events: none;
  z-index: 2;
  animation: sunoShimmer 12s infinite alternate ease-in-out;
  will-change: transform;
}

.suno-shimmer--second {
  background: radial-gradient(
    ellipse at 70% 60%,
    rgba(128, 131, 42, 0) 0%,
    rgba(128, 131, 42, 0.2) 30%,
    rgba(7, 102, 12, 0.3) 50%,
    rgba(128, 131, 42, 0.1) 70%,
    rgba(7, 102, 12, 0) 100%
  );
  filter: blur(80px);
  animation: sunoShimmerSecond 15s infinite alternate ease-in-out;
  opacity: 0.5;
}

@keyframes sunoShimmer {
  0% {
    transform: translate(0%, 0%) scale(1);
    opacity: 0.4;
  }
  25% {
    transform: translate(15%, 10%) scale(1.1);
    opacity: 0.7;
  }
  50% {
    transform: translate(-5%, 25%) scale(0.95);
    opacity: 0.5;
  }
  75% {
    transform: translate(20%, -5%) scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: translate(-10%, 15%) scale(1);
    opacity: 0.4;
  }
}

@keyframes sunoShimmerSecond {
  0% {
    transform: translate(0%, 0%) scale(1);
    opacity: 0.3;
  }
  33% {
    transform: translate(-15%, 20%) scale(1.15);
    opacity: 0.6;
  }
  66% {
    transform: translate(10%, -10%) scale(0.9);
    opacity: 0.4;
  }
  100% {
    transform: translate(5%, 15%) scale(1.05);
    opacity: 0.3;
  }
}

/* Кнопки и точки */
.slider-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.6);
  color: white;
  border: none;
  font-size: 2rem;
  padding: 10px 18px;
  cursor: pointer;
  z-index: 10;
  border-radius: 50%;
  transition: 0.3s;
}
.slider-btn:hover {
  background: #07660c;
  transform: translateY(-50%) scale(1.05);
}
.prev { left: 20px; }
.next { right: 20px; }
.dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 10;
}
.dot {
  width: 12px;
  height: 12px;
  background: #80832a;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.3s;
}
.dot.active {
  background: #07660c;
  transform: scale(1.3);
}
.dot:hover {
  background: #0a7e0f;
}
@media (max-width: 768px) {
  .slide {
    padding: 40px 20px;
    min-height: 280px;
  }
  .slide-content h1 {
    font-size: 1.6rem;
  }
  .slide-content p {
    font-size: 0.9rem;
  }
  .slider-btn {
    font-size: 1.5rem;
    padding: 6px 12px;
  }
}
</style>