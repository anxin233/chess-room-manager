<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import { useUserStore } from './stores/user'
import { useAppStore } from './stores/app'

const userStore = useUserStore()
const appStore = useAppStore()

onMounted(() => {
  userStore.restoreUser()
  appStore.initTheme()
})
</script>

<template>
  <div class="app-container">
    <Sidebar />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-page);
  transition: background-color 0.3s;
}
</style>
