<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Plus, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// --- 1. 状态定义 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const expandData = ref({}) // 缓存展开的详细信息，键为 book_id

const queryParams = reactive({
  page: 1,
  size: 10,
  keyword: '',
  is_active: null,
  sort_by: 'create_time',
  sort_order: 'desc'
})

// --- 2. 弹窗与表单状态 ---
const dialogVisible = ref(false)
const dialogType = ref('create') // 'create' 或 'update'
const formRef = ref(null)
const uploadLoading = ref(false)

// 初始表单数据
const defaultForm = {
  book_id: null,
  douban_id: '',
  title: '',
  isbn: '',
  author: '',
  publisher: '',
  publish_year: '',
  cover_url: '',
  summary: '',
  tags: '',
  douban_rating: 0
}
const bookForm = reactive({ ...defaultForm })

const rules = {
  title: [{ required: true, message: '请输入图书标题', trigger: 'blur' }],
  douban_id: [{ required: true, message: '请输入豆瓣ID', trigger: 'blur' }]
}

// --- 3. 获取表格数据 ---
const fetchBookPage = async () => {
  loading.value = true
  try {
    const res = await request.post('/admin/book/page', queryParams)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取图书列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  fetchBookPage()
}

const handlePageChange = (newPage) => {
  queryParams.page = newPage
  fetchBookPage()
}

const handleSortChange = ({ prop, order }) => {
  if (!order) {
    queryParams.sort_by = 'create_time'
    queryParams.sort_order = 'desc'
  } else {
    queryParams.sort_by = prop
    queryParams.sort_order = order === 'ascending' ? 'asc' : 'desc'
  }
  queryParams.page = 1
  fetchBookPage()
}

// --- 4. 展开行：动态加载详细信息 ---
const handleExpandChange = async (row, expandedRows) => {
  const isExpanded = expandedRows.some(r => r.id === row.id)
  // 如果展开了，且缓存中没有该数据，则发起请求
  if (isExpanded && !expandData.value[row.id]) {
    try {
      const res = await request.get(`/admin/detail/${row.id}`)
      if (res.code === 200) {
        expandData.value[row.id] = res.data
      }
    } catch (error) {
      console.error('获取图书详情失败', error)
      ElMessage.error('获取详情失败')
    }
  }
}

// --- 5. 操作：上下架 ---
const handleStatusChange = (row) => {
  const isOnline = row.is_active
  const actionText = isOnline ? '下架' : '上架'
  const targetStatus = !isOnline

  ElMessageBox.confirm(
      `确定要 ${actionText} 图书【${row.title}】吗？`,
      '系统提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      const res = await request.post(`/admin/book/${row.id}/status`, {
        is_active: targetStatus
      })
      if (res.code === 200) {
        ElMessage.success(res.message || `${actionText}成功`)
        fetchBookPage()
      }
    } catch (error) {
      console.error(`${actionText}失败`, error)
    }
  }).catch(() => {})
}

// --- 6. 新增与编辑 ---
const openCreateDialog = () => {
  dialogType.value = 'create'
  Object.assign(bookForm, defaultForm) // 重置表单
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const openEditDialog = (row) => {
  dialogType.value = 'update'
  // 如果展开缓存里有详情，优先用详情数据；否则用列表简略数据先顶着
  const detail = expandData.value[row.id] || row

  Object.assign(bookForm, {
    book_id: row.id,
    douban_id: detail.douban_id || '',
    title: detail.title || '',
    isbn: detail.isbn || '',
    author: detail.author || '',
    publisher: detail.publisher || '',
    publish_year: detail.publish_year || '',
    cover_url: detail.cover_url || '',
    summary: detail.summary || '',
    tags: detail.tags || '',
    douban_rating: detail.douban_rating || 0
  })

  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const url = dialogType.value === 'create' ? '/admin/book/create' : '/admin/book/update'
        // 编辑时不需要传 id 以外的空参数（后端做了 Optional 处理）
        const res = await request.post(url, bookForm)
        if (res.code === 200) {
          ElMessage.success(res.message || (dialogType.value === 'create' ? '创建成功' : '修改成功'))
          dialogVisible.value = false

          // 如果是更新，清除该书的缓存让下次展开重新获取
          if (dialogType.value === 'update') {
            delete expandData.value[bookForm.book_id]
          }

          fetchBookPage()
        }
      } catch (error) {
        console.error('提交失败', error)
      }
    }
  })
}

