<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const appStore = useAppStore()
const userStore = useUserStore()

const userName = ref(userStore.user?.name || '')
const userEmail = ref(userStore.user?.email || '')

const saveUserInfo = () => {
  if (userName.value && userEmail.value) {
    userStore.login({
      id: Date.now().toString(),
      name: userName.value,
      email: userEmail.value
    })
    alert('用户信息已保存')
  } else {
    alert('请填写完整信息')
  }
}

const clearUserInfo = () => {
  userStore.logout()
  userName.value = ''
  userEmail.value = ''
  alert('用户信息已清除')
}
</script>

<template>
  <div class="settings-container">
    <h1>设置</h1>

    <div class="settings-section">
      <h2>主题设置</h2>
      <div class="theme-selector">
        <button
          :class="{ active: appStore.theme === 'light' }"
          @click="appStore.setTheme('light')"
        >
          ☀️ 浅色主题
        </button>
        <button
          :class="{ active: appStore.theme === 'dark' }"
          @click="appStore.setTheme('dark')"
        >
          🌙 深色主题
        </button>
      </div>
      <p class="hint">当前主题: {{ appStore.theme === 'light' ? '浅色' : '深色' }}</p>
    </div>

    <div class="settings-section">
      <h2>用户信息</h2>
      <div class="form-group">
        <label>用户名</label>
        <input
          v-model="userName"
          type="text"
          placeholder="请输入用户名"
        />
      </div>
      <div class="form-group">
        <label>邮箱</label>
        <input
          v-model="userEmail"
          type="email"
          placeholder="请输入邮箱"
        />
      </div>
      <div class="button-group">
        <button @click="saveUserInfo" class="save-btn">保存</button>
        <button @click="clearUserInfo" class="clear-btn">清除</button>
      </div>
      <div v-if="userStore.isLoggedIn" class="user-status">
        <p>✅ 已登录用户: {{ userStore.userName }}</p>
        <p>📧 邮箱: {{ userStore.userEmail }}</p>
      </div>
    </div>

    <div class="settings-section">
      <h2>应用信息</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">应用版本:</span>
          <span class="value">{{ appStore.appVersion || '加载中...' }}</span>
        </div>
        <div class="info-item">
          <span class="label">应用路径:</span>
          <span class="value path">{{ appStore.appPath || '加载中...' }}</span>
        </div>
        <div class="info-item">
          <span class="label">当前主题:</span>
          <span class="value">{{ appStore.theme }}</span>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h2>开发者选项</h2>
      <div class="dev-options">
        <button @click="() => location.reload()">🔄 重新加载应用</button>
        <button @click="() => localStorage.clear()">🗑️ 清除本地存储</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #42b883;
}

.settings-section {
  margin-bottom: 2.5rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.settings-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #42b883;
  border-bottom: 2px solid rgba(66, 184, 131, 0.3);
  padding-bottom: 0.5rem;
}

.theme-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.theme-selector button {
  flex: 1;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.theme-selector button.active {
  border-color: #42b883;
  background: rgba(66, 184, 131, 0.2);
}

.hint {
  color: #888;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #42b883;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.8rem;
  font-size: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: inherit;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #42b883;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.save-btn {
  background: linear-gradient(45deg, #42b883, #35495e);
  border: none;
  color: white;
}

.clear-btn {
  background: #f56c6c;
  border: none;
  color: white;
}

.user-status {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(66, 184, 131, 0.1);
  border-radius: 8px;
  border-left: 4px solid #42b883;
}

.user-status p {
  margin: 0.5rem 0;
  color: #42b883;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.label {
  font-weight: 500;
  color: #42b883;
}

.value {
  color: #888;
}

.path {
  word-break: break-all;
  font-size: 0.85rem;
  max-width: 60%;
  text-align: right;
}

.dev-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.dev-options button {
  flex: 1;
  min-width: 200px;
}
</style>
