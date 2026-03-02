<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue'
import type { Room } from '../../electron/main/database/types'

// 房间列表
const rooms = ref<Room[]>([])
const loading = ref(false)
const searchKeyword = ref('')

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('添加房间')
const isEdit = ref(false)

// 表单数据
const formData = ref<Partial<Room>>({
  name: '',
  type: '麻将',
  hourlyRate: 0
})

// 房间类型选项
const roomTypes = [
  { label: '麻将', value: '麻将' },
  { label: '扑克', value: '扑克' },
  { label: '棋牌', value: '棋牌' },
  { label: '包厢', value: '包厢' }
]

// 状态选项
const statusOptions = [
  { label: '空闲', value: 'available' },
  { label: '使用中', value: 'occupied' },
  { label: '维护中', value: 'maintenance' }
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

// 加载房间列表
const loadRooms = async () => {
  loading.value = true
  try {
    rooms.value = await window.electronAPI.db.rooms.getAll()
  } catch (error) {
    ElMessage.error('加载房间列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 过滤后的房间列表
const filteredRooms = ref<Room[]>([])
const filterRooms = () => {
  if (!searchKeyword.value) {
    filteredRooms.value = rooms.value
  } else {
    const keyword = searchKeyword.value.toLowerCase()
    filteredRooms.value = rooms.value.filter(
      (room) =>
        room.name.toLowerCase().includes(keyword) ||
        room.type.toLowerCase().includes(keyword)
    )
  }
}

// 打开添加对话框
const openAddDialog = () => {
  dialogTitle.value = '添加房间'
  isEdit.value = false
  formData.value = {
    name: '',
    type: '麻将',
    hourlyRate: 0
  }
  dialogVisible.value = true
}

// 打开编辑对话框
const openEditDialog = (room: Room) => {
  dialogTitle.value = '编辑房间'
  isEdit.value = true
  formData.value = { ...room }
  dialogVisible.value = true
}

// 保存房间
const saveRoom = async () => {
  if (!formData.value.name) {
    ElMessage.warning('请输入房间名称')
    return
  }
  if (!formData.value.hourlyRate || formData.value.hourlyRate <= 0) {
    ElMessage.warning('请输入有效的小时费率')
    return
  }

  loading.value = true
  try {
    // 创建纯数据对象，避免 IPC 克隆错误
    const roomData = {
      name: formData.value.name,
      type: formData.value.type,
      hourlyRate: formData.value.hourlyRate,
      status: 'available' // 新增房间默认为空闲状态
    }

    if (isEdit.value && formData.value.id) {
      // 编辑时不修改状态
      const { status, ...updateData } = roomData
      await window.electronAPI.db.rooms.update(formData.value.id, updateData)
      ElMessage.success('更新成功')
    } else {
      await window.electronAPI.db.rooms.create(roomData as Omit<Room, 'id' | 'createdAt' | 'updatedAt'>)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    await loadRooms()
    filterRooms()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 删除房间
const deleteRoom = async (room: Room) => {
  try {
    await ElMessageBox.confirm(`确定要删除房间"${room.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    loading.value = true
    await window.electronAPI.db.rooms.delete(room.id!)
    ElMessage.success('删除成功')
    await loadRooms()
    filterRooms()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(async () => {
  await loadRooms()
  filterRooms()
})

// 监听搜索
const handleSearch = () => {
  filterRooms()
}
</script>

<template>
  <div class="room-management">
    <div class="page-header">
      <h2 class="page-title">房间管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索房间名称或类型"
          :prefix-icon="Search"
          style="width: 240px"
          @input="handleSearch"
          clearable
        />
        <el-button type="primary" :icon="Plus" @click="openAddDialog">
          添加房间
        </el-button>
      </div>
    </div>

    <div class="room-grid">
      <el-card
        v-for="room in filteredRooms"
        :key="room.id"
        class="room-card"
        shadow="hover"
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
        </div>

        <div class="room-actions">
          <el-button
            type="primary"
            :icon="Edit"
            size="small"
            @click="openEditDialog(room)"
          >
            编辑
          </el-button>
          <el-button
            type="danger"
            :icon="Delete"
            size="small"
            @click="deleteRoom(room)"
          >
            删除
          </el-button>
        </div>
      </el-card>

      <div v-if="filteredRooms.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无房间数据" />
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="房间名称" required>
          <el-input v-model="formData.name" placeholder="请输入房间名称" />
        </el-form-item>

        <el-form-item label="房间类型" required>
          <el-select v-model="formData.type" placeholder="请选择房间类型" style="width: 100%">
            <el-option
              v-for="item in roomTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="小时费率" required>
          <el-input-number
            v-model="formData.hourlyRate"
            :min="0"
            :precision="1"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="saveRoom">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.room-management {
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

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.room-card {
  transition: all 0.3s;
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
  font-size: 18px;
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
</style>
