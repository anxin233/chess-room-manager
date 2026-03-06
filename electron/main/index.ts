import { app, BrowserWindow, ipcMain, dialog, nativeImage, protocol, net } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs'
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

  // 设置窗口图标
  const iconPath = process.env.VITE_DEV_SERVER_URL
    ? join(__dirname, '../../build/icon.ico')  // 开发环境: dist-electron/main -> build
    : join(process.resourcesPath, 'build/icon.ico')  // 生产环境

  console.log('Icon path:', iconPath)
  console.log('Icon exists:', existsSync(iconPath))

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true, // 隐藏菜单栏
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  // 监听 preload 脚本错误
  mainWindow.webContents.on('preload-error', (_event, _preloadPath, error) => {
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
  // 注册自定义协议来处理图片
  protocol.handle('app', (request) => {
    const url = request.url.slice('app://'.length)
    const userDataPath = app.getPath('userData')
    const filePath = join(userDataPath, url)

    if (!existsSync(filePath)) {
      return new Response('File not found', { status: 404 })
    }

    return net.fetch(`file://${filePath}`)
  })

  // 初始化数据库
  try {
    console.log('Starting database initialization...')
    initDatabase()
    console.log('Database initialized at:', getDatabasePath())
  } catch (error) {
    console.error('Failed to initialize database:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    app.quit()
    return
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
ipcMain.handle('db:members:search', (_, keyword: string) => dbServices.searchMembers(keyword))
ipcMain.handle('db:members:create', (_, member) => dbServices.createMember(member))
ipcMain.handle('db:members:update', (_, id: number, member) => dbServices.updateMember(id, member))
ipcMain.handle('db:members:delete', (_, id: number) => dbServices.deleteMember(id))

// 订单管理
ipcMain.handle('db:orders:getAll', () => dbServices.getAllOrders())
ipcMain.handle('db:orders:getById', (_, id: number) => dbServices.getOrderById(id))
ipcMain.handle('db:orders:getByStatus', (_, status: string) => dbServices.getOrdersByStatus(status))
ipcMain.handle('db:orders:create', (_, order) => dbServices.createOrder(order))
ipcMain.handle('db:orders:update', (_, id: number, order) => dbServices.updateOrder(id, order))
ipcMain.handle('db:orders:createWithProducts', (_, orderData, products) =>
  dbServices.createOrderWithProducts(orderData, products)
)
ipcMain.handle('db:orders:complete', (_, data) => dbServices.completeOrder(data))
ipcMain.handle('db:orders:cancel', (_, orderId: number) => dbServices.cancelOrder(orderId))

// 商品分类管理
ipcMain.handle('db:productCategories:getAll', () => dbServices.getAllProductCategories())
ipcMain.handle('db:productCategories:getById', (_, id: number) => dbServices.getProductCategoryById(id))
ipcMain.handle('db:productCategories:create', (_, category) => dbServices.createProductCategory(category))
ipcMain.handle('db:productCategories:update', (_, id: number, category) => dbServices.updateProductCategory(id, category))
ipcMain.handle('db:productCategories:delete', (_, id: number) => dbServices.deleteProductCategory(id))

// 商品管理
ipcMain.handle('db:products:getAll', () => dbServices.getAllProducts())
ipcMain.handle('db:products:getById', (_, id: number) => dbServices.getProductById(id))
ipcMain.handle('db:products:getByCategoryId', (_, categoryId: number) => dbServices.getProductsByCategoryId(categoryId))
ipcMain.handle('db:products:create', (_, product) => dbServices.createProduct(product))
ipcMain.handle('db:products:update', (_, id: number, product) => dbServices.updateProduct(id, product))
ipcMain.handle('db:products:delete', (_, id: number) => dbServices.deleteProduct(id))

// 商品销售管理
ipcMain.handle('db:productSales:create', (_, sale) => dbServices.createProductSale(sale))
ipcMain.handle('db:productSales:getByOrderId', (_, orderId: number) => dbServices.getProductSalesByOrderId(orderId))
ipcMain.handle('db:productSales:getAll', () => dbServices.getAllProductSales())
ipcMain.handle('db:productSales:delete', (_, id: number) => dbServices.deleteProductSale(id))

// 充值管理
ipcMain.handle('db:recharges:create', (_, recharge) => dbServices.createRecharge(recharge))
ipcMain.handle('db:recharges:getByMemberId', (_, memberId: number) => dbServices.getRechargesByMemberId(memberId))
ipcMain.handle('db:recharges:getAll', () => dbServices.getAllRecharges())

// 图片上传
ipcMain.handle('upload-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    ]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const sourcePath = result.filePaths[0]
  const fileName = `product_${Date.now()}.jpg` // 统一保存为 jpg

  // 保存到 userData/images 目录
  const userDataPath = app.getPath('userData')
  const imagesDir = join(userDataPath, 'images')

  if (!existsSync(imagesDir)) {
    mkdirSync(imagesDir, { recursive: true })
  }

  const destPath = join(imagesDir, fileName)

  try {
    // 使用 nativeImage 压缩图片
    const image = nativeImage.createFromPath(sourcePath)
    const size = image.getSize()

    // 如果图片宽度或高度超过 800px，则缩放
    const maxSize = 800
    let resizedImage = image

    if (size.width > maxSize || size.height > maxSize) {
      const aspectRatio = size.width / size.height
      let newWidth = size.width
      let newHeight = size.height

      if (size.width > size.height) {
        newWidth = maxSize
        newHeight = Math.round(maxSize / aspectRatio)
      } else {
        newHeight = maxSize
        newWidth = Math.round(maxSize * aspectRatio)
      }

      resizedImage = image.resize({ width: newWidth, height: newHeight, quality: 'good' })
    }

    // 保存为 JPEG 格式，质量 80
    const jpegBuffer = resizedImage.toJPEG(80)
    writeFileSync(destPath, jpegBuffer)

    console.log(`[Image] Saved compressed image: ${fileName}, original size: ${size.width}x${size.height}`)

    // 返回相对路径
    return `images/${fileName}`
  } catch (error) {
    console.error('[Image] Error processing image:', error)
    // 如果压缩失败，直接复制原文件
    copyFileSync(sourcePath, destPath)
    return `images/${fileName}`
  }
})

// 获取图片完整路径（保留用于兼容性，但不再使用）
ipcMain.handle('get-image-path', (_, relativePath: string) => {
  if (!relativePath) return null
  // 返回自定义协议 URL
  return `app://${relativePath}`
})

ipcMain.handle('db:members:getStats', (_, memberId: number) => dbServices.getMemberStats(memberId))

// 数据库备份
ipcMain.handle('backup-database', async () => {
  const result = await dialog.showSaveDialog({
    title: '备份数据库',
    defaultPath: `chess-room-backup-${new Date().toISOString().slice(0, 10)}.db`,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  })
  if (result.canceled || !result.filePath) return { success: false }
  try {
    const dbPath = getDatabasePath()
    copyFileSync(dbPath, result.filePath)
    return { success: true, path: result.filePath }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// 数据库恢复
ipcMain.handle('restore-database', async () => {
  const result = await dialog.showOpenDialog({
    title: '恢复数据库',
    filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    properties: ['openFile']
  })
  if (result.canceled || result.filePaths.length === 0) return { success: false }
  try {
    const dbPath = getDatabasePath()
    const backupPath = `${dbPath}.bak-${Date.now()}`
    copyFileSync(dbPath, backupPath)
    closeDatabase()
    copyFileSync(result.filePaths[0], dbPath)
    initDatabase()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// CSV 导出
ipcMain.handle('export-csv', async (_, csvContent: string, defaultName: string) => {
  const result = await dialog.showSaveDialog({
    title: '导出数据',
    defaultPath: defaultName || 'export.csv',
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  })
  if (result.canceled || !result.filePath) return { success: false }
  try {
    writeFileSync(result.filePath, '\uFEFF' + csvContent, 'utf-8')
    return { success: true, path: result.filePath }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})
