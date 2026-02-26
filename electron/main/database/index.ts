import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { createRequire } from 'module'

// 使用 createRequire 来加载原生模块
const require = createRequire(import.meta.url)
const Database = require('better-sqlite3')

let db: any = null

// 获取数据库路径
export function getDatabasePath(): string {
  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'data')

  // 确保数据目录存在
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  return join(dbDir, 'chess-room.db')
}

// 初始化数据库
export function initDatabase() {
  console.log('[DB] initDatabase called, db is:', db ? 'already initialized' : 'null')

  if (db) {
    return db
  }

  try {
    const dbPath = getDatabasePath()
    console.log('[DB] Database path:', dbPath)

    console.log('[DB] Creating database instance...')
    db = new Database(dbPath)
    console.log('[DB] Database instance created')

    db.pragma('journal_mode = WAL') // 启用 WAL 模式提升性能
    console.log('[DB] WAL mode enabled')

    // 创建表
    console.log('[DB] Creating tables...')
    createTables()
    console.log('[DB] Tables created')

    console.log('[DB] Database initialized successfully')
    return db
  } catch (error) {
    console.error('[DB] Error during initialization:', error)
    throw error
  }
}

// 获取数据库实例
export function getDatabase(): Database.Database {
  if (!db) {
    if (!app.isReady()) {
      throw new Error('Database not initialized: app is not ready')
    }
    initDatabase()
  }
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

// 创建数据表
function createTables() {
  if (!db) return

  // 房间表
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      hourly_rate REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 会员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      balance REAL NOT NULL DEFAULT 0,
      points INTEGER NOT NULL DEFAULT 0,
      level TEXT NOT NULL DEFAULT 'normal',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 订单表
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      member_id INTEGER,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration INTEGER,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ongoing',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (member_id) REFERENCES members(id)
    )
  `)

  // 商品表
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 商品销售记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      order_id INTEGER,
      quantity INTEGER NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `)

  // 充值记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS recharges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      bonus REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (member_id) REFERENCES members(id)
    )
  `)

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_room_id ON orders(room_id);
    CREATE INDEX IF NOT EXISTS idx_orders_member_id ON orders(member_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_product_sales_product_id ON product_sales(product_id);
    CREATE INDEX IF NOT EXISTS idx_recharges_member_id ON recharges(member_id);
  `)

  console.log('Database tables created successfully')
}

// 关闭数据库
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
    console.log('Database closed')
  }
}
