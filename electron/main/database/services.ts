import { getDatabase } from './index'
import type { Room, Member, Order, Product, ProductSale, Recharge } from './types'

// 工具函数：将数据库字段转换为驼峰命名
function toCamelCase(obj: any): any {
  if (!obj) return obj
  const result: any = {}
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    let value = obj[key]

    // 将 SQLite 的 INTEGER 布尔值转换为 JavaScript 布尔值
    if (camelKey === 'isUnlimitedStock' && typeof value === 'number') {
      value = value === 1
    }

    result[camelKey] = value
  }
  return result
}

// 工具函数：将驼峰命名转换为下划线命名
function toSnakeCase(obj: any): any {
  if (!obj) return obj
  const result: any = {}
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    result[snakeKey] = obj[key]
  }
  return result
}

// ==================== 房间管理 ====================

export function getAllRooms(): Room[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM rooms ORDER BY id').all()
  return rows.map(toCamelCase)
}

export function getRoomById(id: number): Room | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id)
  return row ? toCamelCase(row) : null
}

export function createRoom(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Room {
  const db = getDatabase()
  const data = toSnakeCase(room)
  const result = db.prepare(`
    INSERT INTO rooms (name, type, hourly_rate, status)
    VALUES (@name, @type, @hourly_rate, @status)
  `).run(data)

  return getRoomById(result.lastInsertRowid as number)!
}

export function updateRoom(id: number, room: Partial<Room>): Room | null {
  const db = getDatabase()
  const data = toSnakeCase(room)
  const fields = Object.keys(data).map(key => `${key} = @${key}`).join(', ')

  db.prepare(`
    UPDATE rooms SET ${fields}, updated_at = datetime('now', 'localtime')
    WHERE id = @id
  `).run({ ...data, id })

  return getRoomById(id)
}

export function deleteRoom(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM rooms WHERE id = ?').run(id)
  return result.changes > 0
}

// ==================== 会员管理 ====================

export function getAllMembers(): Member[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM members ORDER BY id DESC').all()
  return rows.map(toCamelCase)
}

export function getMemberById(id: number): Member | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id)
  return row ? toCamelCase(row) : null
}

export function getMemberByPhone(phone: string): Member | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM members WHERE phone = ?').get(phone)
  return row ? toCamelCase(row) : null
}

export function createMember(member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Member {
  const db = getDatabase()
  const data = toSnakeCase(member)
  const result = db.prepare(`
    INSERT INTO members (name, phone, balance, points, level)
    VALUES (@name, @phone, @balance, @points, @level)
  `).run(data)

  return getMemberById(result.lastInsertRowid as number)!
}

export function updateMember(id: number, member: Partial<Member>): Member | null {
  const db = getDatabase()
  const data = toSnakeCase(member)
  const fields = Object.keys(data).map(key => `${key} = @${key}`).join(', ')

  db.prepare(`
    UPDATE members SET ${fields}, updated_at = datetime('now', 'localtime')
    WHERE id = @id
  `).run({ ...data, id })

  return getMemberById(id)
}

export function deleteMember(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM members WHERE id = ?').run(id)
  return result.changes > 0
}

// ==================== 订单管理 ====================

export function getAllOrders(): Order[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all()
  return rows.map(toCamelCase)
}

export function getOrderById(id: number): Order | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  return row ? toCamelCase(row) : null
}

export function getOrdersByStatus(status: string): Order[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY id DESC').all(status)
  return rows.map(toCamelCase)
}

export function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
  const db = getDatabase()
  const data = toSnakeCase(order)

  // 处理可选字段，将 undefined 转为 null
  const orderData = {
    room_id: data.room_id,
    member_id: data.member_id ?? null,
    start_time: data.start_time,
    end_time: data.end_time ?? null,
    duration: data.duration ?? null,
    amount: data.amount,
    prepaid_amount: data.prepaid_amount ?? 0,
    payment_method: data.payment_method,
    status: data.status
  }

  const result = db.prepare(`
    INSERT INTO orders (room_id, member_id, start_time, end_time, duration, amount, prepaid_amount, payment_method, status)
    VALUES (@room_id, @member_id, @start_time, @end_time, @duration, @amount, @prepaid_amount, @payment_method, @status)
  `).run(orderData)

  return getOrderById(result.lastInsertRowid as number)!
}

export function updateOrder(id: number, order: Partial<Order>): Order | null {
  const db = getDatabase()
  const data = toSnakeCase(order)
  const fields = Object.keys(data).map(key => `${key} = @${key}`).join(', ')

  db.prepare(`
    UPDATE orders SET ${fields}, updated_at = datetime('now', 'localtime')
    WHERE id = @id
  `).run({ ...data, id })

  return getOrderById(id)
}

// ==================== 商品分类管理 ====================

export function getAllProductCategories() {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM product_categories ORDER BY sort_order, id').all()
  return rows.map(toCamelCase)
}

export function getProductCategoryById(id: number) {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM product_categories WHERE id = ?').get(id)
  return row ? toCamelCase(row) : null
}

export function createProductCategory(category: { name: string; sortOrder?: number }) {
  const db = getDatabase()
  const data = toSnakeCase(category)
  const result = db.prepare(`
    INSERT INTO product_categories (name, sort_order)
    VALUES (@name, @sort_order)
  `).run({ name: data.name, sort_order: data.sort_order || 0 })

  return getProductCategoryById(result.lastInsertRowid as number)!
}

export function updateProductCategory(id: number, category: { name?: string; sortOrder?: number }) {
  const db = getDatabase()
  const data = toSnakeCase(category)
  const fields = Object.keys(data).map(key => `${key} = @${key}`).join(', ')

  db.prepare(`
    UPDATE product_categories SET ${fields}, updated_at = datetime('now', 'localtime')
    WHERE id = @id
  `).run({ ...data, id })

  return getProductCategoryById(id)
}

