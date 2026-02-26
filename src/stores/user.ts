import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const isLoggedIn = ref(false)

  // 计算属性
  const userName = computed(() => user.value?.name || '游客')
  const userEmail = computed(() => user.value?.email || '')

  // 方法
  const login = (userData: User) => {
    user.value = userData
    isLoggedIn.value = true
    // 可以在这里保存到本地存储
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    user.value = null
    isLoggedIn.value = false
    localStorage.removeItem('user')
  }

  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  // 从本地存储恢复用户信息
  const restoreUser = () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        user.value = userData
        isLoggedIn.value = true
      } catch (error) {
        console.error('恢复用户信息失败:', error)
        localStorage.removeItem('user')
      }
    }
  }

  return {
    // 状态
    user,
    isLoggedIn,
    // 计算属性
    userName,
    userEmail,
    // 方法
    login,
    logout,
    updateUser,
    restoreUser
  }
})
