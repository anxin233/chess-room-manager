<script setup lang="ts">
import { onMounted } from 'vue'
import { useCounterStore } from '@/stores/counter'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'

const counterStore = useCounterStore()
const appStore = useAppStore()

onMounted(async () => {
  console.log('Home component mounted')
  console.log('window.electronAPI:', window.electronAPI)

  if (window.electronAPI) {
    console.log('✓ Electron API is available')
    await appStore.initAppInfo()
    ElMessage.success('应用初始化成功')
  } else {
    console.error('✗ Electron API is NOT available')
    ElMessage.error('Electron API 不可用')
  }
})

const handleIncrement = () => {
  counterStore.increment()
  ElMessage.success(`当前计数: ${counterStore.count}`)
}
</script>

<template>
  <div class="home-container">
    <el-card class="hero-section" shadow="hover">
      <h1 class="title">棋牌室管理系统</h1>
      <p class="subtitle">基于 Electron + Vue 3 + Element Plus</p>
    </el-card>

    <el-row :gutter="20" class="features-grid">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="feature-card">
          <el-icon :size="48" color="#409EFF"><Lightning /></el-icon>
          <h3>极速开发</h3>
          <p>Vite 提供闪电般的热重载体验</p>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="feature-card">
          <el-icon :size="48" color="#67C23A"><Aim /></el-icon>
          <h3>类型安全</h3>
          <p>TypeScript 全栈类型支持</p>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="feature-card">
          <el-icon :size="48" color="#E6A23C"><Lock /></el-icon>
          <h3>安全可靠</h3>
          <p>Context Isolation 保障安全</p>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="feature-card">
          <el-icon :size="48" color="#F56C6C"><Brush /></el-icon>
          <h3>现代化</h3>
          <p>Vue 3 Composition API</p>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="counter-section" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>计数器示例（Pinia 状态管理）</span>
        </div>
      </template>

      <div class="counter-display">{{ counterStore.count }}</div>

      <el-space wrap>
        <el-button type="primary" @click="counterStore.decrement" :icon="Minus">-1</el-button>
        <el-button type="success" @click="handleIncrement" :icon="Plus">+1</el-button>
        <el-button type="warning" @click="counterStore.incrementBy(5)">+5</el-button>
        <el-button type="danger" @click="counterStore.reset" :icon="RefreshLeft">重置</el-button>
      </el-space>

      <el-alert
        v-if="counterStore.history.length > 0"
        class="history"
        title="历史记录"
        type="info"
        :closable="false"
      >
        {{ counterStore.history.join(', ') }}
      </el-alert>
    </el-card>

    <el-card v-if="appStore.appVersion" class="app-info" shadow="hover">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="应用版本">
          <el-tag type="success">{{ appStore.appVersion }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="应用路径">
          <el-text class="path" type="info">{{ appStore.appPath }}</el-text>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
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
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.1rem;
  color: var(--el-text-color-secondary);
}

.features-grid {
  margin-bottom: 2rem;
}

.feature-card {
  text-align: center;
  height: 100%;
}

.feature-card h3 {
  margin: 1rem 0 0.5rem;
  color: var(--el-text-color-primary);
}

.feature-card p {
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

.counter-section {
  text-align: center;
  margin-bottom: 2rem;
}

.card-header {
  font-weight: bold;
  font-size: 1.1rem;
}

.counter-display {
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: var(--el-color-primary);
}

.history {
  margin-top: 1.5rem;
}

.app-info {
  margin-bottom: 2rem;
}

.path {
  word-break: break-all;
  font-size: 0.85rem;
}
</style>
