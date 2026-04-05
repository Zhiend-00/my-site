<template>
  <div class="forum-anime">
    <h2>Форум по аниме</h2>
    <div v-for="n in 5" :key="n">Тема {{ n }}</div>
  </div>
</template>

		ForumCategory.vue
		<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const categoryName = ref(route.params.category)

const items = ref(
  Array.from({ length: 20 }, (_, i) => ({
    id: i+1,
    title: `${categoryName.value} ${i+1}`
  }))
)
</script>

<template>
  <div class="forum-category">
    <h1>{{ categoryName }}</h1>
    <div class="items-list">
      <div 
        v-for="item in items"
        :key="item.id"
        class="item panel"
      >
        {{ item.title }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.items-list {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 10px;
}

.item {
  padding: 10px;
  margin: 5px 0;
  cursor: pointer;
}
</style>