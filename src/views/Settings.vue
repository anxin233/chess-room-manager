<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { Sunny, Moon } from '@element-plus/icons-vue'

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
    ElMessage.success('用户信息已保存')
  } else {
    ElMessage.warning('请填写完整信息')
  }
}

const clearUserInfo = () => {
  userStore.logout()
  userName.value = ''
  userEmail.value = ''
  ElMessage.success('用户信息已清除')
}

const reloadApp = () => {
  window.location.reload()
}

const clearStorage = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将清除所有本地存储数据（主题设置等），不可恢复。确定继续吗？',
      '警告',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    window.localStorage.clear()
    ElMessage.success('本地存储已清除，重新加载后生效')
  } catch { /* cancelled */ }
}

// 数据备份
const backupLoading = ref(false)
const backupDatabase = async () => {
  backupLoading.value = true
  try {
    const result = await window.electronAPI.backupDatabase()
    if (result.success) {
      ElMessage.success(`备份成功：${result.path}`)
    } else if (result.error) {
      ElMessage.error(`备份失败：${result.error}`)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '备份失败')
  } finally {
    backupLoading.value = false
  }
}

// 数据恢复
const restoreDatabase = async () => {
  try {
    await ElMessageBox.confirm(
      '恢复数据库将替换当前所有数据，当前数据会自动备份。确定继续吗？',
      '恢复数据库',
      { confirmButtonText: '确定恢复', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  backupLoading.value = true
  try {
    const result = await window.electronAPI.restoreDatabase()
    if (result.success) {
      ElMessage.success('数据恢复成功，正在重新加载...')
      setTimeout(() => window.location.reload(), 1500)
    } else if (result.error) {
      ElMessage.error(`恢复失败：${result.error}`)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '恢复失败')
  } finally {
    backupLoading.value = false
  }
}
</script>

<template>
  <div class="settings-container">
    <h1 class="settings-title">设置</h1>

    <div class="settings-section">
      <h2>主题设置</h2>
      <div class="theme-selector">
        <div
          :class="['theme-option', { active: appStore.theme === 'light' }]"
          @click="appStore.setTheme('light')"
        >
          <div class="theme-preview light-preview">
            <div class="preview-sidebar"></div>
            <div class="preview-content">
              <div class="preview-bar"></div>
              <div class="preview-cards">
                <div class="preview-card"></div>
                <div class="preview-card"></div>
              </div>
            </div>
          </div>
          <div class="theme-label">
            <el-icon :size="16"><Sunny /></el-icon>
            <span>浅色主题</span>
          </div>
        </div>

        <div
          :class="['theme-option', { active: appStore.theme === 'dark' }]"
          @click="appStore.setTheme('dark')"
        >
          <div class="theme-preview dark-preview">
            <div class="preview-sidebar"></div>
            <div class="preview-content">
              <div class="preview-bar"></div>
              <div class="preview-cards">
                <div class="preview-card"></div>
                <div class="preview-card"></div>
              </div>
            </div>
          </div>
          <div class="theme-label">
            <el-icon :size="16"><Moon /></el-icon>
            <span>深色主题</span>
          </div>
        </div>
      </div>
      <p class="hint">当前主题: {{ appStore.theme === 'light' ? '浅色' : '深色' }}</p>
    </div>

    <div class="settings-section">
      <h2>用户信息</h2>
      <div class="form-group">
        <label>用户名</label>
        <el-input v-model="userName" placeholder="请输入用户名" />
      </div>
      <div class="form-group">
        <label>邮箱</label>
        <el-input v-model="userEmail" type="email" placeholder="请输入邮箱" />
      </div>
      <div class="button-group">
        <el-button type="primary" @click="saveUserInfo">保存</el-button>
        <el-button type="danger" @click="clearUserInfo">清除</el-button>
      </div>
      <div v-if="userStore.isLoggedIn" class="user-status">
        <p>已登录用户: {{ userStore.userName }}</p>
        <p>邮箱: {{ userStore.userEmail }}</p>
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
          <span class="value">{{ appStore.theme === 'light' ? '浅色' : '深色' }}</span>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h2>数据管理</h2>
      <p class="section-desc">备份和恢复数据库文件。备份会导出完整数据库，恢复前会自动为当前数据创建备份。</p>
      <div class="backup-actions">
        <el-button type="primary" :loading="backupLoading" @click="backupDatabase">
          备份数据库
        </el-button>
        <el-button type="warning" :loading="backupLoading" @click="restoreDatabase">
          恢复数据库
        </el-button>
      </div>
    </div>

    <div class="settings-section">
      <h2>开发者选项</h2>
      <div class="dev-options">
        <el-button @click="reloadApp">重新加载应用</el-button>
        <el-button @click="clearStorage">清除本地存储</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  padding: 28px;
  max-width: 900px;
  margin: 0 auto;
}

.settings-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 28px;
  padding: 20px 24px;
  color: var(--text-primary);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  letter-spacing: -0.02em;
}

.settings-section {
  margin-bottom: 20px;
  padding: 24px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  transition: background-color var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
}

.settings-section h2 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
  padding-bottom: 12px;
  transition: color var(--transition-normal), border-color var(--transition-normal);
}

