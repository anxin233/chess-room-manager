<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Clock, Money, Plus, Delete, Box, Check } from '@element-plus/icons-vue'
import type { Room, Order, Product, ProductSale } from '../../electron/main/database/types'

// 房间列表
const rooms = ref<Room[]>([])
const orders = ref<Order[]>([])
const loading = ref(false)

// 商品相关
const allProducts = ref<Product[]>([])
const allCategories = ref<any[]>([])
const selectedProducts = ref<Array<{ product: Product; quantity: number }>>([])

// 商品选择弹窗
const productSelectDialog = ref(false)
const tempSelectedProducts = ref<Array<{ product: Product; quantity: number }>>([])

// 开单对话框
const openOrderDialog = ref(false)
const selectedRoom = ref<Room | null>(null)
const orderForm = ref({
  hourlyRate: 0,
  estimatedHours: 1,
  memberId: undefined as number | undefined,
  prepaidAmount: 0
})

// 结账对话框
const checkoutDialog = ref(false)
const checkoutOrder = ref<Order | null>(null)
const checkoutProductSales = ref<Array<ProductSale & { productName: string }>>([])
const checkoutForm = ref({
  paymentMethod: 'cash' as 'cash' | 'card' | 'wechat' | 'alipay' | 'balance',
  actualAmount: 0
})

// 房间详情对话框
const roomDetailDialog = ref(false)
const detailRoom = ref<Room | null>(null)
const detailOrder = ref<Order | null>(null)
const detailProductSales = ref<Array<ProductSale & { productName: string; productPrice: number }>>([])
const detailSelectedProducts = ref<Array<{ product: Product; quantity: number }>>([])

// 详情页商品选择弹窗
const detailProductSelectDialog = ref(false)
const detailTempSelectedProducts = ref<Array<{ product: Product; quantity: number }>>([])

// 支付方式选项
const paymentMethods = [
  { label: '现金', value: 'cash' },
  { label: '刷卡', value: 'card' },
  { label: '微信', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '会员余额', value: 'balance' }
]

// 状态标签类型
const getStatusType = (status: string) => {
  const map: Record<string, 'success' | 'warning' | 'danger'> = {
    available: 'success',
    occupied: 'warning',
    maintenance: 'danger'
  }
  return map[status] || 'info'
}

// 状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    available: '空闲',
    occupied: '使用中',
    maintenance: '维护中'
  }
  return map[status] || status
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    rooms.value = await window.electronAPI.db.rooms.getAll()
    orders.value = await window.electronAPI.db.orders.getByStatus('ongoing')
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 获取房间的进行中订单
const getRoomOrder = (roomId: number) => {
  return orders.value.find(order => order.roomId === roomId && order.status === 'ongoing')
}

// 计算已使用时长（分钟）
const getUsedDuration = (startTime: string) => {
  const start = new Date(startTime).getTime()
  const now = Date.now()
  return Math.floor((now - start) / 1000 / 60)
}

// 格式化时长
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins}分钟`
}

// 计算费用（向上取整）
const calculateAmount = (hourlyRate: number, minutes: number) => {
  return Math.ceil((minutes / 60) * hourlyRate)
}

// 加载商品列表
const loadProducts = async () => {
  try {
    allProducts.value = await window.electronAPI.db.products.getAll()
    // 加载商品图片URL
    for (const product of allProducts.value) {
      if (product.imageUrl) {
        (product as any).imageAppUrl = `app://${product.imageUrl}`
      }
    }
    // 加载分类
    allCategories.value = await window.electronAPI.db.productCategories.getAll()
  } catch (error) {
    console.error('加载商品失败', error)
  }
}

// 添加商品
const addProduct = (product: Product) => {
  const existing = selectedProducts.value.find(item => item.product.id === product.id)
  if (existing) {
    existing.quantity++
  } else {
    selectedProducts.value.push({ product, quantity: 1 })
  }
}

// 移除商品
const removeProduct = (index: number) => {
  selectedProducts.value.splice(index, 1)
}

// 计算商品总额
const getProductsTotal = computed(() => {
  return selectedProducts.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
})

// 打开商品选择弹窗
const openProductSelect = () => {
  tempSelectedProducts.value = JSON.parse(JSON.stringify(selectedProducts.value))
  productSelectDialog.value = true
}

// 临时选择商品（弹窗内）
const toggleProductInDialog = (product: Product) => {
  const existing = tempSelectedProducts.value.find(item => item.product.id === product.id)
  if (existing) {
    // 如果已存在，移除
    const index = tempSelectedProducts.value.indexOf(existing)
    tempSelectedProducts.value.splice(index, 1)
  } else {
    // 如果不存在，添加
    tempSelectedProducts.value.push({ product, quantity: 1 })
  }
}

