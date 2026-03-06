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

    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    console.log('[DB] WAL mode and foreign keys enabled')

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
      hourly_rate REAL NOT NULL DEFAULT 0,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration INTEGER,
      amount REAL NOT NULL,
      prepaid_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ongoing',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (member_id) REFERENCES members(id)
    )
  `)

  // 检查并添加 prepaid_amount 字段（兼容旧数据库）
  const columns = db.prepare("PRAGMA table_info(orders)").all() as Array<{ name: string }>
  const hasPrepaidAmount = columns.some(col => col.name === 'prepaid_amount')
  if (!hasPrepaidAmount) {
    db.exec(`ALTER TABLE orders ADD COLUMN prepaid_amount REAL NOT NULL DEFAULT 0`)
    console.log('[DB] Added prepaid_amount column to orders table')
  }

  const hasHourlyRate = columns.some(col => col.name === 'hourly_rate')
  if (!hasHourlyRate) {
    db.exec(`ALTER TABLE orders ADD COLUMN hourly_rate REAL NOT NULL DEFAULT 0`)
    db.exec(`
      UPDATE orders SET hourly_rate = (
        SELECT rooms.hourly_rate FROM rooms WHERE rooms.id = orders.room_id
      ) WHERE hourly_rate = 0
    `)
    console.log('[DB] Added hourly_rate column to orders table and backfilled from rooms')
  }

  // 商品分类表
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 商品表
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      is_unlimited_stock INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'available',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (category_id) REFERENCES product_categories(id)
    )
  `)

  // 检查并迁移 products 表（从 category 到 category_id）
  const productColumns = db.prepare("PRAGMA table_info(products)").all() as Array<{ name: string }>
  const hasOldCategory = productColumns.some(col => col.name === 'category')
  const hasCategoryId = productColumns.some(col => col.name === 'category_id')
  const hasUnit = productColumns.some(col => col.name === 'unit')
  const hasIsUnlimitedStock = productColumns.some(col => col.name === 'is_unlimited_stock')
  const hasImageUrl = productColumns.some(col => col.name === 'image_url')

  // 需要迁移的情况：有旧的 category 列，或者缺少新字段
  const needsMigration = (hasOldCategory && !hasCategoryId) || hasUnit || !hasIsUnlimitedStock || !hasImageUrl

  if (needsMigration) {
    console.log('[DB] Migrating products table...')

    // 1. 创建临时表
    db.exec(`
      CREATE TABLE products_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        is_unlimited_stock INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        status TEXT NOT NULL DEFAULT 'available',
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        FOREIGN KEY (category_id) REFERENCES product_categories(id)
      )
    `)

    // 2. 获取所有旧商品数据
    const oldProducts = db.prepare('SELECT * FROM products').all()

    // 3. 如果有旧的 category 字段，为每个旧分类创建新分类记录
    const categoryMap = new Map<string, number>()
    if (hasOldCategory) {
      for (const product of oldProducts) {
        const categoryName = product.category || '未分类'
        if (!categoryMap.has(categoryName)) {
          const result = db.prepare(`
            INSERT INTO product_categories (name, sort_order)
            VALUES (?, ?)
          `).run(categoryName, categoryMap.size)
          categoryMap.set(categoryName, result.lastInsertRowid as number)
        }
      }
    }

    // 4. 迁移商品数据到新表
    const insertStmt = db.prepare(`
      INSERT INTO products_new (id, name, category_id, price, stock, is_unlimited_stock, image_url, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const product of oldProducts) {
      let categoryId: number
      if (hasOldCategory) {
        const categoryName = product.category || '未分类'
        categoryId = categoryMap.get(categoryName)!
      } else {
        categoryId = product.category_id
      }

      insertStmt.run(
        product.id,
        product.name,
        categoryId,
        product.price,
        product.stock || 0,
        product.is_unlimited_stock || 0,
        product.image_url || null,
        product.status,
        product.created_at,
        product.updated_at
      )
    }

    // 5. 删除旧表，重命名新表
    db.exec('DROP TABLE products')
    db.exec('ALTER TABLE products_new RENAME TO products')

    console.log('[DB] Products table migration completed')
  }

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