// --- 7. 图片上传自定义请求 ---
const handleUploadCover = async (options) => {
  const formData = new FormData()
  formData.append('file', options.file)
  formData.append('folder', 'adminbooks') // 严格遵守后端要求

  uploadLoading.value = true
  try {
    const res = await request.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.code === 200 && res.data) {
      bookForm.cover_url = res.data
      options.onSuccess(res)
      ElMessage.success('封面上传成功')
    } else {
      throw new Error(res.message || '上传失败')
    }
  } catch (error) {
    options.onError(error)
    ElMessage.error('上传失败，请重试')
  } finally {
    uploadLoading.value = false
  }
}

// 日期格式化
const formatDate = (dateStr) => {
  if (!dateStr) return '无'
  return new Date(dateStr).toLocaleString()
}

onMounted(() => {
  fetchBookPage()
})
</script>

<template>
  <div class="books-container">
    <el-card shadow="never" class="admin-card">

      <div class="toolbar">
        <div class="search-bar">
          <el-input
              v-model="queryParams.keyword"
              placeholder="搜索书名 / 作者 / ISBN..."
              clearable
              @keyup.enter="handleSearch"
              class="search-input"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="queryParams.is_active" placeholder="上下架状态" clearable class="status-select">
            <el-option label="全部状态" :value="null" />
            <el-option label="已上架" :value="true" />
            <el-option label="已下架" :value="false" />
          </el-select>

          <el-button type="primary" @click="handleSearch">查 询</el-button>
        </div>

        <div class="action-bar">
          <el-button type="success" :icon="Plus" @click="openCreateDialog">录入新图书</el-button>
        </div>
      </div>

      <el-table
          :data="tableData"
          v-loading="loading"
          style="width: 100%"
          class="custom-table"
          @sort-change="handleSortChange"
          @expand-change="handleExpandChange"
      >
        <el-table-column type="expand">
          <template #default="props">
            <div class="expand-detail">
              <div v-if="expandData[props.row.id]" class="detail-content">
                <div class="cover-wrapper">
                  <el-image
                      class="book-cover"
                      :src="expandData[props.row.id].cover_url || 'https://via.placeholder.com/150x200?text=No+Cover'"
                      :preview-src-list="[expandData[props.row.id].cover_url]"
                      fit="cover"
                      preview-teleported
                  />
                </div>
                <div class="info-wrapper">
                  <el-descriptions :title="expandData[props.row.id].title" :column="2" border>
                    <el-descriptions-item label="出版社">{{ expandData[props.row.id].publisher || '未知' }}</el-descriptions-item>
                    <el-descriptions-item label="出版年份">{{ expandData[props.row.id].publish_year || '未知' }}</el-descriptions-item>
                    <el-descriptions-item label="ISBN">{{ expandData[props.row.id].isbn || '无' }}</el-descriptions-item>
                    <el-descriptions-item label="豆瓣评分">{{ expandData[props.row.id].douban_rating || '暂无' }}</el-descriptions-item>
                    <el-descriptions-item label="标签" :span="2">{{ expandData[props.row.id].tags || '无标签' }}</el-descriptions-item>
                    <el-descriptions-item label="内容简介" :span="2">
                      <div class="summary-text">{{ expandData[props.row.id].summary || '暂无简介' }}</div>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </div>
              <div v-else class="loading-detail">
                <el-skeleton :rows="4" animated />
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="id" label="ID" width="80" sortable="custom" />
        <el-table-column prop="douban_id" label="豆瓣ID" width="120" sortable="custom" />
        <el-table-column prop="title" label="书名" min-width="180" sortable="custom" />
        <el-table-column prop="author" label="作者" min-width="120" />
        <el-table-column prop="view_count" label="浏览量" width="100" sortable="custom" />

        <el-table-column prop="create_time" label="录入时间" min-width="170" sortable="custom">
          <template #default="scope">{{ formatDate(scope.row.create_time) }}</template>
        </el-table-column>

        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'">
              {{ scope.row.is_active ? '已上架' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button
                :type="scope.row.is_active ? 'warning' : 'success'"
                link
                @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.is_active ? '下架' : '上架' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
            background
            layout="total, prev, pager, next, jumper"
            :total="total"
            v-model:current-page="queryParams.page"
            :page-size="queryParams.size"
            @current-change="handlePageChange"
        />
      </div>

    </el-card>

    <el-dialog
        v-model="dialogVisible"
        :title="dialogType === 'create' ? '录入新图书' : '编辑图书'"
        width="700px"
        class="custom-dialog"
        destroy-on-close
    >
      <el-form :model="bookForm" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="图书标题" prop="title">
              <el-input v-model="bookForm.title" placeholder="请输入标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="豆瓣ID" prop="douban_id">
              <el-input v-model="bookForm.douban_id" placeholder="唯一标识" :disabled="dialogType === 'update'" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="作者" prop="author">
              <el-input v-model="bookForm.author" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="ISBN" prop="isbn">
              <el-input v-model="bookForm.isbn" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出版社" prop="publisher">
              <el-input v-model="bookForm.publisher" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出版年份" prop="publish_year">
              <el-input v-model="bookForm.publish_year" placeholder="如: 2026" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="豆瓣评分" prop="douban_rating">
              <el-input-number v-model="bookForm.douban_rating" :precision="1" :step="0.1" :max="10" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签" prop="tags">
              <el-input v-model="bookForm.tags" placeholder="逗号分隔" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="封面图片" prop="cover_url">
          <el-upload
              class="cover-uploader"
              action="#"
              :show-file-list="false"
              :http-request="handleUploadCover"
              accept="image/*"
              v-loading="uploadLoading"
          >
            <img v-if="bookForm.cover_url" :src="bookForm.cover_url" class="uploaded-cover" />
            <el-icon v-else class="uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">支持 JPG/PNG，点击上传</div>
        </el-form-item>

        <el-form-item label="内容简介" prop="summary">
          <el-input v-model="bookForm.summary" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<style scoped>
.books-container { min-height: 100%; }

:deep(.admin-card) {
  background-color: var(--book-topbar-bg);
  border-color: var(--book-border-color);
  border-radius: 8px;
}

/* 顶部工具栏 (左右两端对齐) */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.search-bar { display: flex; gap: 16px; }
.search-input { width: 280px; }
.status-select { width: 140px; }

/* 表格适配 */
:deep(.custom-table) {
  --el-table-bg-color: var(--book-topbar-bg);
  --el-table-tr-bg-color: var(--book-topbar-bg);
  --el-table-header-bg-color: var(--book-bg-color);
  --el-table-text-color: var(--book-text-color);
  --el-table-header-text-color: var(--book-text-color);
  --el-table-border-color: var(--book-border-color);
  --el-table-row-hover-bg-color: var(--book-bg-color);
}

/* 展开区样式 */
.expand-detail {
  padding: 20px 40px;
  background-color: var(--book-bg-color);
}
.detail-content {
  display: flex;
  gap: 30px;
}
.cover-wrapper {
  flex-shrink: 0;
  width: 150px;
  height: 200px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--book-border-color);
}
.book-cover {
  width: 100%;
  height: 100%;
}
.info-wrapper {
  flex: 1;
}
.loading-detail { padding: 20px; }
.summary-text {
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--book-hover-color);
}

