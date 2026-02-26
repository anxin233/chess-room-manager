import { app, BrowserWindow, ipcMain } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { initDatabase, closeDatabase, getDatabasePath } from './database/index'
import * as dbServices from './database/services'

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 禁用硬件加速（可选）
// app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  const preloadPath = join(__dirname, '../preload/index.cjs')
  console.log('Preload script path:', preloadPath)

  // 检查文件是否存在
  if (existsSync(preloadPath)) {
    console.log('✓ Preload script file exists')
  } else {
    console.error('✗ Preload script file NOT found!')
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  // 监听 preload 脚本错误
  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('Preload script error:', error)
  })

  // 开发环境加载 Vite 开发服务器
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()

    // 等待页面加载完成后检查 preload 是否成功
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Page loaded, preload script should be active')
    })
  } else {
    // 生产环境加载构建后的文件
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 应用准备就绪
app.whenReady().then(() => {
  // 初始化数据库
  try {
    initDatabase()
    console.log('Database initialized at:', getDatabasePath())
  } catch (error) {
    console.error('Failed to initialize database:', error)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭
app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出前关闭数据库
app.on('before-quit', () => {
  closeDatabase()
})

// IPC 通信示例
ipcMain.handle('ping', () => 'pong')

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-app-path', () => {
  return app.getAppPath()
})

// ==================== 数据库 IPC 接口 ====================

// 房间管理
ipcMain.handle('db:rooms:getAll', () => dbServices.getAllRooms())
ipcMain.handle('db:rooms:getById', (_, id: number) => dbServices.getRoomById(id))
ipcMain.handle('db:rooms:create', (_, room) => dbServices.createRoom(room))
ipcMain.handle('db:rooms:update', (_, id: number, room) => dbServices.updateRoom(id, room))
ipcMain.handle('db:rooms:delete', (_, id: number) => dbServices.deleteRoom(id))

// 会员管理
ipcMain.handle('db:members:getAll', () => dbServices.getAllMembers())
ipcMain.handle('db:members:getById', (_, id: number) => dbServices.getMemberById(id))
ipcMain.handle('db:members:getByPhone', (_, phone: string) => dbServices.getMemberByPhone(phone))
ipcMain.handle('db:members:create', (_, member) => dbServices.createMember(member))
ipcMain.handle('db:members:update', (_, id: number, member) => dbServices.updateMember(id, member))
ipcMain.handle('db:members:delete', (_, id: number) => dbServices.deleteMember(id))

// 订单管理
ipcMain.handle('db:orders:getAll', () => dbServices.getAllOrders())
ipcMain.handle('db:orders:getById', (_, id: number) => dbServices.getOrderById(id))
ipcMain.handle('db:orders:getByStatus', (_, status: string) => dbServices.getOrdersByStatus(status))
ipcMain.handle('db:orders:create', (_, order) => dbServices.createOrder(order))
ipcMain.handle('db:orders:update', (_, id: number, order) => dbServices.updateOrder(id, order))

// 商品管理
ipcMain.handle('db:products:getAll', () => dbServices.getAllProducts())
ipcMain.handle('db:products:getById', (_, id: number) => dbServices.getProductById(id))
ipcMain.handle('db:products:create', (_, product) => dbServices.createProduct(product))
ipcMain.handle('db:products:update', (_, id: number, product) => dbServices.updateProduct(id, product))
ipcMain.handle('db:products:delete', (_, id: number) => dbServices.deleteProduct(id))

// 充值管理
ipcMain.handle('db:recharges:create', (_, recharge) => dbServices.createRecharge(recharge))
ipcMain.handle('db:recharges:getByMemberId', (_, memberId: number) => dbServices.getRechargesByMemberId(memberId))
