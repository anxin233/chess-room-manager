import { getDatabase } from './index'
import type { Room, Member, Order, Product, ProductSale, Recharge } from './types'

// 工具函数：将数据库字段转换为驼峰命名
function toCamelCase(obj: any): any {
  if (!obj) return obj
  const result: any = {}
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = obj[key]
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
  const result = db.prepare(`
    INSERT INTO orders (room_id, member_id, start_time, end_time, duration, amount, payment_method, status)
    VALUES (@room_id, @member_id, @start_time, @end_time, @duration, @amount, @payment_method, @status)
  `).run(data)

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

export function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const db = getDatabase()
  const data = toSnakeCase(product)
  const result = db.prepare(`
    INSERT INTO products (name, category, price, stock, unit, status)
    VALUES (@name, @category, @price, @stock, @unit, @status)
  `).run(data)

  return getProductById(result.lastInsertRowid as number)!
}

export function updateProduct(id: number, product: Partial<Product>): Product | null {
  const db = getDatabase()
  const data = toSnakeCase(product)
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
