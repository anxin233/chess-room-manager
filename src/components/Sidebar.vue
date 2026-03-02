<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'
import {
  House,
  Grid,
  User,
  ShoppingCart,
  DataAnalysis,
  Setting
} from '@element-plus/icons-vue'

const route = useRoute()

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
      <div class="logo">
        <el-icon :size="32" color="#409EFF">
          <Grid />
        </el-icon>
      </div>
      <h1 class="title">棋牌室管理</h1>
    </div>

    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in menuItems"
        :key="item.name"
        :to="item.path"
        :class="['menu-item', { active: isActive(item.path) }]"
      >
        <el-icon :size="20">
          <component :is="item.icon" />
        </el-icon>
        <span class="menu-label">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <div class="version">v0.1.0</div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid #e4e7ed;
  text-align: center;
}

.logo {
  margin-bottom: 12px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 8px;
  text-decoration: none;
  color: #606266;
  transition: all 0.3s;
  cursor: pointer;
}

.menu-item:hover {
  background: #f5f7fa;
  color: #409EFF;
}

.menu-item.active {
  background: #ecf5ff;
  color: #409EFF;
  font-weight: 500;
}

.menu-label {
  font-size: 14px;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
  text-align: center;
}

.version {
  font-size: 12px;
  color: #909399;
}
</style>
