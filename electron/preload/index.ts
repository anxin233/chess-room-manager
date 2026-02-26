import { contextBridge, ipcRenderer } from 'electron'
import type { Room, Member, Order, Product, Recharge } from '../main/database/types'

console.log('Preload script is running!')

// 类型定义
export interface ElectronAPI {
  ping: () => Promise<string>
  getAppVersion: () => Promise<string>
  getAppPath: () => Promise<string>

  // 数据库 API
  db: {
    rooms: {
      getAll: () => Promise<Room[]>
      getById: (id: number) => Promise<Room | null>
      create: (room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Room>
      update: (id: number, room: Partial<Room>) => Promise<Room | null>
      delete: (id: number) => Promise<boolean>
    }
    members: {
      getAll: () => Promise<Member[]>
      getById: (id: number) => Promise<Member | null>
      getByPhone: (phone: string) => Promise<Member | null>
      create: (member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Member>
      update: (id: number, member: Partial<Member>) => Promise<Member | null>
      delete: (id: number) => Promise<boolean>
    }
    orders: {
      getAll: () => Promise<Order[]>
      getById: (id: number) => Promise<Order | null>
      getByStatus: (status: string) => Promise<Order[]>
      create: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Order>
      update: (id: number, order: Partial<Order>) => Promise<Order | null>
    }
    products: {
      getAll: () => Promise<Product[]>
      getById: (id: number) => Promise<Product | null>
      create: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>
      update: (id: number, product: Partial<Product>) => Promise<Product | null>
      delete: (id: number) => Promise<boolean>
    }
    recharges: {
      create: (recharge: Omit<Recharge, 'id' | 'createdAt'>) => Promise<Recharge>
      getByMemberId: (memberId: number) => Promise<Recharge[]>
    }
  }
}

function toIpcPayload<T>(value: T): T {
  if (value === null || value === undefined) {
    return value
  }
  return JSON.parse(JSON.stringify(value)) as T
}

// 暴露安全的 API 到渲染进程
const electronAPI: ElectronAPI = {
  ping: () => ipcRenderer.invoke('ping'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  db: {
    rooms: {
      getAll: () => ipcRenderer.invoke('db:rooms:getAll'),
      getById: (id) => ipcRenderer.invoke('db:rooms:getById', id),
      create: (room) => ipcRenderer.invoke('db:rooms:create', toIpcPayload(room)),
      update: (id, room) => ipcRenderer.invoke('db:rooms:update', id, toIpcPayload(room)),
      delete: (id) => ipcRenderer.invoke('db:rooms:delete', id)
    },
    members: {
      getAll: () => ipcRenderer.invoke('db:members:getAll'),
      getById: (id) => ipcRenderer.invoke('db:members:getById', id),
      getByPhone: (phone) => ipcRenderer.invoke('db:members:getByPhone', phone),
      create: (member) => ipcRenderer.invoke('db:members:create', toIpcPayload(member)),
      update: (id, member) => ipcRenderer.invoke('db:members:update', id, toIpcPayload(member)),
      delete: (id) => ipcRenderer.invoke('db:members:delete', id)
    },
    orders: {
      getAll: () => ipcRenderer.invoke('db:orders:getAll'),
      getById: (id) => ipcRenderer.invoke('db:orders:getById', id),
      getByStatus: (status) => ipcRenderer.invoke('db:orders:getByStatus', status),
      create: (order) => ipcRenderer.invoke('db:orders:create', toIpcPayload(order)),
      update: (id, order) => ipcRenderer.invoke('db:orders:update', id, toIpcPayload(order))
    },
    products: {
      getAll: () => ipcRenderer.invoke('db:products:getAll'),
      getById: (id) => ipcRenderer.invoke('db:products:getById', id),
      create: (product) => ipcRenderer.invoke('db:products:create', toIpcPayload(product)),
      update: (id, product) => ipcRenderer.invoke('db:products:update', id, toIpcPayload(product)),
      delete: (id) => ipcRenderer.invoke('db:products:delete', id)
    },
    recharges: {
      create: (recharge) => ipcRenderer.invoke('db:recharges:create', toIpcPayload(recharge)),
      getByMemberId: (memberId) => ipcRenderer.invoke('db:recharges:getByMemberId', memberId)
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

console.log('Electron API exposed to window.electronAPI')
