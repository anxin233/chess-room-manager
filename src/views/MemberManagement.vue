<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Wallet, User } from '@element-plus/icons-vue'
import type { Member, Recharge } from '../../electron/main/database/types'

// 会员列表
const members = ref<Member[]>([])
const memberStats = ref<Map<number, {
  totalRecharged: number
  totalReceived: number
  totalBonus: number
  totalSpent: number
  discountRate: number
}>>(new Map())
const loading = ref(false)
const searchKeyword = ref('')

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('添加会员')
const isEdit = ref(false)

// 充值对话框
const rechargeDialog = ref(false)
const selectedMember = ref<Member | null>(null)
const rechargeForm = ref({
  actualAmount: 0, // 实付金额
  receivedAmount: 0, // 到账金额
  paymentMethod: 'cash' as 'cash' | 'card' | 'wechat' | 'alipay'
})

// 充值记录对话框
const rechargeHistoryDialog = ref(false)
const rechargeHistory = ref<Recharge[]>([])
const orderHistory = ref<Order[]>([])
const activeTab = ref('recharge')

// 表单数据
const formData = ref<Partial<Member>>({
  name: '',
  phone: '',
  balance: 0,
  points: 0,
  level: 'normal'
})

// 会员等级选项
const levelOptions = [
  { label: '普通会员', value: 'normal', color: '#909399' },
  { label: '银卡会员', value: 'silver', color: '#c0c4cc' },
  { label: '金卡会员', value: 'gold', color: '#f39c12' },
  { label: '白金会员', value: 'platinum', color: '#9b59b6' }
]

// 支付方式选项
const paymentMethods = [
  { label: '现金', value: 'cash' },
  { label: '刷卡', value: 'card' },
  { label: '微信', value: 'wechat' },
  { label: '支付宝', value: 'alipay' }
]

// 获取等级信息
const getLevelInfo = (level: string) => {
  return levelOptions.find(item => item.value === level) || levelOptions[0]
}

