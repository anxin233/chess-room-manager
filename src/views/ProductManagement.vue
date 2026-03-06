<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Box, FolderAdd } from '@element-plus/icons-vue'
import type { Product, ProductCategory } from '../../electron/main/database/types'

// 商品分类列表
const categories = ref<ProductCategory[]>([])
const selectedCategoryId = ref<number | null>(null)

// 商品列表
const products = ref<Product[]>([])
const loading = ref(false)
const searchKeyword = ref('')

// 分类对话框
const categoryDialogVisible = ref(false)
const categoryDialogTitle = ref('添加分类')
const isCategoryEdit = ref(false)
const categoryFormData = ref({
  id: undefined as number | undefined,
  name: '',
  sortOrder: 0
})

// 商品对话框
const productDialogVisible = ref(false)
const productDialogTitle = ref('添加商品')
const isProductEdit = ref(false)
const productFormData = ref<Partial<Product>>({
  name: '',
  categoryId: undefined,
  price: 0,
  stock: 0,
  isUnlimitedStock: false,
  imageUrl: undefined,
  status: 'available'
})

// 图片预览
const imagePreview = ref<string | null>(null)

// 库存调整对话框
const stockDialog = ref(false)
const selectedProduct = ref<Product | null>(null)
const stockForm = ref({
  type: 'in' as 'in' | 'out',
  quantity: 0,
  reason: ''
})

// 上传图片
const uploadImage = async () => {
  try {
    const imagePath = await window.electronAPI.uploadImage()
    if (imagePath) {
      productFormData.value.imageUrl = imagePath
      // 使用自定义协议预览
      imagePreview.value = `app://${imagePath}`
    }
  } catch (error) {
    ElMessage.error('上传图片失败')
    console.error(error)
  }
}

// 移除图片
const removeImage = () => {
  productFormData.value.imageUrl = undefined
  imagePreview.value = null
}

// 加载图片预览
const loadImagePreview = async (imageUrl?: string) => {
  if (!imageUrl) {
    imagePreview.value = null
    return
  }
  // 使用自定义协议
  imagePreview.value = `app://${imageUrl}`
}

// 单位选项（已移除）

// 获取库存状态
const getStockStatus = (product: Product) => {
  if (product.isUnlimitedStock) return { type: 'success', text: '无限库存' }
  if (product.stock === 0) return { type: 'danger', text: '缺货' }
  if (product.stock < 10) return { type: 'warning', text: '库存不足' }
  return { type: 'success', text: '库存充足' }
}

