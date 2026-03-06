<script setup lang="ts">
const techStack = [
  { name: 'Electron', version: '^33.2.0', description: '跨平台桌面应用框架' },
  { name: 'Vite', version: '^6.0.0', description: '下一代前端构建工具' },
  { name: 'Vue 3', version: '^3.5.0', description: '渐进式 JavaScript 框架' },
  { name: 'TypeScript', version: '^5.7.0', description: '类型安全的 JavaScript' },
  { name: 'Vue Router', version: '^4.x', description: 'Vue 官方路由管理器' },
  { name: 'Pinia', version: '^2.x', description: 'Vue 官方状态管理库' }
]

const features = [
  '🔐 安全的进程间通信（IPC）',
  '⚡ Vite 极速热重载',
  '🎯 TypeScript 全栈支持',
  '🎨 Vue 3 Composition API',
  '🗂️ Vue Router 路由管理',
  '📦 Pinia 状态管理',
  '🔒 Context Isolation',
  '📱 响应式设计'
]

const testIPC = async () => {
  if (window.electronAPI) {
    const result = await window.electronAPI.ping()
    alert(`IPC 通信测试成功: ${result}`)
  } else {
    alert('Electron API 不可用')
  }
}
</script>

<template>
  <div class="about-container">
    <div class="header">
      <h1>关于本项目</h1>
      <p class="description">
        这是一个专业的 Electron + Vite + Vue 3 基础框架，
        为桌面应用开发提供现代化的开发体验和最佳实践。
      </p>
    </div>

    <div class="section">
      <h2>技术栈</h2>
      <div class="tech-grid">
        <div v-for="tech in techStack" :key="tech.name" class="tech-card">
          <h3>{{ tech.name }}</h3>
          <p class="version">{{ tech.version }}</p>
          <p class="desc">{{ tech.description }}</p>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>核心特性</h2>
      <ul class="features-list">
        <li v-for="feature in features" :key="feature">{{ feature }}</li>
      </ul>
    </div>

    <div class="section">
      <h2>IPC 通信测试</h2>
      <button @click="testIPC" class="test-button">测试 IPC 通信</button>
      <p class="hint">点击按钮测试主进程与渲染进程之间的通信</p>
    </div>

    <div class="section">
      <h2>项目结构</h2>
      <pre class="code-block">
electron_vue/
├── electron/              # Electron 相关代码
│   ├── main/             # 主进程
│   └── preload/          # 预加载脚本
├── src/                  # Vue 应用源码
│   ├── views/            # 页面组件
│   ├── stores/           # Pinia 状态管理
│   ├── router/           # Vue Router 路由
│   ├── components/       # 公共组件
│   └── assets/           # 静态资源
├── public/               # 公共资源
└── vite.config.ts        # Vite 配置
      </pre>
    </div>
  </div>
</template>

<style scoped>
.about-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #42b883;
}

.description {
  font-size: 1.1rem;
  color: #888;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
}

.section {
  margin-bottom: 3rem;
}

.section h2 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #42b883;
  border-bottom: 2px solid rgba(66, 184, 131, 0.3);
  padding-bottom: 0.5rem;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.tech-card {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 4px solid #42b883;
  transition: transform 0.3s;
}

.tech-card:hover {
  transform: translateX(5px);
}

.tech-card h3 {
  margin-bottom: 0.5rem;
  color: #42b883;
}

.version {
  font-family: 'Courier New', monospace;
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.desc {
  color: #aaa;
  font-size: 0.9rem;
}

.features-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.features-list li {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 1rem;
}

.test-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: linear-gradient(45deg, #42b883, #35495e);
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 8px;
  transition: transform 0.3s;
}

.test-button:hover {
  transform: scale(1.05);
}

.hint {
  margin-top: 1rem;
  color: #888;
  font-size: 0.9rem;
}

.code-block {
  background: rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #42b883;
}
</style>