// 加载会员列表
const loadMembers = async () => {
  loading.value = true
  try {
    members.value = await window.electronAPI.db.members.getAll()
    // 加载每个会员的统计信息
    for (const member of members.value) {
      const stats = await window.electronAPI.db.members.getStats(member.id!)
      memberStats.value.set(member.id!, stats)
    }
  } catch (error) {
    ElMessage.error('加载会员列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 获取会员统计信息
const getStats = (memberId: number) => {
  return memberStats.value.get(memberId) || {
    totalRecharged: 0,
    totalReceived: 0,
    totalBonus: 0,
    totalSpent: 0,
    discountRate: 0
  }
}

// 过滤后的会员列表
const filteredMembers = computed(() => {
  if (!searchKeyword.value) {
    return members.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return members.value.filter(
    (member) =>
      member.name.toLowerCase().includes(keyword) ||
      member.phone.includes(keyword)
  )
})

// 打开添加对话框
const openAddDialog = () => {
  dialogTitle.value = '添加会员'
  isEdit.value = false
  formData.value = {
    name: '',
    phone: '',
    balance: 0,
    points: 0,
    level: 'normal'
  }
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (member: Member) => {
  dialogTitle.value = '编辑会员'
  isEdit.value = true
  formData.value = { ...member }
  dialogVisible.value = true
}

// 保存会员
const saveMember = async () => {
  if (!formData.value.name) {
    ElMessage.warning('请输入会员姓名')
    return
  }
  if (!formData.value.phone) {
    ElMessage.warning('请输入手机号')
    return
  }
  // 验证手机号格式
  if (!/^1[3-9]\d{9}$/.test(formData.value.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  loading.value = true
  try {
    const memberData = {
      name: formData.value.name,
      phone: formData.value.phone,
      balance: formData.value.balance || 0,
      points: formData.value.points || 0,
      level: formData.value.level || 'normal'
    }

    if (isEdit.value && formData.value.id) {
      await window.electronAPI.db.members.update(formData.value.id, memberData)
      ElMessage.success('更新成功')
    } else {
      await window.electronAPI.db.members.create(memberData as Omit<Member, 'id' | 'createdAt' | 'updatedAt'>)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    await loadMembers()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 删除会员
const deleteMember = async (member: Member) => {
  try {
    await ElMessageBox.confirm(`确定要删除会员"${member.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    loading.value = true
    await window.electronAPI.db.members.delete(member.id!)
    ElMessage.success('删除成功')
    await loadMembers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  } finally {
    loading.value = false
  }
}

// 打开充值对话框
const openRechargeDialog = (member: Member) => {
  selectedMember.value = member
  rechargeForm.value = {
    actualAmount: 0,
    receivedAmount: 0,
    paymentMethod: 'cash'
  }
  rechargeDialog.value = true
}

// 计算赠送金额
const bonusAmount = computed(() => {
  return rechargeForm.value.receivedAmount - rechargeForm.value.actualAmount
})

// 确认充值
const confirmRecharge = async () => {
  if (!selectedMember.value) return

  if (rechargeForm.value.actualAmount <= 0) {
    ElMessage.warning('请输入实付金额')
    return
  }
  if (rechargeForm.value.receivedAmount <= 0) {
    ElMessage.warning('请输入到账金额')
    return
  }
  if (rechargeForm.value.receivedAmount < rechargeForm.value.actualAmount) {
    ElMessage.warning('到账金额不能小于实付金额')
    return
  }

  loading.value = true
  try {
    const rechargeData = {
      memberId: selectedMember.value.id!,
      amount: rechargeForm.value.actualAmount,
      bonus: bonusAmount.value,
      paymentMethod: rechargeForm.value.paymentMethod
    }

    await window.electronAPI.db.recharges.create(rechargeData)
    ElMessage.success('充值成功')
    rechargeDialog.value = false
    await loadMembers()
  } catch (error) {
    ElMessage.error('充值失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 查看充值记录
const viewRechargeHistory = async (member: Member) => {
  selectedMember.value = member
  activeTab.value = 'recharge'
  loading.value = true
  try {
    rechargeHistory.value = await window.electronAPI.db.recharges.getByMemberId(member.id!)
    // 加载消费记录
    const allOrders = await window.electronAPI.db.orders.getAll()
    orderHistory.value = allOrders.filter(
      order => order.memberId === member.id && order.status === 'completed'
    )
    rechargeHistoryDialog.value = true
  } catch (error) {
    ElMessage.error('加载记录失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  loadMembers()
})
</script>

<template>
  <div class="member-management">
    <div class="page-header">
      <h2 class="page-title">会员管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索会员姓名或手机号"
          :prefix-icon="Search"
          style="width: 240px"
          clearable
        />
        <el-button type="primary" :icon="Plus" @click="openAddDialog">
          添加会员
        </el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table :data="filteredMembers" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="等级" width="110" align="center">
          <template #default="{ row }">
            <el-tag :color="getLevelInfo(row.level).color" style="color: white;">
              {{ getLevelInfo(row.level).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前余额" width="110" align="right">
          <template #default="{ row }">
            <span class="balance-text">¥{{ row.balance.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="充值总额" width="110" align="right">
          <template #default="{ row }">
            <span class="recharge-text">¥{{ getStats(row.id).totalRecharged.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="消费总额" width="110" align="right">
          <template #default="{ row }">
            <span class="spent-text">¥{{ getStats(row.id).totalSpent.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="折扣率" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="getStats(row.id).discountRate > 0" type="success" size="small">
              {{ getStats(row.id).discountRate.toFixed(1) }}%
            </el-tag>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="80" align="center" />
        <el-table-column label="注册时间" width="170">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="320">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                type="success"
                :icon="Wallet"
                size="small"
                @click="openRechargeDialog(row)"
              >
                充值
              </el-button>
              <el-button
                type="primary"
                :icon="Edit"
                size="small"
                @click="openEditDialog(row)"
              >
                编辑
              </el-button>
              <el-button
                type="info"
                size="small"
                @click="viewRechargeHistory(row)"
              >
                记录
              </el-button>
              <el-button
                type="danger"
                :icon="Delete"
                size="small"
                @click="deleteMember(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="filteredMembers.length === 0 && !loading" class="empty-state">
      <el-empty description="暂无会员数据" />
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="会员姓名" required>
          <el-input v-model="formData.name" placeholder="请输入会员姓名" />
        </el-form-item>

        <el-form-item label="手机号" required>
          <el-input
            v-model="formData.phone"
            placeholder="请输入手机号"
            maxlength="11"
            :disabled="isEdit"
          />
        </el-form-item>

        <el-form-item label="会员等级">
          <el-select v-model="formData.level" style="width: 100%">
            <el-option
              v-for="item in levelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="初始积分" v-if="!isEdit">
          <el-input-number
            v-model="formData.points"
            :min="0"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="saveMember">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 充值对话框 -->
    <el-dialog
      v-model="rechargeDialog"
      title="会员充值"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="rechargeForm" label-width="100px" v-if="selectedMember">
        <el-form-item label="会员信息">
          <div class="member-info">
            <div>{{ selectedMember.name }} - {{ selectedMember.phone }}</div>
            <div class="current-balance">当前余额：¥{{ selectedMember.balance.toFixed(1) }}</div>
          </div>
        </el-form-item>

        <el-form-item label="实付金额" required>
          <el-input-number
            v-model="rechargeForm.actualAmount"
            :min="0"
            :precision="1"
            :step="10"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="到账金额" required>
          <el-input-number
            v-model="rechargeForm.receivedAmount"
            :min="0"
            :precision="1"
            :step="10"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="赠送金额">
          <div class="bonus-amount">
            <el-tag v-if="bonusAmount > 0" type="success" size="large">
              +¥{{ bonusAmount.toFixed(1) }}
            </el-tag>
            <span v-else style="color: #909399;">无赠送</span>
          </div>
        </el-form-item>

        <el-form-item label="支付方式">
          <el-select v-model="rechargeForm.paymentMethod" style="width: 100%">
            <el-option
              v-for="item in paymentMethods"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="充值后余额">
          <div class="after-balance">
            ¥{{ (selectedMember.balance + rechargeForm.receivedAmount).toFixed(1) }}
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="rechargeDialog = false">取消</el-button>
        <el-button type="success" :loading="loading" @click="confirmRecharge">
          确认充值
        </el-button>
      </template>
    </el-dialog>

    <!-- 充值记录对话框 -->
    <el-dialog
      v-model="rechargeHistoryDialog"
      title="会员记录"
      width="900px"
    >
      <div v-if="selectedMember" class="history-header">
        <div class="member-info-row">
          <div class="member-basic">
            <div class="member-name">{{ selectedMember.name }}</div>
            <div class="member-phone">{{ selectedMember.phone }}</div>
          </div>
          <div class="member-stats">
            <div class="stat-item">
              <span class="stat-label">当前余额</span>
              <span class="stat-value balance">¥{{ selectedMember.balance.toFixed(1) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">充值总额</span>
              <span class="stat-value recharge">¥{{ getStats(selectedMember.id).totalRecharged.toFixed(1) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">到账总额</span>
              <span class="stat-value received">¥{{ getStats(selectedMember.id).totalReceived.toFixed(1) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">消费总额</span>
              <span class="stat-value spent">¥{{ getStats(selectedMember.id).totalSpent.toFixed(1) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">折扣率</span>
              <span class="stat-value discount">
                <el-tag v-if="getStats(selectedMember.id).discountRate > 0" type="success" size="small">
                  {{ getStats(selectedMember.id).discountRate.toFixed(1) }}%
                </el-tag>
                <span v-else style="color: #909399;">-</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab">
        <!-- 充值记录 -->
        <el-tab-pane label="充值记录" name="recharge">
          <el-table :data="rechargeHistory" stripe style="width: 100%">
            <el-table-column label="充值时间" width="170">
              <template #default="{ row }">
                {{ new Date(row.createdAt).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="实付金额" width="110" align="right">
              <template #default="{ row }">
                <span class="amount-text">¥{{ row.amount.toFixed(1) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="赠送金额" width="110" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.bonus > 0" type="success" size="small">
                  +¥{{ row.bonus.toFixed(1) }}
                </el-tag>
                <span v-else style="color: #909399;">-</span>
              </template>
            </el-table-column>
            <el-table-column label="到账金额" width="110" align="right">
              <template #default="{ row }">
                <span class="received-text">¥{{ (row.amount + row.bonus).toFixed(1) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="支付方式" width="100" align="center">
              <template #default="{ row }">
                {{ paymentMethods.find(m => m.value === row.paymentMethod)?.label }}
              </template>
            </el-table-column>
          </el-table>

          <div v-if="rechargeHistory.length === 0" class="empty-history">
            <el-empty description="暂无充值记录" />
          </div>
        </el-tab-pane>

        <!-- 消费记录 -->
        <el-tab-pane label="消费记录" name="order">
          <el-table :data="orderHistory" stripe style="width: 100%">
            <el-table-column label="消费时间" width="170">
              <template #default="{ row }">
                {{ new Date(row.createdAt).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="开始时间" width="170">
              <template #default="{ row }">
                {{ new Date(row.startTime).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="结束时间" width="170">
              <template #default="{ row }">
                {{ row.endTime ? new Date(row.endTime).toLocaleString() : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="时长" width="100" align="center">
              <template #default="{ row }">
                {{ row.duration ? Math.floor(row.duration / 60) + '小时' + (row.duration % 60) + '分' : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="消费金额" width="110" align="right">
              <template #default="{ row }">
                <span class="spent-amount">¥{{ row.amount.toFixed(1) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="支付方式" width="100" align="center">
              <template #default="{ row }">
                {{ paymentMethods.find(m => m.value === row.paymentMethod)?.label }}
              </template>
            </el-table-column>
          </el-table>

          <div v-if="orderHistory.length === 0" class="empty-history">
            <el-empty description="暂无消费记录" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<style scoped>
.member-management {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.table-container {
  overflow-x: auto;
}

.balance-text {
  color: #67c23a;
  font-weight: 600;
  font-size: 16px;
}

.recharge-text {
  color: #409eff;
  font-weight: 600;
}

.spent-text {
  color: #f56c6c;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.member-info {
  font-size: 16px;
  color: #303133;
}

.current-balance {
  margin-top: 8px;
  color: #67c23a;
  font-weight: 600;
  font-size: 18px;
}

.bonus-amount {
  font-size: 18px;
  font-weight: 600;
}

.after-balance {
  font-size: 24px;
  font-weight: 600;
  color: #67c23a;
}

.history-header {
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.member-info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.member-basic {
  flex-shrink: 0;
}

.member-name {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.member-phone {
  font-size: 14px;
  opacity: 0.9;
}

.member-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  flex: 1;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 8px;
  white-space: nowrap;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.stat-value.balance {
  color: #67c23a;
}

.stat-value.recharge {
  color: #409eff;
}

.stat-value.received {
  color: #95de64;
}

.stat-value.spent {
  color: #ff7875;
}

.stat-value.discount {
  font-size: 16px;
}

.amount-text {
  color: #f56c6c;
  font-weight: 600;
}

.received-text {
  color: #67c23a;
  font-weight: 600;
  font-size: 16px;
}

.spent-amount {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}

.empty-history {
  padding: 40px 0;
}
</style>
