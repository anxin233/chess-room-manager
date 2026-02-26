<script setup lang="ts">
import { onMounted } from 'vue'
import { useCounterStore } from '@/stores/counter'
import { useAppStore } from '@/stores/app'

const counterStore = useCounterStore()
const appStore = useAppStore()

onMounted(async () => {
  await appStore.initAppInfo()
})
</script>

<template>
  <div class="home-container">
    <div class="hero-section">
      <h1 class="title">欢迎使用 Electron + Vue 3</h1>
      <p class="subtitle">一个现代化的桌面应用开发框架</p>
    </div>

    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>极速开发</h3>
        <p>Vite 提供闪电般的热重载体验</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🎯</div>
        <h3>类型安全</h3>
        <p>TypeScript 全栈类型支持</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>安全可靠</h3>
        <p>Context Isolation 保障安全</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🎨</div>
        <h3>现代化</h3>
        <p>Vue 3 Composition API</p>
      </div>
    </div>

    <div class="counter-section">
      <h2>计数器示例（Pinia 状态管理）</h2>
      <div class="counter-display">{{ counterStore.count }}</div>
      <div class="counter-buttons">
        <button @click="counterStore.decrement">-1</button>
        <button @click="counterStore.increment">+1</button>
        <button @click="counterStore.incrementBy(5)">+5</button>
        <button @click="counterStore.reset" class="reset-btn">重置</button>
      </div>
      <div v-if="counterStore.history.length > 0" class="history">
        <p>历史记录: {{ counterStore.history.join(', ') }}</p>
      </div>
    </div>

    <div class="app-info" v-if="appStore.appVersion">
      <p><strong>应用版本:</strong> {{ appStore.appVersion }}</p>
      <p class="path"><strong>应用路径:</strong> {{ appStore.appPath }}</p>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-size: 3rem;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #42b883, #35495e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.2rem;
  color: #888;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.feature-card {
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(66, 184, 131, 0.2);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  margin-bottom: 0.5rem;
  color: #42b883;
}

.feature-card p {
  color: #888;
  font-size: 0.9rem;
}

.counter-section {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 2rem;
}

.counter-section h2 {
  margin-bottom: 1.5rem;
  color: #42b883;
}

.counter-display {
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #42b883;
}

.counter-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.counter-buttons button {
  min-width: 80px;
}

.reset-btn {
  background-color: #f56c6c !important;
}

.reset-btn:hover {
  border-color: #f56c6c !important;
}

.history {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  font-size: 0.9rem;
  color: #888;
}

.app-info {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.9rem;
}

.app-info p {
  margin: 0.5rem 0;
  color: #888;
}

.path {
  word-break: break-all;
  font-size: 0.8rem;
}
</style>
