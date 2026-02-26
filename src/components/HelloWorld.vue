<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  msg: string
}>()

const count = ref(0)

const testIPC = async () => {
  if (window.electronAPI) {
    const result = await window.electronAPI.ping()
    alert(`IPC 测试: ${result}`)
  }
}
</script>

<template>
  <div class="card">
    <h1>{{ msg }}</h1>

    <div class="button-group">
      <button type="button" @click="count++">
        计数: {{ count }}
      </button>

      <button type="button" @click="testIPC">
        测试 IPC 通信
      </button>
    </div>

    <p class="description">
      编辑 <code>src/App.vue</code> 来测试热重载
    </p>

    <p class="tip">
      这是一个专业的 Electron + Vite + Vue 3 基础框架
    </p>
  </div>
</template>

<style scoped>
.card {
  padding: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(45deg, #42b883, #35495e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 1.5rem 0;
}

.description {
  margin-top: 1.5rem;
  color: #888;
}

code {
  background-color: rgba(125, 125, 125, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.tip {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #42b883;
}
</style>
