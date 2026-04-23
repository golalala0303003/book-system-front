<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// --- 1. 状态定义 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

// 查询参数 (严格对应 BoardAdminQueryDTO)
const queryParams = reactive({
  page: 1,
  size: 10,
  keyword: '',
  is_active: null,
  sort_by: 'create_time',
  sort_order: 'desc'
})

// --- 2. 弹窗与表单状态 (仅创建) ---
const dialogVisible = ref(false)
const formRef = ref(null)
const uploadLoading = ref(false)

const defaultForm = {
  name: '',
  description: '',
  cover_url: ''
}
const boardForm = reactive({ ...defaultForm })

const rules = {
  name: [
    { required: true, message: '请输入板块名称', trigger: 'blur' },
    { max: 50, message: '板块名称不能超过50个字符', trigger: 'blur' }
  ],
  description: [
    { max: 255, message: '简介不能超过255个字符', trigger: 'blur' }
  ]
}

// --- 3. 获取表格数据 ---
const fetchBoardPage = async () => {
  loading.value = true
  try {
    const res = await request.post('/admin/forum/board/page', queryParams)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取板块列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  fetchBoardPage()
}

const handlePageChange = (newPage) => {
  queryParams.page = newPage
  fetchBoardPage()
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
  fetchBoardPage()
}

// --- 4. 操作：封禁/解封 ---
const handleStatusChange = (row) => {
  const isNormal = row.is_active
  const actionText = isNormal ? '封禁(下架)' : '解封(恢复)'
  const targetStatus = !isNormal

  ElMessageBox.confirm(
      `确定要 ${actionText} 板块【${row.name}】吗？`,
      '系统提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: isNormal ? 'warning' : 'info'
      }
  ).then(async () => {
    try {
      const res = await request.post(`/admin/board/${row.id}/status`, {
        is_active: targetStatus
      })
      if (res.code === 200) {
        ElMessage.success(res.message || `${actionText}成功`)
        fetchBoardPage()
      }
    } catch (error) {
      console.error(`${actionText}失败`, error)
    }
  }).catch(() => {})
}

// --- 5. 新增板块 ---
const openCreateDialog = () => {
  Object.assign(boardForm, defaultForm)
  dialogVisible.value = true
  if (formRef.value) formRef.value.clearValidate()
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 调用普通用户的创建接口 (管理员也适用)
        const res = await request.post('/board/create', boardForm)
        if (res.code === 200) {
          ElMessage.success(res.message || '板块创建成功')
          dialogVisible.value = false
          fetchBoardPage()
        }
      } catch (error) {
        console.error('创建失败', error)
      }
    }
  })
}

// --- 6. 图片上传 (封面) ---
const handleUploadCover = async (options) => {
  const formData = new FormData()
  formData.append('file', options.file)
  formData.append('folder', 'boards') // 存入 OSS 的 boards 文件夹

  uploadLoading.value = true
  try {
    const res = await request.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.code === 200 && res.data) {
      boardForm.cover_url = res.data
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
  fetchBoardPage()
})
</script>