/* Description 组件主题适配 */
:deep(.el-descriptions__title) { color: var(--book-text-color); }
:deep(.el-descriptions__label) {
  background-color: var(--book-topbar-bg) !important;
  color: var(--book-text-color) !important;
  border-color: var(--book-border-color) !important;
  width: 100px;
}
:deep(.el-descriptions__content) {
  background-color: var(--book-bg-color) !important;
  color: var(--book-text-color) !important;
  border-color: var(--book-border-color) !important;
}

/* 上传组件样式 */
.cover-uploader {
  border: 1px dashed var(--book-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  background-color: var(--book-bg-color);
}
.cover-uploader:hover { border-color: var(--book-link-color); }
.uploader-icon {
  font-size: 28px;
  color: var(--book-hover-color);
  width: 120px;
  height: 160px;
  text-align: center;
  line-height: 160px;
}
.uploaded-cover {
  width: 120px;
  height: 160px;
  display: block;
  object-fit: cover;
}
.upload-tip {
  font-size: 12px;
  color: var(--book-hover-color);
  margin-top: 8px;
}

/* 弹窗及分页主题适配 */
:deep(.custom-dialog .el-dialog__body) {
  padding-top: 10px;
}
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: center; }
:deep(.el-pagination.is-background .el-pager li:not(.is-active)) { background-color: var(--book-bg-color); color: var(--book-text-color); }
:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next) { background-color: var(--book-bg-color); color: var(--book-text-color); }
:deep(.el-pagination__total), :deep(.el-pagination__jump) { color: var(--book-text-color); }
</style>