// 加载商品分类
const loadCategories = async () => {
  loading.value = true
  try {
    categories.value = await window.electronAPI.db.productCategories.getAll()
    if (categories.value.length > 0 && !selectedCategoryId.value) {
      selectedCategoryId.value = categories.value[0].id!
    }
  } catch (error) {
    ElMessage.error('加载分类失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 加载商品列表
const loadProducts = async () => {
  loading.value = true
  try {
    if (selectedCategoryId.value) {
      const productList = await window.electronAPI.db.products.getByCategoryId(selectedCategoryId.value)
      // 直接使用自定义协议 URL
      for (const product of productList) {
        if (product.imageUrl) {
          (product as any).imageAppUrl = `app://${product.imageUrl}`
        }
      }
      products.value = productList
    } else {
      products.value = []
    }
  } catch (error) {
    ElMessage.error('加载商品列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 过滤后的商品列表
const filteredProducts = computed(() => {
  if (!searchKeyword.value) {
    return products.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return products.value.filter(product => product.name.toLowerCase().includes(keyword))
})

// 选择分类
const selectCategory = async (categoryId: number) => {
  selectedCategoryId.value = categoryId
  await loadProducts()
}

// 打开添加分类对话框
const openAddCategoryDialog = () => {
  categoryDialogTitle.value = '添加分类'
  isCategoryEdit.value = false
  categoryFormData.value = {
    id: undefined,
    name: '',
    sortOrder: categories.value.length
  }
  categoryDialogVisible.value = true
}

// 打开编辑分类对话框
const openEditCategoryDialog = (category: ProductCategory) => {
  categoryDialogTitle.value = '编辑分类'
  isCategoryEdit.value = true
  categoryFormData.value = { id: category.id, name: category.name, sortOrder: category.sortOrder }
  categoryDialogVisible.value = true
}

// 保存分类
const saveCategory = async () => {
  if (!categoryFormData.value.name) {
    ElMessage.warning('请输入分类名称')
    return
  }

  loading.value = true
  try {
    if (isCategoryEdit.value && categoryFormData.value.id) {
      await window.electronAPI.db.productCategories.update(categoryFormData.value.id, {
        name: categoryFormData.value.name,
        sortOrder: categoryFormData.value.sortOrder
      })
      ElMessage.success('更新成功')
    } else {
      await window.electronAPI.db.productCategories.create({
        name: categoryFormData.value.name,
        sortOrder: categoryFormData.value.sortOrder
      })
      ElMessage.success('添加成功')
    }
    categoryDialogVisible.value = false
    await loadCategories()
  } catch (error) {
    ElMessage.error(isCategoryEdit.value ? '更新失败' : '添加失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 删除分类
const deleteCategory = async (category: ProductCategory) => {
  try {
    await ElMessageBox.confirm(`确定要删除分类"${category.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    loading.value = true
    await window.electronAPI.db.productCategories.delete(category.id!)
    ElMessage.success('删除成功')
    if (selectedCategoryId.value === category.id) {
      selectedCategoryId.value = categories.value[0]?.id || null
    }
    await loadCategories()
    await loadProducts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
      console.error(error)
    }
  } finally {
    loading.value = false
  }
}

// 打开添加商品对话框
const openAddProductDialog = () => {
  if (!selectedCategoryId.value) {
    ElMessage.warning('请先选择分类')
    return
  }
  productDialogTitle.value = '添加商品'
  isProductEdit.value = false
  productFormData.value = {
    name: '',
    categoryId: selectedCategoryId.value,
    price: 0,
    stock: 0,
    isUnlimitedStock: false,
    imageUrl: undefined,
    status: 'available'
  }
  imagePreview.value = null
  productDialogVisible.value = true
}

// 打开编辑商品对话框
const openEditProductDialog = async (product: Product) => {
  productDialogTitle.value = '编辑商品'
  isProductEdit.value = true
  productFormData.value = { ...product }
  await loadImagePreview(product.imageUrl)
  productDialogVisible.value = true
}

// 保存商品
const saveProduct = async () => {
  if (!productFormData.value.name) {
    ElMessage.warning('请输入商品名称')
    return
  }
  if (productFormData.value.price === undefined || productFormData.value.price < 0) {
    ElMessage.warning('请输入有效的价格')
    return
  }

  loading.value = true
  try {
    const productData = {
      name: productFormData.value.name,
      categoryId: productFormData.value.categoryId!,
      price: productFormData.value.price,
      stock: productFormData.value.isUnlimitedStock ? 0 : (productFormData.value.stock || 0),
      isUnlimitedStock: productFormData.value.isUnlimitedStock || false,
      imageUrl: productFormData.value.imageUrl,
      status: productFormData.value.status || 'available'
    }

    if (isProductEdit.value && productFormData.value.id) {
      await window.electronAPI.db.products.update(productFormData.value.id, productData)
      ElMessage.success('更新成功')
    } else {
      await window.electronAPI.db.products.create(productData as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>)
      ElMessage.success('添加成功')
    }
    productDialogVisible.value = false
    await loadProducts()
  } catch (error) {
    ElMessage.error(isProductEdit.value ? '更新失败' : '添加失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 删除商品
const deleteProduct = async (product: Product) => {
  try {
    await ElMessageBox.confirm(`确定要删除商品"${product.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    loading.value = true
    await window.electronAPI.db.products.delete(product.id!)
    ElMessage.success('删除成功')
    await loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  } finally {
    loading.value = false
  }
}

// 打开库存调整对话框
const openStockDialog = (product: Product) => {
  if (product.isUnlimitedStock) {
    ElMessage.warning('无限库存商品无需调整库存')
    return
  }
  selectedProduct.value = product
  stockForm.value = {
    type: 'in',
    quantity: 0,
    reason: ''
  }
  stockDialog.value = true
}

// 确认库存调整
const confirmStockAdjustment = async () => {
  if (!selectedProduct.value) return

  if (stockForm.value.quantity <= 0) {
    ElMessage.warning('请输入有效的数量')
    return
  }

  loading.value = true
  try {
    const newStock = stockForm.value.type === 'in'
      ? selectedProduct.value.stock + stockForm.value.quantity
      : selectedProduct.value.stock - stockForm.value.quantity

    if (newStock < 0) {
      ElMessage.warning('库存不足，无法出库')
      loading.value = false
      return
    }

    await window.electronAPI.db.products.update(selectedProduct.value.id!, { stock: newStock })
    ElMessage.success('库存调整成功')
    stockDialog.value = false
    await loadProducts()
  } catch (error) {
    ElMessage.error('库存调整失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(async () => {
  await loadCategories()
  if (selectedCategoryId.value) {
    await loadProducts()
  }
})
</script>

<template>
  <div class="product-management">
    <div class="page-header">
      <h2 class="page-title">商品管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称"
          :prefix-icon="Search"
          style="width: 200px"
          clearable
        />
        <el-button type="success" :icon="FolderAdd" @click="openAddCategoryDialog">
          添加分类
        </el-button>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- 左侧分类列表 -->
      <div class="category-sidebar">
        <div class="category-header">
          <span>商品分类</span>
        </div>
        <div class="category-list">
          <div
            v-for="category in categories"
            :key="category.id"
            :class="['category-item', { active: selectedCategoryId === category.id }]"
            @click="selectCategory(category.id!)"
          >
            <span class="category-name">{{ category.name }}</span>
            <div class="category-actions">
              <el-icon @click.stop="openEditCategoryDialog(category)" class="action-icon">
                <Edit />
              </el-icon>
              <el-icon @click.stop="deleteCategory(category)" class="action-icon delete">
                <Delete />
              </el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧商品列表 -->
      <div class="product-content">
        <div v-if="!selectedCategoryId" class="empty-category">
          <el-empty description="请先添加商品分类" />
        </div>

        <template v-else>
          <!-- 商品区域头部 -->
          <div class="product-header-bar">
            <div class="product-count">
              共 {{ filteredProducts.length }} 个商品
            </div>
            <el-button type="primary" :icon="Plus" @click="openAddProductDialog">
              添加商品
            </el-button>
          </div>

          <div v-if="filteredProducts.length === 0 && !loading" class="empty-products">
            <el-empty description="该分类下暂无商品" />
          </div>

          <div v-else class="product-grid" v-loading="loading">
          <div v-for="product in filteredProducts" :key="product.id" class="product-card">
            <!-- 商品图片 -->
            <div class="product-image">
              <img
                v-if="(product as any).imageAppUrl"
                :src="(product as any).imageAppUrl"
                alt="商品图片"
              />
              <div v-else class="default-image">
                <el-icon :size="60"><Box /></el-icon>
                <div>暂无图片</div>
              </div>
            </div>

            <div class="product-header">
              <div class="product-name">{{ product.name }}</div>
              <el-tag :type="getStockStatus(product).type" size="small">
                {{ getStockStatus(product).text }}
              </el-tag>
            </div>

            <div class="product-price">¥{{ product.price.toFixed(1) }}</div>

            <div class="product-info">
              <div class="info-row" v-if="!product.isUnlimitedStock">
                <span class="label">库存：</span>
                <span class="value">{{ product.stock }}</span>
              </div>
              <div class="info-row">
                <span class="label">状态：</span>
                <el-tag :type="product.status === 'available' ? 'success' : 'info'" size="small">
                  {{ product.status === 'available' ? '在售' : '下架' }}
                </el-tag>
              </div>
            </div>

            <div class="product-actions">
              <el-button
                v-if="!product.isUnlimitedStock"
                type="warning"
                :icon="Box"
                size="small"
                @click="openStockDialog(product)"
              >
                库存
              </el-button>
              <el-button type="primary" :icon="Edit" size="small" @click="openEditProductDialog(product)">
                编辑
              </el-button>
              <el-button type="danger" :icon="Delete" size="small" @click="deleteProduct(product)">
                删除
              </el-button>
            </div>
          </div>
        </div>
        </template>
      </div>
    </div>

    <!-- 分类对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="categoryDialogTitle"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="categoryFormData" label-width="80px">
        <el-form-item label="分类名称" required>
          <el-input v-model="categoryFormData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryFormData.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="saveCategory">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 商品对话框 -->
    <el-dialog
      v-model="productDialogVisible"
      :title="productDialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="productFormData" label-width="100px">
        <el-form-item label="商品图片">
          <div class="image-upload-area">
            <div v-if="imagePreview" class="image-preview">
              <img :src="imagePreview" alt="商品图片" />
              <div class="image-actions">
                <el-button type="primary" size="small" @click="uploadImage">更换图片</el-button>
                <el-button type="danger" size="small" @click="removeImage">移除图片</el-button>
              </div>
            </div>
            <div v-else class="upload-placeholder" @click="uploadImage">
              <el-icon :size="40"><Plus /></el-icon>
              <div>点击上传图片</div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="商品名称" required>
          <el-input v-model="productFormData.name" placeholder="请输入商品名称" />
        </el-form-item>

        <el-form-item label="价格" required>
          <el-input-number
            v-model="productFormData.price"
            :min="0"
            :precision="1"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="库存设置">
          <el-checkbox v-model="productFormData.isUnlimitedStock">无限库存</el-checkbox>
        </el-form-item>

        <el-form-item label="初始库存" v-if="!isProductEdit && !productFormData.isUnlimitedStock">
          <el-input-number
            v-model="productFormData.stock"
            :min="0"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="productFormData.status">
            <el-radio value="available">在售</el-radio>
            <el-radio value="unavailable">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="saveProduct">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 库存调整对话框 -->
    <el-dialog
      v-model="stockDialog"
      title="库存调整"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="stockForm" label-width="100px" v-if="selectedProduct">
        <el-form-item label="商品名称">
          <el-input :value="selectedProduct.name" disabled />
        </el-form-item>

        <el-form-item label="当前库存">
          <div class="current-stock">
            {{ selectedProduct.stock }}
          </div>
        </el-form-item>

        <el-form-item label="调整类型" required>
          <el-radio-group v-model="stockForm.type">
            <el-radio value="in">入库</el-radio>
            <el-radio value="out">出库</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="调整数量" required>
          <el-input-number
            v-model="stockForm.quantity"
            :min="1"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="调整后库存">
          <div class="after-stock">
            {{ stockForm.type === 'in'
              ? selectedProduct.stock + stockForm.quantity
              : selectedProduct.stock - stockForm.quantity
            }}
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="stockForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入调整原因（选填）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="stockDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="confirmStockAdjustment">
          确认调整
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.product-management {
  padding: 28px;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: background-color var(--transition-normal), box-shadow var(--transition-normal);
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
  gap: 12px;
}

.content-wrapper {
  display: flex;
  gap: 20px;
  min-height: calc(100vh - 140px);
}

/* 左侧分类栏 */
.category-sidebar {
  width: 220px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
  transition: background-color var(--transition-normal), box-shadow var(--transition-normal);
  border: 1px solid var(--border-light);
}

.category-header {
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: color var(--transition-normal), border-color var(--transition-normal);
}

.category-list {
  padding: 8px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  margin-bottom: 2px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-regular);
  font-size: 14px;
  transition: all var(--transition-fast);
}

.category-item:hover {
  background: var(--hover-bg);
}

.category-item.active {
  background: var(--active-bg);
  color: #409eff;
  font-weight: 500;
}

.category-name {
  font-size: 14px;
  flex: 1;
}

.category-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.category-item:hover .category-actions {
  opacity: 1;
}

.action-icon {
  font-size: 16px;
  cursor: pointer;
  color: #409eff;
}

.action-icon.delete {
  color: #f56c6c;
}

.action-icon:hover {
  opacity: 0.7;
}

/* 右侧商品区域 */
.product-content {
  flex: 1;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: background-color var(--transition-normal), box-shadow var(--transition-normal);
  border: 1px solid var(--border-light);
}

.product-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
  transition: border-color var(--transition-normal);
}

.product-count {
  font-size: 14px;
  color: var(--text-regular);
}

.empty-category,
.empty-products {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.product-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 16px;
  transition: all var(--transition-normal);
}

.product-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-3px);
}

.product-image {
  width: 100%;
  height: 180px;
  margin-bottom: 12px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-normal);
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-placeholder);
  font-size: 14px;
  gap: 8px;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  font-size: 24px;
  font-weight: 600;
  color: #f56c6c;
  margin-bottom: 12px;
}

.product-info {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}

.info-row .label {
  color: var(--text-secondary);
  margin-right: 8px;
}

.info-row .value {
  color: var(--text-regular);
}

.product-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.product-actions .el-button {
  flex: 1;
  min-width: 60px;
}

.current-stock {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.after-stock {
  font-size: 20px;
  font-weight: 600;
  color: #67c23a;
}

/* 图片上传区域 */
.image-upload-area {
  width: 100%;
}

.image-preview {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-preview img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.image-actions {
  display: flex;
  gap: 8px;
}

.upload-placeholder {
  width: 100%;
  height: 200px;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--text-secondary);
}

.upload-placeholder:hover {
  border-color: #409eff;
  color: #409eff;
}
</style>
