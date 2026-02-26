<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="not-found-container">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面未找到</h2>
      <p class="error-description">
        抱歉，您访问的页面不存在或已被移除。
      </p>
      <button @click="goHome" class="home-button">
        返回首页
      </button>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 2rem;
}

.error-content {
  text-align: center;
}

.error-code {
  font-size: 8rem;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(45deg, #42b883, #35495e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.error-title {
  font-size: 2rem;
  margin: 1rem 0;
  color: #42b883;
}

.error-description {
  font-size: 1.1rem;
  color: #888;
  margin-bottom: 2rem;
}

.home-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: linear-gradient(45deg, #42b883, #35495e);
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 8px;
  transition: transform 0.3s;
}

.home-button:hover {
  transform: scale(1.05);
}
</style>
