<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts, DataAnalysis, Refresh } from '@element-plus/icons-vue'
import type { Order, ProductSale, Recharge } from '../../electron/main/database/types'

// 时间范围
const dateRange = ref<[Date, Date] | null>(null)
const quickRange = ref('today')

// 数据加载状态
const loading = ref(false)

// 统计数据
const statistics = ref({
  // 营业收入
  totalRevenue: 0,
  roomRevenue: 0,
  productRevenue: 0,
  orderCount: 0,

  // 房间统计
  totalRooms: 0,
  occupiedRooms: 0,
  availableRooms: 0,
  maintenanceRooms: 0,
  utilizationRate: 0,

  // 商品销售
  productSalesCount: 0,
  productSalesAmount: 0,
  topProducts: [] as Array<{ name: string; quantity: number; amount: number }>,

  // 会员统计
  totalRecharge: 0,
  rechargeCount: 0,
  memberOrderCount: 0,
  memberOrderAmount: 0
})

// 订单列表
const orders = ref<Order[]>([])
const productSales = ref<ProductSale[]>([])
const recharges = ref<Recharge[]>([])

// 快捷时间范围选项
const quickRanges = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '自定义', value: 'custom' }
]

// 获取时间范围
const getDateRange = () => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (quickRange.value) {
    case 'today':
      return {
        start: today.toISOString(),
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      }
    case 'week': {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return {
        start: weekStart.toISOString(),
        end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      return {
        start: monthStart.toISOString(),
        end: monthEnd.toISOString()
      }
    }
    case 'custom':
      if (dateRange.value) {
        return {
          start: dateRange.value[0].toISOString(),
          end: new Date(dateRange.value[1].getTime() + 24 * 60 * 60 * 1000).toISOString()
        }
      }
      return { start: today.toISOString(), end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString() }
    default:
      return { start: today.toISOString(), end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString() }
  }
}