/* 主题选择器 */
.theme-selector {
  display: flex;
  gap: 16px;
  margin-bottom: 1rem;
}

.theme-option {
  flex: 1;
  cursor: pointer;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 12px;
  transition: all var(--transition-normal);
}

.theme-option:hover {
  border-color: #409eff;
}

.theme-option.active {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
}

.theme-preview {
  display: flex;
  height: 80px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: 10px;
}

.light-preview {
  background: #f0f2f5;
}

.light-preview .preview-sidebar {
  width: 30%;
  background: #ffffff;
  border-right: 1px solid #e5e6eb;
}

.light-preview .preview-content {
  flex: 1;
  padding: 8px;
}

.light-preview .preview-bar {
  height: 10px;
  background: #ffffff;
  border-radius: 4px;
  margin-bottom: 8px;
}

.light-preview .preview-cards {
  display: flex;
  gap: 6px;
}

.light-preview .preview-card {
  flex: 1;
  height: 40px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #e5e6eb;
}

.dark-preview {
  background: #17171a;
}

.dark-preview .preview-sidebar {
  width: 30%;
  background: #232324;
  border-right: 1px solid #333335;
}

.dark-preview .preview-content {
  flex: 1;
  padding: 8px;
}

.dark-preview .preview-bar {
  height: 10px;
  background: #232324;
  border-radius: 4px;
  margin-bottom: 8px;
}

.dark-preview .preview-cards {
  display: flex;
  gap: 6px;
}

.dark-preview .preview-card {
  flex: 1;
  height: 40px;
  background: #232324;
  border-radius: 6px;
  border: 1px solid #333335;
}

.theme-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-regular);
  transition: color var(--transition-normal);
}

.theme-option.active .theme-label {
  color: #409eff;
}

.hint {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 0.5rem;
  transition: color var(--transition-normal);
}

/* 表单 */
.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 13px;
  transition: color var(--transition-normal);
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 1rem;
}

.user-status {
  margin-top: 1.25rem;
  padding: 14px;
  background: var(--bg-muted);
  border-radius: var(--radius-sm);
  border-left: 3px solid #409eff;
  transition: background-color var(--transition-normal);
}

.user-status p {
  margin: 0.4rem 0;
  color: var(--text-regular);
  font-size: 13px;
}

/* 应用信息 */
.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg-muted);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-normal);
}

.info-item .label {
  font-weight: 500;
  font-size: 13px;
  color: var(--text-primary);
  transition: color var(--transition-normal);
}

.info-item .value {
  font-size: 13px;
  color: var(--text-secondary);
  transition: color var(--transition-normal);
}

.path {
  word-break: break-all;
  font-size: 0.85rem;
  max-width: 60%;
  text-align: right;
}

/* 数据管理 */
.section-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.6;
}

.backup-actions {
  display: flex;
  gap: 12px;
}

/* 开发者选项 */
.dev-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>
