import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const THEME_KEY = 'chess-room-theme'

function applyThemeToDOM(theme: 'light' | 'dark') {
  const html = document.documentElement
  if (theme === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
  html.setAttribute('data-theme', theme)
}

function getSavedTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return 'light'
}

export const useAppStore = defineStore('app', () => {
  const appVersion = ref<string>('')
  const appPath = ref<string>('')
  const theme = ref<'light' | 'dark'>(getSavedTheme())
  const isLoading = ref(false)

  const isDarkTheme = computed(() => theme.value === 'dark')

  const setAppInfo = (version: string, path: string) => {
    appVersion.value = version
    appPath.value = path
  }

  const toggleTheme = () => {
    setTheme(theme.value === 'light' ? 'dark' : 'light')
  }

  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
    localStorage.setItem(THEME_KEY, newTheme)
    applyThemeToDOM(newTheme)
  }

  const initTheme = () => {
    applyThemeToDOM(theme.value)
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const initAppInfo = async () => {
    if (!window.electronAPI) {
      console.warn('Electron API 不可用，可能在浏览器环境中运行')
      return
    }

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

  return {
    appVersion,
    appPath,
    theme,
    isLoading,
    isDarkTheme,
    setAppInfo,
    toggleTheme,
    setTheme,
    initTheme,
    setLoading,
    initAppInfo
  }
})