// 检查商品是否已选中
const isProductSelected = (productId: number) => {
  return tempSelectedProducts.value.some(item => item.product.id === productId)
}

// 获取商品数量
const getProductQuantity = (productId: number) => {
  const item = tempSelectedProducts.value.find(item => item.product.id === productId)
  return item?.quantity || 0
}

// 更新商品数量
const updateProductQuantity = (productId: number, quantity: number) => {
  const item = tempSelectedProducts.value.find(item => item.product.id === productId)
  if (item) {
    item.quantity = quantity
  }
}

// 计算临时选择的商品总额
const tempProductsTotal = computed(() => {
  return tempSelectedProducts.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
})

// 确认选择商品
const confirmProductSelect = () => {
  selectedProducts.value = JSON.parse(JSON.stringify(tempSelectedProducts.value))
  productSelectDialog.value = false
}

// 根据分类分组商品
const productsByCategory = computed(() => {
  const groups: Record<number, { category: any; products: Product[] }> = {}

  for (const category of allCategories.value) {
    groups[category.id] = {
      category,
      products: allProducts.value.filter(p => p.categoryId === category.id && p.status === 'available')
    }
  }

  return Object.values(groups).filter(g => g.products.length > 0)
})

// 打开开单对话框
const openOrder = (room: Room) => {
  if (room.status !== 'available') {
    ElMessage.warning('该房间不可用')
    return
  }
  selectedRoom.value = room
  orderForm.value = {
    hourlyRate: room.hourlyRate,
    estimatedHours: 1,
    memberId: undefined,
    prepaidAmount: 0
  }
  selectedProducts.value = []
  openOrderDialog.value = true
}