<template>
  <div class="boards-container">
    <el-card shadow="never" class="admin-card">

      <div class="toolbar">
        <div class="search-bar">
          <el-input
              v-model="queryParams.keyword"
              placeholder="搜索板块ID / 名称..."
              clearable
              @keyup.enter="handleSearch"
              class="search-input"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="queryParams.is_active" placeholder="板块状态" clearable class="status-select">
            <el-option label="全部状态" :value="null" />
            <el-option label="正常" :value="true" />
            <el-option label="已封禁" :value="false" />
          </el-select>

          <el-button type="primary" @click="handleSearch">查 询</el-button>
        </div>

        <div class="action-bar">
          <el-button type="success" :icon="Plus" @click="openCreateDialog">录入新板块</el-button>
        </div>
      </div>

      <el-table
          :data="tableData"
          v-loading="loading"
          style="width: 100%"
          class="custom-table"
          @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="80" sortable="custom" />

        <el-table-column label="封面" width="100">
          <template #default="scope">
            <el-image
                class="board-cover-mini"
                :src="scope.row.cover_url || 'https://via.placeholder.com/80?text=No+Img'"
                :preview-src-list="[scope.row.cover_url]"
                fit="cover"
                preview-teleported
            />
          </template>
        </el-table-column>

        <el-table-column prop="name" label="板块名称" min-width="150" sortable="custom" />

        <el-table-column prop="description" label="板块简介" min-width="200" show-overflow-tooltip />

        <el-table-column prop="creator_name" label="创建人" min-width="120" sortable="custom">
          <template #default="scope">
            {{ scope.row.creator_name }} (ID: {{ scope.row.creator_id }})
          </template>
        </el-table-column>

        <el-table-column prop="create_time" label="创建时间" width="170" sortable="custom">
          <template #default="scope">{{ formatDate(scope.row.create_time) }}</template>
        </el-table-column>

        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'danger'">
              {{ scope.row.is_active ? '正常' : '已封禁' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
                :type="scope.row.is_active ? 'danger' : 'success'"
                link
                @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.is_active ? '封禁下架' : '解封恢复' }}
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
        title="录入新板块"
        width="550px"
        class="custom-dialog"
        destroy-on-close
    >
      <el-form :model="boardForm" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="板块名称" prop="name">
          <el-input v-model="boardForm.name" placeholder="请输入板块名称 (最长50字)" />
        </el-form-item>

        <el-form-item label="板块封面" prop="cover_url">
          <el-upload
              class="cover-uploader"
              action="#"
              :show-file-list="false"
              :http-request="handleUploadCover"
              accept="image/*"
              v-loading="uploadLoading"
          >
            <img v-if="boardForm.cover_url" :src="boardForm.cover_url" class="uploaded-cover" />
            <el-icon v-else class="uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议上传正方形图片，支持 JPG/PNG</div>
        </el-form-item>

        <el-form-item label="板块简介" prop="description">
          <el-input
              v-model="boardForm.description"
              type="textarea"
              :rows="4"
              placeholder="请简单描述该板块的主题..."
          />
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
.boards-container { min-height: 100%; }

:deep(.admin-card) {
  background-color: var(--book-topbar-bg);
  border-color: var(--book-border-color);
  border-radius: 8px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.search-bar { display: flex; gap: 16px; }
.search-input { width: 250px; }
.status-select { width: 140px; }

:deep(.custom-table) {
  --el-table-bg-color: var(--book-topbar-bg);
  --el-table-tr-bg-color: var(--book-topbar-bg);
  --el-table-header-bg-color: var(--book-bg-color);
  --el-table-text-color: var(--book-text-color);
  --el-table-header-text-color: var(--book-text-color);
  --el-table-border-color: var(--book-border-color);
  --el-table-row-hover-bg-color: var(--book-bg-color);
}

.board-cover-mini {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  border: 1px solid var(--book-border-color);
}

/* 上传组件样式 (正方形比例) */
.cover-uploader {
  border: 1px dashed var(--book-border-color);
  border-radius: 8px;
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
  height: 120px;
  text-align: center;
  line-height: 120px;
}
.uploaded-cover {
  width: 120px;
  height: 120px;
  display: block;
  object-fit: cover;
}
.upload-tip {
  font-size: 12px;
  color: var(--book-hover-color);
  margin-top: 8px;
  line-height: 1.4;
}

:deep(.custom-dialog .el-dialog__body) {
  padding-top: 10px;
}
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: center; }
:deep(.el-pagination.is-background .el-pager li:not(.is-active)) { background-color: var(--book-bg-color); color: var(--book-text-color); }
:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next) { background-color: var(--book-bg-color); color: var(--book-text-color); }
:deep(.el-pagination__total), :deep(.el-pagination__jump) { color: var(--book-text-color); }
</style>