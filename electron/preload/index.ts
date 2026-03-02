import { contextBridge, ipcRenderer } from 'electron'
import type { Room, Member, Order, Product, ProductCategory, Recharge, ProductSale } from '../main/database/types'

console.log('Preload script is running!')

// 类型定义
export interface ElectronAPI {
  ping: () => Promise<string>
  getAppVersion: () => Promise<string>
  getAppPath: () => Promise<string>
  uploadImage: () => Promise<string | null>
  getImagePath: (relativePath: string) => Promise<string | null>

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
      getStats: (id: number) => Promise<{
        totalRecharged: number
        totalReceived: number
        totalBonus: number
        totalSpent: number
        discountRate: number
      }>
    }
    orders: {
      getAll: () => Promise<Order[]>
      getById: (id: number) => Promise<Order | null>
      getByStatus: (status: string) => Promise<Order[]>
      create: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Order>
      update: (id: number, order: Partial<Order>) => Promise<Order | null>
    }
    productCategories: {
      getAll: () => Promise<ProductCategory[]>
      getById: (id: number) => Promise<ProductCategory | null>
      create: (category: { name: string; sortOrder?: number }) => Promise<ProductCategory>
      update: (id: number, category: { name?: string; sortOrder?: number }) => Promise<ProductCategory | null>
      delete: (id: number) => Promise<boolean>
    }
    products: {
      getAll: () => Promise<Product[]>
      getById: (id: number) => Promise<Product | null>
      getByCategoryId: (categoryId: number) => Promise<Product[]>
      create: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>
      update: (id: number, product: Partial<Product>) => Promise<Product | null>
      delete: (id: number) => Promise<boolean>
    }
    productSales: {
      create: (sale: Omit<ProductSale, 'id' | 'createdAt'>) => Promise<ProductSale>
      getByOrderId: (orderId: number) => Promise<ProductSale[]>
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
  uploadImage: () => ipcRenderer.invoke('upload-image'),
  getImagePath: (relativePath) => ipcRenderer.invoke('get-image-path', relativePath),

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
      delete: (id) => ipcRenderer.invoke('db:members:delete', id),
      getStats: (id) => ipcRenderer.invoke('db:members:getStats', id)
    },
    orders: {
      getAll: () => ipcRenderer.invoke('db:orders:getAll'),
      getById: (id) => ipcRenderer.invoke('db:orders:getById', id),
      getByStatus: (status) => ipcRenderer.invoke('db:orders:getByStatus', status),
      create: (order) => ipcRenderer.invoke('db:orders:create', toIpcPayload(order)),
      update: (id, order) => ipcRenderer.invoke('db:orders:update', id, toIpcPayload(order))
    },
    productCategories: {
      getAll: () => ipcRenderer.invoke('db:productCategories:getAll'),
      getById: (id) => ipcRenderer.invoke('db:productCategories:getById', id),
      create: (category) => ipcRenderer.invoke('db:productCategories:create', toIpcPayload(category)),
      update: (id, category) => ipcRenderer.invoke('db:productCategories:update', id, toIpcPayload(category)),
      delete: (id) => ipcRenderer.invoke('db:productCategories:delete', id)
    },
    products: {
      getAll: () => ipcRenderer.invoke('db:products:getAll'),
      getById: (id) => ipcRenderer.invoke('db:products:getById', id),
      getByCategoryId: (categoryId) => ipcRenderer.invoke('db:products:getByCategoryId', categoryId),
      create: (product) => ipcRenderer.invoke('db:products:create', toIpcPayload(product)),
      update: (id, product) => ipcRenderer.invoke('db:products:update', id, toIpcPayload(product)),
      delete: (id) => ipcRenderer.invoke('db:products:delete', id)
    },
    productSales: {
      create: (sale) => ipcRenderer.invoke('db:productSales:create', toIpcPayload(sale)),
      getByOrderId: (orderId) => ipcRenderer.invoke('db:productSales:getByOrderId', orderId),
      getAll: () => ipcRenderer.invoke('db:productSales:getAll'),
      delete: (id) => ipcRenderer.invoke('db:productSales:delete', id)
    },
    recharges: {
      create: (recharge) => ipcRenderer.invoke('db:recharges:create', toIpcPayload(recharge)),
      getByMemberId: (memberId) => ipcRenderer.invoke('db:recharges:getByMemberId', memberId),
      getAll: () => ipcRenderer.invoke('db:recharges:getAll')
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

console.log('Electron API exposed to window.electronAPI')
