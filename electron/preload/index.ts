import { contextBridge, ipcRenderer } from 'electron'

// 类型定义
export interface ElectronAPI {
  ping: () => Promise<string>
  getAppVersion: () => Promise<string>
  getAppPath: () => Promise<string>
}

// 暴露安全的 API 到渲染进程
const electronAPI: ElectronAPI = {
  ping: () => ipcRenderer.invoke('ping'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path')
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
