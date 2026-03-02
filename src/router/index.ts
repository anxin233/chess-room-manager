import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/hall'
  },
  {
    path: '/hall',
    name: 'Hall',
    component: () => import('@/views/Hall.vue'),
    meta: {
      title: '营业大厅'
    }
  },
  {
    path: '/rooms',
    name: 'RoomManagement',
    component: () => import('@/views/RoomManagement.vue'),
    meta: {
      title: '房间管理'
    }
  },
  {
    path: '/members',
    name: 'MemberManagement',
    component: () => import('@/views/MemberManagement.vue'),
    meta: {
      title: '会员管理'
    }
  },
  {
    path: '/products',
    name: 'ProductManagement',
    component: () => import('@/views/ProductManagement.vue'),
    meta: {
      title: '商品管理'
    }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/Statistics.vue'),
    meta: {
      title: '数据统计'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      title: '系统设置'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '404'
    }
  }
]

const router = createRouter({
  // 使用 hash 模式，适合 Electron 应用
  history: createWebHashHistory(),
  routes
})

// 路由守卫：设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 棋牌室管理系统`
  }
  next()
})

export default router