// 加载统计数据
const loadStatistics = async () => {
  loading.value = true
  try {
    const range = getDateRange()

    // 加载订单数据
    const allOrders = await window.electronAPI.db.orders.getAll()
    orders.value = allOrders.filter(order => {
      const orderTime = new Date(order.startTime).getTime()
      return orderTime >= new Date(range.start).getTime() && orderTime < new Date(range.end).getTime()
    })

    // 加载商品销售数据
    const allProductSales = await window.electronAPI.db.productSales.getAll()
    productSales.value = allProductSales.filter(sale => {
      const saleTime = new Date(sale.createdAt!).getTime()
      return saleTime >= new Date(range.start).getTime() && saleTime < new Date(range.end).getTime()
    })

    // 加载充值数据
    const allRecharges = await window.electronAPI.db.recharges.getAll()
    recharges.value = allRecharges.filter(recharge => {
      const rechargeTime = new Date(recharge.createdAt!).getTime()
      return rechargeTime >= new Date(range.start).getTime() && rechargeTime < new Date(range.end).getTime()
    })

    // 计算营业收入
    const completedOrders = orders.value.filter(o => o.status === 'completed')
    statistics.value.orderCount = completedOrders.length
    statistics.value.roomRevenue = completedOrders.reduce((sum, order) => sum + order.amount, 0)
    statistics.value.productRevenue = productSales.value.reduce((sum, sale) => sum + sale.amount, 0)
    statistics.value.totalRevenue = statistics.value.roomRevenue + statistics.value.productRevenue

    // 计算房间统计
    const rooms = await window.electronAPI.db.rooms.getAll()
    statistics.value.totalRooms = rooms.length
    statistics.value.occupiedRooms = rooms.filter(r => r.status === 'occupied').length
    statistics.value.availableRooms = rooms.filter(r => r.status === 'available').length
    statistics.value.maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length
    statistics.value.utilizationRate = statistics.value.totalRooms > 0
      ? Math.round((statistics.value.occupiedRooms / statistics.value.totalRooms) * 100)
      : 0

    // 计算商品销售统计
    statistics.value.productSalesCount = productSales.value.reduce((sum, sale) => sum + sale.quantity, 0)
    statistics.value.productSalesAmount = statistics.value.productRevenue

    // 计算热销商品
    const productMap = new Map<number, { name: string; quantity: number; amount: number }>()
    for (const sale of productSales.value) {
      const product = await window.electronAPI.db.products.getById(sale.productId)
      if (product) {
        const existing = productMap.get(sale.productId)
        if (existing) {
          existing.quantity += sale.quantity
          existing.amount += sale.amount
        } else {
          productMap.set(sale.productId, {
            name: product.name,
            quantity: sale.quantity,
            amount: sale.amount
          })
        }
      }
    }
    statistics.value.topProducts = Array.from(productMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // 计算会员统计
    statistics.value.totalRecharge = recharges.value.reduce((sum, r) => sum + r.amount, 0)
    statistics.value.rechargeCount = recharges.value.length
    statistics.value.memberOrderCount = completedOrders.filter(o => o.memberId).length
    statistics.value.memberOrderAmount = completedOrders
      .filter(o => o.memberId)
      .reduce((sum, order) => sum + order.amount, 0)

  } catch (error) {
    ElMessage.error('加载统计数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 切换快捷时间范围
const changeQuickRange = (value: string) => {
  quickRange.value = value
  if (value !== 'custom') {
    dateRange.value = null
  }
  loadStatistics()
}

// 自定义时间范围变化
const onDateRangeChange = () => {
  if (dateRange.value) {
    quickRange.value = 'custom'
    loadStatistics()
  }
}

// 格式化金额
const formatAmount = (amount: number) => {
  return `¥${amount.toFixed(1)}`
}

// 收入构成百分比（用于环形图）
const revenueComposition = computed(() => {
  const total = statistics.value.totalRevenue || 1
  const roomPct = Math.round((statistics.value.roomRevenue / total) * 100)
  const productPct = 100 - roomPct
  return { roomPct, productPct }
})

// 热销商品最大销售额（用于百分比条）
const maxProductAmount = computed(() => {
  if (statistics.value.topProducts.length === 0) return 1
  return Math.max(...statistics.value.topProducts.map(p => p.amount))
})

// 每日收入趋势（最近7天）
const dailyRevenueTrend = computed(() => {
  const days: Array<{ label: string; revenue: number; orders: number }> = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
    const dayOrders = orders.value.filter(o => {
      const t = new Date(o.startTime).getTime()
      return o.status === 'completed' && t >= date.getTime() && t < nextDate.getTime()
    })
    days.push({
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      revenue: dayOrders.reduce((s, o) => s + o.amount, 0),
      orders: dayOrders.length
    })
  }
  return days
})

const maxDailyRevenue = computed(() => {
  return Math.max(...dailyRevenueTrend.value.map(d => d.revenue), 1)
})

// 导出 CSV
const exportCSV = async () => {
  const completedOrders = orders.value.filter(o => o.status === 'completed')
  if (completedOrders.length === 0) {
    ElMessage.warning('暂无可导出的数据')
    return
  }

  const headers = ['订单ID', '房间ID', '会员ID', '费率', '开始时间', '结束时间', '时长(分钟)', '金额', '支付方式', '状态']
  const rows = completedOrders.map(o => [
    o.id, o.roomId, o.memberId || '', o.hourlyRate || '',
    o.startTime, o.endTime || '', o.duration || '',
    o.amount, o.paymentMethod, o.status
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

  const range = getDateRange()
  const startLabel = new Date(range.start).toISOString().slice(0, 10)
  const endLabel = new Date(range.end).toISOString().slice(0, 10)
  const result = await window.electronAPI.exportCsv(csv, `营业报表_${startLabel}_${endLabel}.csv`)
  if (result.success) {
    ElMessage.success(`已导出到 ${result.path}`)
  }
}

// 初始化
onMounted(() => {
  loadStatistics()
})
</script>

<template>
  <div class="statistics">
    <div class="page-header">
      <h2 class="page-title">数据统计</h2>
      <div class="header-actions">
        <el-radio-group v-model="quickRange" @change="changeQuickRange">
          <el-radio-button
            v-for="item in quickRanges"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="quickRange === 'custom'"
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="onDateRangeChange"
          style="margin-left: 12px"
        />
        <el-button :icon="Refresh" @click="loadStatistics" :loading="loading" style="margin-left: 12px">
          刷新
        </el-button>
        <el-button type="primary" plain @click="exportCSV" style="margin-left: 8px">
          导出 CSV
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="statistics-content">
      <!-- 营业收入概览 -->
      <div class="section-title">
        <el-icon><TrendCharts /></el-icon>
        <span>营业收入</span>
      </div>
      <div class="stats-grid">
        <el-card class="stat-card primary">
          <div class="stat-label">总收入</div>
          <div class="stat-value">{{ formatAmount(statistics.totalRevenue) }}</div>
          <div class="stat-desc">订单数: {{ statistics.orderCount }}</div>
        </el-card>
        <el-card class="stat-card success">
          <div class="stat-label">房费收入</div>
          <div class="stat-value">{{ formatAmount(statistics.roomRevenue) }}</div>
          <div class="stat-desc">占比: {{ statistics.totalRevenue > 0 ? Math.round((statistics.roomRevenue / statistics.totalRevenue) * 100) : 0 }}%</div>
        </el-card>
        <el-card class="stat-card warning">
          <div class="stat-label">商品收入</div>
          <div class="stat-value">{{ formatAmount(statistics.productRevenue) }}</div>
          <div class="stat-desc">占比: {{ statistics.totalRevenue > 0 ? Math.round((statistics.productRevenue / statistics.totalRevenue) * 100) : 0 }}%</div>
        </el-card>
        <el-card class="stat-card info">
          <div class="stat-label">会员充值</div>
          <div class="stat-value">{{ formatAmount(statistics.totalRecharge) }}</div>
          <div class="stat-desc">充值次数: {{ statistics.rechargeCount }}</div>
        </el-card>
      </div>

      <!-- 图表区域 -->
      <div class="charts-row">
        <!-- 收入构成环形图 -->
        <el-card class="chart-card">
          <div class="card-title">收入构成</div>
          <div class="donut-chart-wrapper" v-if="statistics.totalRevenue > 0">
            <div
              class="donut-chart"
              :style="{ background: `conic-gradient(#667eea 0% ${revenueComposition.roomPct}%, #f5576c ${revenueComposition.roomPct}% 100%)` }"
            >
              <div class="donut-center">
                <div class="donut-total">{{ formatAmount(statistics.totalRevenue) }}</div>
                <div class="donut-label">总收入</div>
              </div>
            </div>
            <div class="donut-legend">
              <div class="legend-item">
                <span class="legend-dot" style="background: #667eea;"></span>
                <span>房费 {{ revenueComposition.roomPct }}%</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background: #f5576c;"></span>
                <span>商品 {{ revenueComposition.productPct }}%</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无收入数据" :image-size="60" />
        </el-card>

        <!-- 每日收入趋势 -->
        <el-card class="chart-card trend-card">
          <div class="card-title">近7日收入趋势</div>
          <div class="bar-chart" v-if="dailyRevenueTrend.some(d => d.revenue > 0)">
            <div v-for="(day, i) in dailyRevenueTrend" :key="i" class="bar-column">
              <div class="bar-value">{{ day.revenue > 0 ? '¥' + day.revenue.toFixed(0) : '' }}</div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ height: (day.revenue / maxDailyRevenue * 100) + '%' }"
                ></div>
              </div>
              <div class="bar-label">{{ day.label }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无趋势数据" :image-size="60" />
        </el-card>
      </div>

      <!-- 房间使用统计 -->
      <div class="section-title">
        <el-icon><DataAnalysis /></el-icon>
        <span>房间使用</span>
      </div>
      <div class="stats-grid">
        <el-card class="stat-card">
          <div class="stat-label">总房间数</div>
          <div class="stat-value">{{ statistics.totalRooms }}</div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-label">使用中</div>
          <div class="stat-value occupied">{{ statistics.occupiedRooms }}</div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-label">空闲中</div>
          <div class="stat-value available">{{ statistics.availableRooms }}</div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-label">维护中</div>
          <div class="stat-value maintenance">{{ statistics.maintenanceRooms }}</div>
        </el-card>
        <el-card class="stat-card highlight">
          <div class="stat-label">使用率</div>
          <div class="stat-value">{{ statistics.utilizationRate }}%</div>
          <el-progress :percentage="statistics.utilizationRate" :show-text="false" />
        </el-card>
      </div>

      <!-- 商品销售统计 -->
      <div class="section-title">
        <el-icon><TrendCharts /></el-icon>
        <span>商品销售</span>
      </div>
      <div class="stats-row">
        <el-card class="stat-card-wide">
          <div class="stat-label">销售总额</div>
          <div class="stat-value">{{ formatAmount(statistics.productSalesAmount) }}</div>
          <div class="stat-desc">销售数量: {{ statistics.productSalesCount }} 件</div>
        </el-card>
        <el-card class="top-products-card">
          <div class="card-title">热销商品 TOP5</div>
          <div v-if="statistics.topProducts.length === 0" class="empty-data">
            <el-empty description="暂无销售数据" :image-size="80" />
          </div>
          <div v-else class="top-products-list">
            <div v-for="(item, index) in statistics.topProducts" :key="index" class="product-item">
              <div class="product-rank">{{ index + 1 }}</div>
              <div class="product-info">
                <div class="product-name">{{ item.name }}</div>
                <div class="product-bar-track">
                  <div
                    class="product-bar-fill"
                    :style="{ width: (item.amount / maxProductAmount * 100) + '%' }"
                  ></div>
                </div>
                <div class="product-stats">
                  <span>销量: {{ item.quantity }}</span>
                  <span class="amount">{{ formatAmount(item.amount) }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 会员消费统计 -->
      <div class="section-title">
        <el-icon><DataAnalysis /></el-icon>
        <span>会员消费</span>
      </div>
      <div class="stats-grid">
        <el-card class="stat-card">
          <div class="stat-label">会员订单数</div>
          <div class="stat-value">{{ statistics.memberOrderCount }}</div>
          <div class="stat-desc">占总订单: {{ statistics.orderCount > 0 ? Math.round((statistics.memberOrderCount / statistics.orderCount) * 100) : 0 }}%</div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-label">会员消费额</div>
          <div class="stat-value">{{ formatAmount(statistics.memberOrderAmount) }}</div>
          <div class="stat-desc">占总收入: {{ statistics.totalRevenue > 0 ? Math.round((statistics.memberOrderAmount / statistics.totalRevenue) * 100) : 0 }}%</div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-label">充值总额</div>
          <div class="stat-value">{{ formatAmount(statistics.totalRecharge) }}</div>
          <div class="stat-desc">充值次数: {{ statistics.rechargeCount }}</div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.statistics {
  padding: 28px;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  background: var(--bg-card);
  padding: 20px 24px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: background-color var(--transition-normal), box-shadow var(--transition-normal);
  border: 1px solid var(--border-light);
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.header-actions {
  display: flex;
  align-items: center;
}

.statistics-content {
  min-height: 400px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 28px 0 16px;
  padding-left: 12px;
  border-left: 3px solid #409eff;
  transition: color var(--transition-normal);
}

.section-title .el-icon {
  margin-right: 8px;
  font-size: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stats-row {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  transition: all var(--transition-normal);
  cursor: default;
  border: 1px solid var(--border-light);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.stat-card.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.stat-card.success {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.stat-card.warning {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.stat-card.info {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: #fff;
}

.stat-card.highlight {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: #fff;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-value.occupied {
  color: #e6a23c;
}

.stat-value.available {
  color: #67c23a;
}

.stat-value.maintenance {
  color: #f56c6c;
}

.stat-desc {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 8px;
}

.stat-card-wide {
  padding: 24px;
}

.top-products-card {
  padding: 20px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light);
  transition: color var(--transition-normal), border-color var(--transition-normal);
}

.empty-data {
  padding: 20px 0;
}

.top-products-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--bg-muted);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.product-item:hover {
  background: var(--active-bg);
  transform: translateX(4px);
}

.product-rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
}

.product-item:nth-child(1) .product-rank {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.product-item:nth-child(2) .product-rank {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.product-item:nth-child(3) .product-rank {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.product-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.product-stats .amount {
  color: #f56c6c;
  font-weight: 600;
}

.product-bar-track {
  height: 6px;
  background: var(--border-light);
  border-radius: 3px;
  margin: 6px 0;
  overflow: hidden;
}

.product-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.6s ease;
}

/* 图表区域 */
.charts-row {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  margin-bottom: 24px;
  margin-top: 20px;
}

.chart-card {
  padding: 20px;
  border: 1px solid var(--border-light);
}

/* 环形图 */
.donut-chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}

.donut-chart {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.donut-center {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-total {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.donut-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.donut-legend {
  display: flex;
  gap: 20px;
  margin-top: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-regular);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 柱状图 */
.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 220px;
  padding: 16px 0;
}

.bar-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-value {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  white-space: nowrap;
  min-height: 16px;
}

.bar-track {
  flex: 1;
  width: 100%;
  max-width: 40px;
  background: var(--border-light);
  border-radius: 4px 4px 0 0;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #667eea, #764ba2);
  border-radius: 4px 4px 0 0;
  transition: height 0.6s ease;
  min-height: 2px;
}

.bar-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
  white-space: nowrap;
}
</style>