// 确认开单
const confirmOpenOrder = async () => {
  if (!selectedRoom.value) return

  loading.value = true
  try {
    const orderData = {
      roomId: selectedRoom.value.id!,
      memberId: orderForm.value.memberId,
      startTime: new Date().toISOString(),
      amount: orderForm.value.hourlyRate * orderForm.value.estimatedHours,
      prepaidAmount: orderForm.value.prepaidAmount,
      paymentMethod: 'cash' as const,
      status: 'ongoing' as const
    }

    const order = await window.electronAPI.db.orders.create(orderData)

    // 保存商品销售记录
    for (const item of selectedProducts.value) {
      await window.electronAPI.db.productSales.create({
        productId: item.product.id!,
        orderId: order.id!,
        quantity: item.quantity,
        amount: item.product.price * item.quantity
      })

      // 扣减库存（如果不是无限库存）
      if (!item.product.isUnlimitedStock) {
        await window.electronAPI.db.products.update(item.product.id!, {
          stock: item.product.stock - item.quantity
        })
      }
    }

    await window.electronAPI.db.rooms.update(selectedRoom.value.id!, { status: 'occupied' })

    ElMessage.success('开单成功')
    openOrderDialog.value = false
    await loadData()
  } catch (error) {
    ElMessage.error('开单失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 打开结账对话框
const openCheckout = async (room: Room) => {
  const order = getRoomOrder(room.id!)
  if (!order) {
    ElMessage.warning('该房间没有进行中的订单')
    return
  }

  checkoutOrder.value = order
  const duration = getUsedDuration(order.startTime)
  const roomAmount = calculateAmount(room.hourlyRate, duration)

  // 加载商品销售记录
  try {
    const sales = await window.electronAPI.db.productSales.getByOrderId(order.id!)
    const salesWithNames = await Promise.all(
      sales.map(async (sale) => {
        const product = await window.electronAPI.db.products.getById(sale.productId)
        return {
          ...sale,
          productName: product?.name || '未知商品'
        }
      })
    )
    checkoutProductSales.value = salesWithNames
  } catch (error) {
    console.error('加载商品销售记录失败', error)
    checkoutProductSales.value = []
  }

  // 计算总金额（房费 + 商品费）
  const productsAmount = checkoutProductSales.value.reduce((sum, sale) => sum + sale.amount, 0)
  const totalAmount = roomAmount + productsAmount

  checkoutForm.value = {
    paymentMethod: 'cash',
    actualAmount: totalAmount
  }
  checkoutDialog.value = true
}

// 计算结账差额
const checkoutDifference = computed(() => {
  if (!checkoutOrder.value) return 0
  const diff = checkoutForm.value.actualAmount - checkoutOrder.value.prepaidAmount
  return diff
})

// 差额类型文本
const differenceText = computed(() => {
  const diff = checkoutDifference.value
  if (diff > 0) return '需补款'
  if (diff < 0) return '需退款'
  return '无需补退'
})

// 差额类型
const differenceType = computed(() => {
  const diff = checkoutDifference.value
  if (diff > 0) return 'warning'
  if (diff < 0) return 'success'
  return 'info'
})

// 确认结账
const confirmCheckout = async () => {
  if (!checkoutOrder.value) return

  loading.value = true
  try {
    const endTime = new Date().toISOString()
    const duration = getUsedDuration(checkoutOrder.value.startTime)

    await window.electronAPI.db.orders.update(checkoutOrder.value.id!, {
      endTime,
      duration,
      amount: checkoutForm.value.actualAmount,
      paymentMethod: checkoutForm.value.paymentMethod,
      status: 'completed'
    })

    await window.electronAPI.db.rooms.update(checkoutOrder.value.roomId, { status: 'available' })

    ElMessage.success('结账成功')
    checkoutDialog.value = false
    await loadData()
  } catch (error) {
    ElMessage.error('结账失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 预估费用
const estimatedAmount = computed(() => {
  return Math.round(orderForm.value.hourlyRate * orderForm.value.estimatedHours)
})

// 计算折扣
const discount = computed(() => {
  if (!selectedRoom.value || orderForm.value.hourlyRate === selectedRoom.value.hourlyRate) {
    return null
  }
  const discountPercent = ((orderForm.value.hourlyRate / selectedRoom.value.hourlyRate) * 100).toFixed(0)
  return `${discountPercent}%`
})

// 折扣金额
const discountAmount = computed(() => {
  if (!selectedRoom.value) return 0
  const original = selectedRoom.value.hourlyRate * orderForm.value.estimatedHours
  const actual = orderForm.value.hourlyRate * orderForm.value.estimatedHours
  return Math.round(original - actual)
})

// 打开房间详情
const openRoomDetail = async (room: Room) => {
  detailRoom.value = room
  const order = getRoomOrder(room.id!)
  detailOrder.value = order

  if (order) {
    // 加载已点商品
    try {
      const sales = await window.electronAPI.db.productSales.getByOrderId(order.id!)
      const salesWithDetails = await Promise.all(
        sales.map(async (sale) => {
          const product = await window.electronAPI.db.products.getById(sale.productId)
          return {
            ...sale,
            productName: product?.name || '未知商品',
            productPrice: product?.price || 0
          }
        })
      )
      detailProductSales.value = salesWithDetails
    } catch (error) {
      console.error('加载商品销售记录失败', error)
      detailProductSales.value = []
    }
  } else {
    detailProductSales.value = []
  }

  detailSelectedProducts.value = []
  roomDetailDialog.value = true
}

// 详情页添加商品
const addProductInDetail = (product: Product) => {
  const existing = detailSelectedProducts.value.find(item => item.product.id === product.id)
  if (existing) {
    existing.quantity++
  } else {
    detailSelectedProducts.value.push({ product, quantity: 1 })
  }
}

// 详情页移除商品
const removeProductInDetail = (index: number) => {
  detailSelectedProducts.value.splice(index, 1)
}

// 详情页商品总额
const detailProductsTotal = computed(() => {
  return detailSelectedProducts.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
})

// 打开详情页商品选择弹窗
const openDetailProductSelect = () => {
  detailTempSelectedProducts.value = JSON.parse(JSON.stringify(detailSelectedProducts.value))
  detailProductSelectDialog.value = true
}

// 详情页临时选择商品
const toggleProductInDetailDialog = (product: Product) => {
  const existing = detailTempSelectedProducts.value.find(item => item.product.id === product.id)
  if (existing) {
    const index = detailTempSelectedProducts.value.indexOf(existing)
    detailTempSelectedProducts.value.splice(index, 1)
  } else {
    detailTempSelectedProducts.value.push({ product, quantity: 1 })
  }
}

// 检查详情页商品是否已选中
const isDetailProductSelected = (productId: number) => {
  return detailTempSelectedProducts.value.some(item => item.product.id === productId)
}

// 获取详情页商品数量
const getDetailProductQuantity = (productId: number) => {
  const item = detailTempSelectedProducts.value.find(item => item.product.id === productId)
  return item?.quantity || 0
}

// 更新详情页商品数量
const updateDetailProductQuantity = (productId: number, quantity: number) => {
  const item = detailTempSelectedProducts.value.find(item => item.product.id === productId)
  if (item) {
    item.quantity = quantity
  }
}

// 计算详情页临时选择的商品总额
const detailTempProductsTotal = computed(() => {
  return detailTempSelectedProducts.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
})

// 确认详情页选择商品
const confirmDetailProductSelect = () => {
  detailSelectedProducts.value = JSON.parse(JSON.stringify(detailTempSelectedProducts.value))
  detailProductSelectDialog.value = false
}

// 确认添加商品到订单
const confirmAddProducts = async () => {
  if (!detailOrder.value || detailSelectedProducts.value.length === 0) {
    ElMessage.warning('请先选择商品')
    return
  }

  loading.value = true
  try {
    // 保存商品销售记录
    for (const item of detailSelectedProducts.value) {
      await window.electronAPI.db.productSales.create({
        productId: item.product.id!,
        orderId: detailOrder.value.id!,
        quantity: item.quantity,
        amount: item.product.price * item.quantity
      })

      // 扣减库存（如果不是无限库存）
      if (!item.product.isUnlimitedStock) {
        await window.electronAPI.db.products.update(item.product.id!, {
          stock: item.product.stock - item.quantity
        })
      }
    }

    ElMessage.success('添加商品成功')
    // 重新加载详情
    await openRoomDetail(detailRoom.value!)
  } catch (error) {
    ElMessage.error('添加商品失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 设置维护状态
const setMaintenance = async (room: Room) => {
  if (room.status === 'occupied') {
    ElMessage.warning('房间使用中，无法设置维护')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要将"${room.name}"设置为维护状态吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    loading.value = true
    await window.electronAPI.db.rooms.update(room.id!, { status: 'maintenance' })
    ElMessage.success('已设置为维护状态')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('设置失败')
      console.error(error)
    }
  } finally {
    loading.value = false
  }
}

// 结束维护
const endMaintenance = async (room: Room) => {
  try {
    await ElMessageBox.confirm(`确定要结束"${room.name}"的维护状态吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })

    loading.value = true
    await window.electronAPI.db.rooms.update(room.id!, { status: 'available' })
    ElMessage.success('维护已结束，房间已恢复空闲')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
      console.error(error)
    }
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  loadData()
  loadProducts()
  // 每30秒刷新一次数据
  setInterval(loadData, 30000)
})
</script>

<template>
  <div class="hall">
    <div class="page-header">
      <h2 class="page-title">营业大厅</h2>
      <el-button :icon="Refresh" @click="loadData" :loading="loading">
        刷新
      </el-button>
    </div>

    <div class="room-grid">
      <el-card
        v-for="room in rooms"
        :key="room.id"
        :class="['room-card', `status-${room.status}`]"
        shadow="hover"
        @click="openRoomDetail(room)"
        style="cursor: pointer"
      >
        <div class="room-header">
          <div class="room-name">{{ room.name }}</div>
          <el-tag :type="getStatusType(room.status)" size="small">
            {{ getStatusText(room.status) }}
          </el-tag>
        </div>

        <div class="room-info">
          <div class="info-item">
            <span class="label">类型：</span>
            <span class="value">{{ room.type }}</span>
          </div>
          <div class="info-item">
            <span class="label">费率：</span>
            <span class="value price">¥{{ room.hourlyRate.toFixed(1) }}/小时</span>
          </div>

          <!-- 使用中显示时长和费用 -->
          <template v-if="room.status === 'occupied'">
            <div class="info-item" v-if="getRoomOrder(room.id!)">
              <span class="label">时长：</span>
              <span class="value duration">
                {{ formatDuration(getUsedDuration(getRoomOrder(room.id!)!.startTime)) }}
              </span>
            </div>
            <div class="info-item" v-if="getRoomOrder(room.id!)">
              <span class="label">费用：</span>
              <span class="value amount">
                ¥{{ calculateAmount(room.hourlyRate, getUsedDuration(getRoomOrder(room.id!)!.startTime)).toFixed(1) }}
              </span>
            </div>
          </template>
        </div>

        <div class="room-actions">
          <!-- 空闲状态：显示开单和设置维护按钮 -->
          <template v-if="room.status === 'available'">
            <el-button
              type="primary"
              size="default"
              @click="openOrder(room)"
              style="flex: 1"
            >
              开单
            </el-button>
            <el-button
              type="warning"
              size="default"
              @click="setMaintenance(room)"
              style="flex: 1"
            >
              维护
            </el-button>
          </template>

          <!-- 使用中状态：只显示结账按钮 -->
          <el-button
            v-else-if="room.status === 'occupied'"
            type="success"
            size="default"
            @click="openCheckout(room)"
            style="width: 100%"
          >
            结账
          </el-button>

          <!-- 维护中状态：显示结束维护按钮 -->
          <el-button
            v-else-if="room.status === 'maintenance'"
            type="success"
            size="default"
            @click="endMaintenance(room)"
            style="width: 100%"
          >
            结束维护
          </el-button>
        </div>
      </el-card>

      <div v-if="rooms.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无房间数据，请先添加房间" />
      </div>
    </div>

    <!-- 开单对话框 -->
    <el-dialog
      v-model="openOrderDialog"
      title="开单"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="orderForm" label-width="100px">
        <el-form-item label="房间">
          <el-input :value="selectedRoom?.name" disabled />
        </el-form-item>

        <el-form-item label="原始费率">
          <div class="original-rate">¥{{ selectedRoom?.hourlyRate.toFixed(1) }}/小时</div>
        </el-form-item>

        <el-form-item label="实际费率">
          <el-input-number
            v-model="orderForm.hourlyRate"
            :min="0"
            :precision="1"
            :step="1"
            style="width: 100%"
          />
          <div v-if="discount" class="discount-info">
            <el-tag type="success" size="small">{{ discount }} 折扣</el-tag>
            <span style="margin-left: 8px; color: #67c23a;">优惠 ¥{{ discountAmount.toFixed(1) }}</span>
          </div>
        </el-form-item>

        <el-form-item label="预估时长">
          <el-input-number
            v-model="orderForm.estimatedHours"
            :min="0.5"
            :max="24"
            :step="0.5"
            style="width: 100%"
          />
          <span style="margin-left: 8px; color: #909399;">小时</span>
        </el-form-item>

        <el-form-item label="预估费用">
          <div class="estimated-amount">¥{{ estimatedAmount.toFixed(1) }}</div>
        </el-form-item>

        <el-form-item label="预付金额">
          <el-input-number
            v-model="orderForm.prepaidAmount"
            :min="0"
            :precision="1"
            :step="10"
            style="width: 100%"
          />
          <div style="margin-top: 8px; font-size: 12px; color: #909399;">
            建议预付预估费用，结账时多退少补
          </div>
        </el-form-item>

        <el-form-item label="会员ID">
          <el-input-number
            v-model="orderForm.memberId"
            :min="1"
            placeholder="选填"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 商品选择 -->
        <el-divider>添加商品</el-divider>

        <el-form-item label="选择商品">
          <el-button type="primary" @click="openProductSelect" style="width: 100%">
            选择商品 (已选 {{ selectedProducts.length }} 件)
          </el-button>
        </el-form-item>

        <el-form-item label="已选商品" v-if="selectedProducts.length > 0">
          <div class="selected-products-summary">
            <div v-for="(item, index) in selectedProducts" :key="index" class="summary-item">
              <span class="product-name">{{ item.product.name }}</span>
              <span class="product-quantity">x{{ item.quantity }}</span>
              <span class="product-price">¥{{ (item.product.price * item.quantity).toFixed(1) }}</span>
            </div>
            <el-divider />
            <div class="products-total">
              <span>商品小计：</span>
              <span class="total-amount">¥{{ getProductsTotal.toFixed(1) }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="openOrderDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="confirmOpenOrder">
          确认开单
        </el-button>
      </template>
    </el-dialog>

    <!-- 结账对话框 -->
    <el-dialog
      v-model="checkoutDialog"
      title="结账"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="checkoutForm" label-width="100px" v-if="checkoutOrder">
        <el-form-item label="开始时间">
          <el-input :value="new Date(checkoutOrder.startTime).toLocaleString()" disabled />
        </el-form-item>

        <el-form-item label="使用时长">
          <el-input :value="formatDuration(getUsedDuration(checkoutOrder.startTime))" disabled />
        </el-form-item>

        <!-- 商品明细 -->
        <el-form-item label="商品明细" v-if="checkoutProductSales.length > 0">
          <div class="checkout-products">
            <div v-for="sale in checkoutProductSales" :key="sale.id" class="checkout-product-item">
              <span class="product-name">{{ sale.productName }}</span>
              <span class="product-quantity">x{{ sale.quantity }}</span>
              <span class="product-amount">¥{{ sale.amount.toFixed(1) }}</span>
            </div>
            <el-divider style="margin: 8px 0" />
            <div class="checkout-product-total">
              <span>商品小计：</span>
              <span class="amount">¥{{ checkoutProductSales.reduce((sum, s) => sum + s.amount, 0).toFixed(1) }}</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="应收金额">
          <div class="checkout-amount">¥{{ checkoutForm.actualAmount.toFixed(1) }}</div>
        </el-form-item>

        <el-form-item label="已预付">
          <div class="prepaid-amount">¥{{ checkoutOrder.prepaidAmount.toFixed(1) }}</div>
        </el-form-item>

        <el-form-item label="差额">
          <div class="difference-amount">
            <el-tag :type="differenceType" size="large">
              {{ differenceText }}：¥{{ Math.abs(checkoutDifference).toFixed(1) }}
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item label="实收金额">
          <el-input-number
            v-model="checkoutForm.actualAmount"
            :min="0"
            :precision="1"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="支付方式">
          <el-select v-model="checkoutForm.paymentMethod" style="width: 100%">
            <el-option
              v-for="item in paymentMethods"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="checkoutDialog = false">取消</el-button>
        <el-button type="success" :loading="loading" @click="confirmCheckout">
          确认结账
        </el-button>
      </template>
    </el-dialog>

    <!-- 房间详情对话框 -->
    <el-dialog
      v-model="roomDetailDialog"
      :title="`${detailRoom?.name} - 详情`"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="detailRoom">
        <!-- 房间基本信息 -->
        <el-descriptions title="房间信息" :column="2" border>
          <el-descriptions-item label="房间名称">{{ detailRoom.name }}</el-descriptions-item>
          <el-descriptions-item label="房间类型">{{ detailRoom.type }}</el-descriptions-item>
          <el-descriptions-item label="费率">¥{{ detailRoom.hourlyRate.toFixed(1) }}/小时</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(detailRoom.status)">
              {{ getStatusText(detailRoom.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 订单信息（使用中才显示） -->
        <el-descriptions
          v-if="detailOrder"
          title="使用信息"
          :column="2"
          border
          style="margin-top: 20px"
        >
          <el-descriptions-item label="开始时间">
            {{ new Date(detailOrder.startTime).toLocaleString() }}
          </el-descriptions-item>
          <el-descriptions-item label="使用时长">
            {{ formatDuration(getUsedDuration(detailOrder.startTime)) }}
          </el-descriptions-item>
          <el-descriptions-item label="当前费用">
            ¥{{ calculateAmount(detailRoom.hourlyRate, getUsedDuration(detailOrder.startTime)).toFixed(1) }}
          </el-descriptions-item>
          <el-descriptions-item label="预付金额">
            ¥{{ detailOrder.prepaidAmount.toFixed(1) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 已点商品列表 -->
        <div v-if="detailProductSales.length > 0" style="margin-top: 20px">
          <el-divider content-position="left">已点商品</el-divider>
          <el-table :data="detailProductSales" border style="width: 100%">
            <el-table-column prop="productName" label="商品名称" />
            <el-table-column prop="quantity" label="数量" width="80" align="center" />
            <el-table-column prop="productPrice" label="单价" width="100" align="right">
              <template #default="{ row }">¥{{ row.productPrice.toFixed(1) }}</template>
            </el-table-column>
            <el-table-column prop="amount" label="小计" width="100" align="right">
              <template #default="{ row }">¥{{ row.amount.toFixed(1) }}</template>
            </el-table-column>
          </el-table>
          <div style="text-align: right; margin-top: 10px; font-size: 16px; font-weight: 600;">
            商品总计：<span style="color: #f56c6c;">¥{{ detailProductSales.reduce((sum, s) => sum + s.amount, 0).toFixed(1) }}</span>
          </div>
        </div>

        <!-- 添加商品（使用中才能添加） -->
        <div v-if="detailOrder" style="margin-top: 20px">
          <el-divider content-position="left">添加商品</el-divider>

          <el-button type="primary" @click="openDetailProductSelect" style="width: 100%; margin-bottom: 12px">
            选择商品 (已选 {{ detailSelectedProducts.length }} 件)
          </el-button>

          <div v-if="detailSelectedProducts.length > 0" class="selected-products-summary">
            <div v-for="(item, index) in detailSelectedProducts" :key="index" class="summary-item">
              <span class="product-name">{{ item.product.name }}</span>
              <span class="product-quantity">x{{ item.quantity }}</span>
              <span class="product-price">¥{{ (item.product.price * item.quantity).toFixed(1) }}</span>
            </div>
            <el-divider />
            <div class="products-total">
              <span>商品小计：</span>
              <span class="total-amount">¥{{ detailProductsTotal.toFixed(1) }}</span>
            </div>
          </div>
        </div>

        <!-- 空闲状态提示 -->
        <el-empty
          v-if="!detailOrder"
          description="房间空闲中，暂无订单信息"
          :image-size="100"
        />
      </div>

      <template #footer>
        <el-button @click="roomDetailDialog = false">关闭</el-button>
        <el-button
          v-if="detailRoom?.status === 'available'"
          type="primary"
          @click="roomDetailDialog = false; openOrder(detailRoom)"
        >
          开单
        </el-button>
        <el-button
          v-if="detailOrder && detailSelectedProducts.length > 0"
          type="primary"
          :loading="loading"
          @click="confirmAddProducts"
        >
          确认添加商品
        </el-button>
        <el-button
          v-if="detailRoom?.status === 'occupied'"
          type="success"
          @click="roomDetailDialog = false; openCheckout(detailRoom)"
        >
          结账
        </el-button>
        <el-button
          v-if="detailRoom?.status === 'maintenance'"
          type="success"
          @click="roomDetailDialog = false; endMaintenance(detailRoom)"
        >
          结束维护
        </el-button>
      </template>
    </el-dialog>

    <!-- 商品选择弹窗 -->
    <el-dialog
      v-model="productSelectDialog"
      title="选择商品"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="product-select-container">
        <!-- 按分类显示商品 -->
        <div v-for="group in productsByCategory" :key="group.category.id" class="category-section">
          <div class="category-title">{{ group.category.name }}</div>
          <div class="product-grid-dialog">
            <div
              v-for="product in group.products"
              :key="product.id"
              :class="['product-card-dialog', { selected: isProductSelected(product.id!) }]"
              @click="toggleProductInDialog(product)"
            >
              <!-- 商品图片 -->
              <div class="product-image-dialog">
                <img
                  v-if="(product as any).imageAppUrl"
                  :src="(product as any).imageAppUrl"
                  alt="商品图片"
                />
                <div v-else class="default-image-dialog">
                  <el-icon :size="40"><Box /></el-icon>
                </div>
              </div>

              <!-- 商品信息 -->
              <div class="product-info-dialog">
                <div class="product-name-dialog">{{ product.name }}</div>
                <div class="product-price-dialog">¥{{ product.price.toFixed(1) }}</div>
                <div class="product-stock-dialog" v-if="!product.isUnlimitedStock">
                  库存: {{ product.stock }}
                </div>
                <div class="product-stock-dialog unlimited" v-else>
                  无限库存
                </div>
              </div>

              <!-- 已选中标记 -->
              <div v-if="isProductSelected(product.id!)" class="selected-badge">
                <el-icon><Check /></el-icon>
              </div>

              <!-- 数量选择 -->
              <div v-if="isProductSelected(product.id!)" class="quantity-control" @click.stop>
                <el-input-number
                  :model-value="getProductQuantity(product.id!)"
                  @update:model-value="(val) => updateProductQuantity(product.id!, val)"
                  :min="1"
                  :max="product.isUnlimitedStock ? 999 : product.stock"
                  size="small"
                  style="width: 100%"
                />
              </div>
            </div>
          </div>
        </div>

        <el-empty v-if="productsByCategory.length === 0" description="暂无可选商品" />
      </div>

      <!-- 底部统计和操作 -->
      <div class="dialog-footer-summary">
        <div class="summary-info">
          <span>已选 {{ tempSelectedProducts.length }} 件商品</span>
          <span class="total-price">总计: ¥{{ tempProductsTotal.toFixed(1) }}</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="productSelectDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmProductSelect">
          确认选择
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情页商品选择弹窗 -->
    <el-dialog
      v-model="detailProductSelectDialog"
      title="选择商品"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="product-select-container">
        <!-- 按分类显示商品 -->
        <div v-for="group in productsByCategory" :key="group.category.id" class="category-section">
          <div class="category-title">{{ group.category.name }}</div>
          <div class="product-grid-dialog">
            <div
              v-for="product in group.products"
              :key="product.id"
              :class="['product-card-dialog', { selected: isDetailProductSelected(product.id!) }]"
              @click="toggleProductInDetailDialog(product)"
            >
              <!-- 商品图片 -->
              <div class="product-image-dialog">
                <img
                  v-if="(product as any).imageAppUrl"
                  :src="(product as any).imageAppUrl"
                  alt="商品图片"
                />
                <div v-else class="default-image-dialog">
                  <el-icon :size="40"><Box /></el-icon>
                </div>
              </div>

              <!-- 商品信息 -->
              <div class="product-info-dialog">
                <div class="product-name-dialog">{{ product.name }}</div>
                <div class="product-price-dialog">¥{{ product.price.toFixed(1) }}</div>
                <div class="product-stock-dialog" v-if="!product.isUnlimitedStock">
                  库存: {{ product.stock }}
                </div>
                <div class="product-stock-dialog unlimited" v-else>
                  无限库存
                </div>
              </div>

              <!-- 已选中标记 -->
              <div v-if="isDetailProductSelected(product.id!)" class="selected-badge">
                <el-icon><Check /></el-icon>
              </div>

              <!-- 数量选择 -->
              <div v-if="isDetailProductSelected(product.id!)" class="quantity-control" @click.stop>
                <el-input-number
                  :model-value="getDetailProductQuantity(product.id!)"
                  @update:model-value="(val) => updateDetailProductQuantity(product.id!, val)"
                  :min="1"
                  :max="product.isUnlimitedStock ? 999 : product.stock"
                  size="small"
                  style="width: 100%"
                />
              </div>
            </div>
          </div>
        </div>

        <el-empty v-if="productsByCategory.length === 0" description="暂无可选商品" />
      </div>

      <!-- 底部统计和操作 -->
      <div class="dialog-footer-summary">
        <div class="summary-info">
          <span>已选 {{ detailTempSelectedProducts.length }} 件商品</span>
          <span class="total-price">总计: ¥{{ detailTempProductsTotal.toFixed(1) }}</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailProductSelectDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmDetailProductSelect">
          确认选择
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.hall {
  padding: 24px;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.room-card {
  transition: all 0.3s;
  border: 2px solid transparent;
}

.room-card.status-available {
  border-color: #67c23a;
}

.room-card.status-occupied {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.room-card.status-maintenance {
  border-color: #f56c6c;
  background: #fef0f0;
}

.room-card:hover {
  transform: translateY(-4px);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.room-name {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.room-info {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item .label {
  color: #909399;
  margin-right: 8px;
  min-width: 50px;
}

.info-item .value {
  color: #606266;
  font-weight: 500;
}

.info-item .price {
  color: #f56c6c;
  font-size: 16px;
  font-weight: 600;
}

.info-item .duration {
  color: #409eff;
  font-weight: 600;
}

.info-item .amount {
  color: #e6a23c;
  font-size: 18px;
  font-weight: 600;
}

.room-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.estimated-amount,
.checkout-amount {
  font-size: 24px;
  font-weight: 600;
  color: #f56c6c;
}

.prepaid-amount {
  font-size: 20px;
  font-weight: 600;
  color: #67c23a;
}

.difference-amount {
  font-size: 18px;
  font-weight: 600;
}

.original-rate {
  font-size: 16px;
  color: #909399;
  text-decoration: line-through;
}

.discount-info {
  margin-top: 8px;
  display: flex;
  align-items: center;
}

/* 商品选择样式 */
.selected-products {
  width: 100%;
}

.product-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.product-item:last-child {
  border-bottom: none;
}

.product-name {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.product-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 600;
  margin-right: 8px;
}

.products-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  padding-top: 8px;
}

.total-amount {
  color: #f56c6c;
  font-size: 18px;
}

/* 结账商品明细样式 */
.checkout-products {
  width: 100%;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}

.checkout-product-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.checkout-product-item .product-name {
  flex: 1;
  color: #606266;
}

.checkout-product-item .product-quantity {
  color: #909399;
  margin: 0 12px;
}

.checkout-product-item .product-amount {
  color: #f56c6c;
  font-weight: 600;
}

.checkout-product-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.checkout-product-total .amount {
  color: #f56c6c;
  font-size: 16px;
}

/* 商品选择弹窗样式 */
.product-select-container {
  max-height: 500px;
  overflow-y: auto;
}

.category-section {
  margin-bottom: 24px;
}

.category-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.product-grid-dialog {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.product-card-dialog {
  position: relative;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fff;
}

.product-card-dialog:hover {
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

.product-card-dialog.selected {
  border-color: #67c23a;
  background: #f0f9ff;
}

.product-image-dialog {
  width: 100%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
  overflow: hidden;
}

.product-image-dialog img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-image-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.product-info-dialog {
  text-align: center;
}

.product-name-dialog {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price-dialog {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
  margin-bottom: 4px;
}

.product-stock-dialog {
  font-size: 12px;
  color: #909399;
}

.product-stock-dialog.unlimited {
  color: #67c23a;
}

.selected-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #67c23a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.quantity-control {
  margin-top: 8px;
}

.dialog-footer-summary {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
  margin-top: 16px;
}

.summary-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.summary-info .total-price {
  color: #f56c6c;
  font-size: 20px;
}

/* 已选商品摘要样式 */
.selected-products-summary {
  width: 100%;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}

.summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.summary-item .product-name {
  flex: 1;
  color: #606266;
}

.summary-item .product-quantity {
  color: #909399;
  margin: 0 12px;
}

.summary-item .product-price {
  color: #f56c6c;
  font-weight: 600;
}
</style>
