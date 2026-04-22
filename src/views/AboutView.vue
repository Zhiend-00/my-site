<template>
  <div class="about-page">
    <div class="container">
      <h1>О нас</h1>
      <div class="about-content">
        <div class="about-text">
          <!-- ЗАМЕНИТЕ ЭТОТ ТЕКСТ НА СВОЙ -->
          <p>
            Forgotten Team — это команда энтузиастов, создающая удобную платформу для чтения манги.
            Мы стремимся предоставить лучший опыт чтения, обсуждения и отслеживания любимых тайтлов.
          </p>
          <p>
            Наш проект постоянно развивается, добавляются новые функции и улучшается интерфейс.
            Следите за обновлениями!
          </p>
          <!-- КОНЕЦ ЗАМЕНЯЕМОГО ТЕКСТА -->
        </div>
        <div class="about-image">
          <!-- Если файл не существует, показываем заглушку -->
          <img 
            src="/images/about-team.png" 
            alt="Forgotten Team" 
            @error="handleImageError"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const handleImageError = (event) => {
  // Если изображение не загрузилось, заменяем на цветной блок
  event.target.style.display = 'none';
  const parent = event.target.parentElement;
  if (parent && !parent.querySelector('.image-placeholder')) {
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder';
    placeholder.innerHTML = 'Изображение<br>команды';
    parent.appendChild(placeholder);
  }
};
</script>

<style scoped>
.about-page {
  padding: 40px 0;
  min-height: 70vh;
}
h1 {
  color: #07660c;
  text-align: center;
  margin-bottom: 40px;
}
.about-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
}
.about-text p {
  color: #fff;
  line-height: 1.6;
  margin-bottom: 20px;
}
.about-image {
  position: relative;
}
.about-image img {
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}
.image-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, #2b2b2b, #1a1a1a);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #80832a;
  font-size: 1.2rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}
@media (max-width: 768px) {
  .about-content {
    grid-template-columns: 1fr;
  }
}
</style>