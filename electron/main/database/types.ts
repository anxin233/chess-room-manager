// 数据库类型定义

// 房间信息
export interface Room {
  id?: number
  name: string // 房间名称
  type: string // 房间类型（麻将、扑克等）
  hourlyRate: number // 小时费率
  status: 'available' | 'occupied' | 'maintenance' // 状态
  createdAt?: string
  updatedAt?: string
}

// 会员信息
export interface Member {
  id?: number
  name: string // 会员姓名
  phone: string // 手机号
  balance: number // 余额
  points: number // 积分
  level: 'normal' | 'silver' | 'gold' | 'platinum' // 会员等级
  createdAt?: string
  updatedAt?: string
}

// 订单信息
export interface Order {
  id?: number
  roomId: number // 房间ID
  memberId?: number // 会员ID（可选）
  hourlyRate: number // 开单时的费率（结账按此费率计算）
  startTime: string // 开始时间
  endTime?: string // 结束时间
  duration?: number // 时长（分钟）
  amount: number // 金额
  prepaidAmount: number // 预付金额
  paymentMethod: 'cash' | 'card' | 'wechat' | 'alipay' | 'balance' // 支付方式
  status: 'ongoing' | 'completed' | 'cancelled' // 状态
  createdAt?: string
  updatedAt?: string
}

// 商品分类
export interface ProductCategory {
  id?: number
  name: string // 分类名称
  sortOrder: number // 排序
  createdAt?: string
  updatedAt?: string
}

// 商品信息
export interface Product {
  id?: number
  name: string // 商品名称
  categoryId: number // 分类ID
  price: number // 价格
  stock: number // 库存（当 isUnlimitedStock 为 true 时忽略）
  isUnlimitedStock: boolean // 是否无限库存
  imageUrl?: string // 商品图片路径
  status: 'available' | 'unavailable' // 状态
  createdAt?: string
  updatedAt?: string
}

// 商品销售记录
export interface ProductSale {
  id?: number
  productId: number // 商品ID
  orderId?: number // 关联订单ID
  quantity: number // 数量
  amount: number // 金额
  createdAt?: string
}

// 会员充值记录
export interface Recharge {
  id?: number
  memberId: number // 会员ID
  amount: number // 充值金额
  bonus: number // 赠送金额
  paymentMethod: 'cash' | 'card' | 'wechat' | 'alipay' // 支付方式
  createdAt?: string
}
