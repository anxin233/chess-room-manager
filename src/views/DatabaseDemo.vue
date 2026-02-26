<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { Room } from '../../electron/main/database/types'

const rooms = ref<Room[]>([])
const loading = ref(false)

// 表单数据
const roomForm = ref({
  name: '',
  type: 'mahjong',
  hourlyRate: 0,
  status: 'available' as const
})

// 加载房间列表
const loadRooms = async () => {
  try {
    loading.value = true
    rooms.value = await window.electronAPI.db.rooms.getAll()
    ElMessage.success(`加载了 ${rooms.value.length} 个房间`)
  } catch (error) {
    console.error('加载房间失败:', error)
    ElMessage.error('加载房间失败')
  } finally {
    loading.value = false
  }
}

// 创建房间
const createRoom = async () => {
  if (!roomForm.value.name || !roomForm.value.hourlyRate) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    const newRoom = await window.electronAPI.db.rooms.create(roomForm.value)
    ElMessage.success(`房间 "${newRoom.name}" 创建成功`)
    roomForm.value = { name: '', type: 'mahjong', hourlyRate: 0, status: 'available' }
    await loadRooms()
  } catch (error) {
    console.error('创建房间失败:', error)
    ElMessage.error('创建房间失败')
  }
}

// 删除房间
const deleteRoom = async (id: number, name: string) => {
  try {
    await window.electronAPI.db.rooms.delete(id)
    ElMessage.success(`房间 "${name}" 已删除`)
    await loadRooms()
  } catch (error) {
    console.error('删除房间失败:', error)
    ElMessage.error('删除房间失败')
  }
}

// 更新房间状态
const updateRoomStatus = async (room: Room, newStatus: Room['status']) => {
  try {
    await window.electronAPI.db.rooms.update(room.id!, { status: newStatus })
    ElMessage.success(`房间状态已更新为 ${newStatus}`)
    await loadRooms()
  } catch (error) {
    console.error('更新房间状态失败:', error)
    ElMessage.error('更新房间状态失败')
  }
}

onMounted(() => {
  loadRooms()
})
</script>

<template>
  <div class="database-demo">
    <el-card class="header-card">
      <h2>数据库测试 - 房间管理</h2>
      <p>这是一个 SQLite 数据库集成示例</p>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card header="添加新房间">
          <el-form :model="roomForm" label-width="80px">
            <el-form-item label="房间名称">
              <el-input v-model="roomForm.name" placeholder="例如：1号房" />
            </el-form-item>

            <el-form-item label="房间类型">
              <el-select v-model="roomForm.type" style="width: 100%">
                <el-option label="麻将" value="mahjong" />
                <el-option label="扑克" value="poker" />
                <el-option label="棋类" value="chess" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>

            <el-form-item label="小时费率">
              <el-input-number
                v-model="roomForm.hourlyRate"
                :min="0"
                :step="10"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="createRoom" style="width: 100%">
                创建房间
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>房间列表</span>
              <el-button :icon="RefreshRight" @click="loadRooms" :loading="loading">
                刷新
              </el-button>
            </div>
          </template>

          <el-table :data="rooms" v-loading="loading" stripe>
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="房间名称" width="120" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.type === 'mahjong'" type="success">麻将</el-tag>
                <el-tag v-else-if="row.type === 'poker'" type="warning">扑克</el-tag>
                <el-tag v-else-if="row.type === 'chess'" type="info">棋类</el-tag>
                <el-tag v-else>其他</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="hourlyRate" label="费率(元/时)" width="120" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'available'" type="success">空闲</el-tag>
                <el-tag v-else-if="row.status === 'occupied'" type="danger">使用中</el-tag>
                <el-tag v-else type="info">维护中</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="200">
              <template #default="{ row }">
                <el-button-group>
                  <el-button
                    v-if="row.status !== 'occupied'"
                    size="small"
                    type="primary"
                    @click="updateRoomStatus(row, 'occupied')"
                  >
                    开始使用
                  </el-button>
                  <el-button
                    v-if="row.status === 'occupied'"
                    size="small"
                    type="success"
                    @click="updateRoomStatus(row, 'available')"
                  >
                    结束使用
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="deleteRoom(row.id, row.name)"
                  >
                    删除
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!loading && rooms.length === 0" description="暂无房间数据" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.database-demo {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header-card {
  margin-bottom: 2rem;
  text-align: center;
}

.header-card h2 {
  margin-bottom: 0.5rem;
  color: var(--el-color-primary);
}

.header-card p {
  color: var(--el-text-color-secondary);
}
</style>
