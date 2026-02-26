import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const appVersion = ref<string>('')
  const appPath = ref<string>('')
  const theme = ref<'light' | 'dark'>('dark')
  const isLoading = ref(false)

  // 计算属性
  const isDarkTheme = computed(() => theme.value === 'dark')

  // 方法
  const setAppInfo = (version: string, path: string) => {
    appVersion.value = version
    appPath.value = path
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    // 可以在这里添加主题切换的副作用
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  // 初始化应用信息
  const initAppInfo = async () => {
    if (window.electronAPI) {
      try {
        setLoading(true)
        const [version, path] = await Promise.all([
          window.electronAPI.getAppVersion(),
          window.electronAPI.getAppPath()
        ])
        setAppInfo(version, path)
      } catch (error) {
        console.error('获取应用信息失败:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  return {
    // 状态
    appVersion,
    appPath,
    theme,
    isLoading,
    // 计算属性
    isDarkTheme,
    // 方法
    setAppInfo,
    toggleTheme,
    setTheme,
    setLoading,
    initAppInfo
  }
})
