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
  const ongoing = db.prepare(
    "SELECT COUNT(*) as count FROM orders WHERE room_id = ? AND status = 'ongoing'"
  ).get(id) as { count: number }
  if (ongoing.count > 0) {
    throw new Error('该房间有进行中的订单，无法删除')
  }
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
  const member = getMemberById(id)
  if (member && member.balance > 0) {
    throw new Error(`该会员余额为 ¥${member.balance.toFixed(2)}，请先处理余额后再删除`)
  }
  const ongoing = db.prepare(
    "SELECT COUNT(*) as count FROM orders WHERE member_id = ? AND status = 'ongoing'"
  ).get(id) as { count: number }
  if (ongoing.count > 0) {
    throw new Error('该会员有进行中的订单，无法删除')
  }
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

  const orderData = {
    room_id: data.room_id,
    member_id: data.member_id ?? null,
    hourly_rate: data.hourly_rate ?? 0,
    start_time: data.start_time,
    end_time: data.end_time ?? null,
    duration: data.duration ?? null,
    amount: data.amount,
    prepaid_amount: data.prepaid_amount ?? 0,
    payment_method: data.payment_method,
    status: data.status
  }

  const result = db.prepare(`
    INSERT INTO orders (room_id, member_id, hourly_rate, start_time, end_time, duration, amount, prepaid_amount, payment_method, status)
    VALUES (@room_id, @member_id, @hourly_rate, @start_time, @end_time, @duration, @amount, @prepaid_amount, @payment_method, @status)
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
  const inUse = db.prepare(`
    SELECT COUNT(*) as count FROM product_sales ps
    JOIN orders o ON ps.order_id = o.id
    WHERE ps.product_id = ? AND o.status = 'ongoing'
  `).get(id) as { count: number }
  if (inUse.count > 0) {
    throw new Error('该商品在进行中的订单中被使用，无法删除')
  }
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

// ==================== 会员搜索 ====================

export function searchMembers(keyword: string): Member[] {
  const db = getDatabase()
  const like = `%${keyword}%`
  const rows = db.prepare(
    'SELECT * FROM members WHERE name LIKE ? OR phone LIKE ? ORDER BY id DESC LIMIT 20'
  ).all(like, like)
  return rows.map(toCamelCase)
}

// ==================== 事务性业务方法 ====================

export function createOrderWithProducts(
  orderData: {
    roomId: number
    memberId?: number
    hourlyRate: number
    startTime: string
    amount: number
    prepaidAmount: number
    paymentMethod: string
  },
  products: Array<{ productId: number; quantity: number; amount: number }>
): Order {
  const db = getDatabase()

  const transaction = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO orders (room_id, member_id, hourly_rate, start_time, amount, prepaid_amount, payment_method, status)
      VALUES (@room_id, @member_id, @hourly_rate, @start_time, @amount, @prepaid_amount, @payment_method, 'ongoing')
    `).run({
      room_id: orderData.roomId,
      member_id: orderData.memberId ?? null,
      hourly_rate: orderData.hourlyRate,
      start_time: orderData.startTime,
      amount: orderData.amount,
      prepaid_amount: orderData.prepaidAmount,
      payment_method: orderData.paymentMethod
    })

    const orderId = result.lastInsertRowid as number

    for (const p of products) {
      db.prepare(`
        INSERT INTO product_sales (product_id, order_id, quantity, amount)
        VALUES (@product_id, @order_id, @quantity, @amount)
      `).run({
        product_id: p.productId,
        order_id: orderId,
        quantity: p.quantity,
        amount: p.amount
      })

      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(p.productId) as any
      if (product && !product.is_unlimited_stock) {
        db.prepare('UPDATE products SET stock = stock - ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?')
          .run(p.quantity, p.productId)
      }
    }

    db.prepare("UPDATE rooms SET status = 'occupied', updated_at = datetime('now', 'localtime') WHERE id = ?")
      .run(orderData.roomId)

    return orderId
  })

  const orderId = transaction()
  return getOrderById(orderId as number)!
}

export function completeOrder(data: {
  orderId: number
  endTime: string
  duration: number
  amount: number
  actualAmount: number
  paymentMethod: string
  roomId: number
  memberId?: number
}): Order {
  const db = getDatabase()

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE orders SET
        end_time = @end_time,
        duration = @duration,
        amount = @amount,
        payment_method = @payment_method,
        status = 'completed',
        updated_at = datetime('now', 'localtime')
      WHERE id = @id
    `).run({
      id: data.orderId,
      end_time: data.endTime,
      duration: data.duration,
      amount: data.actualAmount,
      payment_method: data.paymentMethod
    })

    if (data.paymentMethod === 'balance' && data.memberId) {
      const member = db.prepare('SELECT * FROM members WHERE id = ?').get(data.memberId) as any
      if (!member) throw new Error('会员不存在')
      if (member.balance < data.actualAmount) {
        throw new Error(`会员余额不足（余额 ¥${member.balance.toFixed(2)}，需付 ¥${data.actualAmount.toFixed(2)}）`)
      }
      db.prepare(`
        UPDATE members SET
          balance = balance - @amount,
          points = points + @points,
          updated_at = datetime('now', 'localtime')
        WHERE id = @id
      `).run({
        id: data.memberId,
        amount: data.actualAmount,
        points: Math.floor(data.actualAmount)
      })
    }

    db.prepare("UPDATE rooms SET status = 'available', updated_at = datetime('now', 'localtime') WHERE id = ?")
      .run(data.roomId)
  })

  transaction()
  return getOrderById(data.orderId)!
}

export function cancelOrder(orderId: number): Order {
  const db = getDatabase()

  const transaction = db.transaction(() => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
    if (!order) throw new Error('订单不存在')
    if (order.status !== 'ongoing') throw new Error('只能取消进行中的订单')

    const sales = db.prepare('SELECT * FROM product_sales WHERE order_id = ?').all(orderId) as any[]
    for (const sale of sales) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(sale.product_id) as any
      if (product && !product.is_unlimited_stock) {
        db.prepare('UPDATE products SET stock = stock + ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?')
          .run(sale.quantity, sale.product_id)
      }
    }

    db.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now', 'localtime') WHERE id = ?")
      .run(orderId)

    db.prepare("UPDATE rooms SET status = 'available', updated_at = datetime('now', 'localtime') WHERE id = ?")
      .run(order.room_id)
  })

  transaction()
  return getOrderById(orderId)!
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
