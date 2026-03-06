<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import {
  House,
  Grid,
  User,
  ShoppingCart,
  DataAnalysis,
  Setting,
  Sunny,
  Moon
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()

const menuItems = [
  { name: 'Hall', path: '/hall', label: '营业大厅', icon: House },
  { name: 'RoomManagement', path: '/rooms', label: '房间管理', icon: Grid },
  { name: 'MemberManagement', path: '/members', label: '会员管理', icon: User },
  { name: 'ProductManagement', path: '/products', label: '商品管理', icon: ShoppingCart },
  { name: 'Statistics', path: '/statistics', label: '数据统计', icon: DataAnalysis },
  { name: 'Settings', path: '/settings', label: '系统设置', icon: Setting }
]

const isActive = (path: string) => {
  return route.path === path
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo-wrapper">
        <div class="logo-icon">
          <el-icon :size="22" color="#fff">
            <Grid />
          </el-icon>
        </div>
        <h1 class="title">棋牌室管理</h1>
      </div>
    </div>

    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in menuItems"
        :key="item.name"
        :to="item.path"
        :class="['menu-item', { active: isActive(item.path) }]"
      >
        <el-icon :size="18">
          <component :is="item.icon" />
        </el-icon>
        <span class="menu-label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <div class="theme-toggle" @click="appStore.toggleTheme()">
        <el-icon :size="15">
          <Moon v-if="appStore.isDarkTheme" />
          <Sunny v-else />
        </el-icon>
        <span>{{ appStore.isDarkTheme ? '深色模式' : '浅色模式' }}</span>
      </div>
      <div class="version">v0.1.0</div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  height: 100vh;
  transition: background-color var(--transition-normal), border-color var(--transition-normal);
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid var(--border-light);
  transition: border-color var(--transition-normal);
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #409EFF, #337ecc);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  transition: color var(--transition-normal);
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin-bottom: 2px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text-regular);
  font-size: 14px;
  transition: all var(--transition-fast);
  cursor: pointer;
  position: relative;
}

.menu-item:hover {
  background: var(--hover-bg);
  color: #409EFF;
}

.menu-item.active {
  background: var(--active-bg);
  color: #409EFF;
  font-weight: 500;
}

.menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  background: #409EFF;
  border-radius: 0 3px 3px 0;
}

.menu-label {
  font-size: 14px;
}

.sidebar-footer {
  padding: 12px 16px 16px;
  border-top: 1px solid var(--border-light);
  text-align: center;
  transition: border-color var(--transition-normal);
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.theme-toggle:hover {
  background: var(--hover-bg);
  color: #409EFF;
}

.version {
  font-size: 11px;
  color: var(--text-placeholder);
  transition: color var(--transition-normal);
}
</style>