export function deleteProductCategory(id: number): boolean {
  const db = getDatabase()
  // 检查是否有商品使用该分类
  const count = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(id) as { count: number }
  if (count.count > 0) {
    throw new Error('该分类下还有商品，无法删除')
  }
  const result = db.prepare('DELETE FROM product_categories WHERE id = ?').run(id)
  return result.changes > 0
}

// ==================== 商品管理 ====================

export function getAllProducts(): Product[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM products ORDER BY id').all()
  return rows.map(toCamelCase)
}

export function getProductById(id: number): Product | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
  return row ? toCamelCase(row) : null
}

export function getProductsByCategoryId(categoryId: number): Product[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM products WHERE category_id = ? ORDER BY id').all(categoryId)
  return rows.map(toCamelCase)
}

export function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const db = getDatabase()
  const data = toSnakeCase(product)

  // 将布尔值转换为数字
  if (typeof data.is_unlimited_stock === 'boolean') {
    data.is_unlimited_stock = data.is_unlimited_stock ? 1 : 0
  }

  // 确保 undefined 转换为 null
  if (data.image_url === undefined) {
    data.image_url = null
  }

  const result = db.prepare(`
    INSERT INTO products (name, category_id, price, stock, is_unlimited_stock, image_url, status)
    VALUES (@name, @category_id, @price, @stock, @is_unlimited_stock, @image_url, @status)
  `).run(data)

  return getProductById(result.lastInsertRowid as number)!
}

export function updateProduct(id: number, product: Partial<Product>): Product | null {
  const db = getDatabase()
  const data = toSnakeCase(product)

  // 将布尔值转换为数字
  if (typeof data.is_unlimited_stock === 'boolean') {
    data.is_unlimited_stock = data.is_unlimited_stock ? 1 : 0
  }

  // 确保 undefined 转换为 null
  if (data.image_url === undefined) {
    data.image_url = null
  }

  const fields = Object.keys(data).map(key => `${key} = @${key}`).join(', ')

  db.prepare(`
    UPDATE products SET ${fields}, updated_at = datetime('now', 'localtime')
    WHERE id = @id
  `).run({ ...data, id })

  return getProductById(id)
}

export function deleteProduct(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id)
  return result.changes > 0
}

// ==================== 商品销售管理 ====================

export function createProductSale(sale: Omit<ProductSale, 'id' | 'createdAt'>): ProductSale {
  const db = getDatabase()
  const data = toSnakeCase(sale)

  const result = db.prepare(`
    INSERT INTO product_sales (product_id, order_id, quantity, amount)
    VALUES (@product_id, @order_id, @quantity, @amount)
  `).run(data)

  const row = db.prepare('SELECT * FROM product_sales WHERE id = ?').get(result.lastInsertRowid)
  return toCamelCase(row)
}

export function getProductSalesByOrderId(orderId: number): ProductSale[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM product_sales WHERE order_id = ? ORDER BY id').all(orderId)
  return rows.map(toCamelCase)
}

export function getAllProductSales(): ProductSale[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM product_sales ORDER BY created_at DESC').all()
  return rows.map(toCamelCase)
}

export function deleteProductSale(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM product_sales WHERE id = ?').run(id)
  return result.changes > 0
}

// ==================== 充值管理 ====================

export function createRecharge(recharge: Omit<Recharge, 'id' | 'createdAt'>): Recharge {
  const db = getDatabase()
  const data = toSnakeCase(recharge)

  // 使用事务确保数据一致性
  const transaction = db.transaction(() => {
    // 插入充值记录
    const result = db.prepare(`
      INSERT INTO recharges (member_id, amount, bonus, payment_method)
      VALUES (@member_id, @amount, @bonus, @payment_method)
    `).run(data)

    // 更新会员余额
    db.prepare(`
      UPDATE members
      SET balance = balance + @amount + @bonus,
          updated_at = datetime('now', 'localtime')
      WHERE id = @member_id
    `).run({ amount: recharge.amount, bonus: recharge.bonus, member_id: recharge.memberId })

    return result.lastInsertRowid
  })

  const rechargeId = transaction() as number
  const row = db.prepare('SELECT * FROM recharges WHERE id = ?').get(rechargeId)
  return toCamelCase(row)
}

export function getRechargesByMemberId(memberId: number): Recharge[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM recharges WHERE member_id = ? ORDER BY id DESC').all(memberId)
  return rows.map(toCamelCase)
}

export function getAllRecharges(): Recharge[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM recharges ORDER BY created_at DESC').all()
  return rows.map(toCamelCase)
}

// 获取会员统计信息
export function getMemberStats(memberId: number) {
  const db = getDatabase()

  // 充值总金额（实付）
  const rechargeStats = db.prepare(`
    SELECT
      COALESCE(SUM(amount), 0) as total_recharged,
      COALESCE(SUM(amount + bonus), 0) as total_received
    FROM recharges
    WHERE member_id = ?
  `).get(memberId) as { total_recharged: number; total_received: number }

  // 消费总金额
  const orderStats = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_spent
    FROM orders
    WHERE member_id = ? AND status = 'completed'
  `).get(memberId) as { total_spent: number }

  return {
    totalRecharged: rechargeStats.total_recharged,
    totalReceived: rechargeStats.total_received,
    totalBonus: rechargeStats.total_received - rechargeStats.total_recharged,
    totalSpent: orderStats.total_spent,
    discountRate: rechargeStats.total_recharged > 0
      ? ((rechargeStats.total_received - rechargeStats.total_recharged) / rechargeStats.total_recharged * 100)
      : 0
  }
}
