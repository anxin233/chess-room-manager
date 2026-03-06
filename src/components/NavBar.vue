<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { name: 'Home', path: '/', label: '首页', icon: '🏠' },
  { name: 'DatabaseDemo', path: '/database-demo', label: '数据库测试', icon: '💾' },
  { name: 'About', path: '/about', label: '关于', icon: 'ℹ️' },
  { name: 'Settings', path: '/settings', label: '设置', icon: '⚙️' }
]

const isActive = (path: string) => {
  return route.path === path
}
</script>

<template>
  <nav class="navbar">
    <div class="nav-brand">
      <span class="logo">🎮</span>
      <span class="brand-name">棋牌室管理系统</span>
    </div>
    <div class="nav-links">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="item.path"
        :class="{ active: isActive(item.path) }"
        class="nav-link"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  font-weight: bold;
}

.logo {
  font-size: 1.5rem;
}

.brand-name {
  background: linear-gradient(45deg, #42b883, #35495e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  text-decoration: none;
  color: #888;
  transition: all 0.3s;
  position: relative;
}

.nav-link:hover {
  color: #42b883;
  background: rgba(66, 184, 131, 0.1);
}

.nav-link.active {
  color: #42b883;
  background: rgba(66, 184, 131, 0.2);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: #42b883;
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-label {
  font-weight: 500;
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    width: 100%;
    justify-content: center;
  }

  .nav-link {
    flex: 1;
    justify-content: center;
  }
}
</style>
