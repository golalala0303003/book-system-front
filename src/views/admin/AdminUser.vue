<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// 1. 状态定义
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

// 查询参数 (严格对应后端更新后的 UserAdminQueryDTO)
const queryParams = reactive({
  page: 1,
  size: 10,
  keyword: '',
  is_active: null,
  sort_by: 'create_time', // 默认按创建时间排序
  sort_order: 'desc'      // 默认降序
})

// 2. 获取表格数据
const fetchUserPage = async () => {
  loading.value = true
  try {
    const res = await request.post('/admin/user/page', queryParams)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取用户列表失败', error)
  } finally {
    loading.value = false
  }
}

// 3. 搜索操作 (点击查询或按回车时触发)
const handleSearch = () => {
  queryParams.page = 1 // 搜索时重置回第一页
  fetchUserPage()
}

// 4. 分页切换
const handlePageChange = (newPage) => {
  queryParams.page = newPage
  fetchUserPage()
}

// 5. 【新增】处理表格排序变化
const handleSortChange = ({ prop, order }) => {
  // 如果用户取消排序 (order 为 null)，恢复默认排序
  if (!order) {
    queryParams.sort_by = 'create_time'
    queryParams.sort_order = 'desc'
  } else {
    // 映射 Element Plus 的排序字符串到后端的 asc/desc
    queryParams.sort_by = prop
    queryParams.sort_order = order === 'ascending' ? 'asc' : 'desc'
  }

  // 排序条件改变时，通常需要回到第一页
  queryParams.page = 1
  fetchUserPage()
}

// 6. 封禁/解封操作
const handleStatusChange = (row) => {
  const isBanning = row.is_active
  const actionText = isBanning ? '封禁' : '解封'
  const targetStatus = !isBanning

  ElMessageBox.confirm(
      `确定要 ${actionText} 用户【${row.username}】吗？`,
      '系统提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: isBanning ? 'warning' : 'info',
      }
  ).then(async () => {
    try {
      const res = await request.post(`/admin/user/${row.id}/status`, {
        is_active: targetStatus
      })
      if (res.code === 200) {
        ElMessage.success(res.message || `${actionText}成功`)
        fetchUserPage()
      }
    } catch (error) {
      console.error(`${actionText}失败`, error)
    }
  }).catch(() => {})
}

// 7. 日期格式化辅助函数
const formatDate = (dateStr) => {
  if (!dateStr) return '无'
  const date = new Date(dateStr)
  return date.toLocaleString()
}

onMounted(() => {
  fetchUserPage()
})
</script>

<template>
  <div class="users-container">
    <el-card shadow="never" class="admin-card">

      <div class="search-bar">
        <el-input
            v-model="queryParams.keyword"
            placeholder="请输入用户名搜索..."
            clearable
            @keyup.enter="handleSearch"
            class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
            v-model="queryParams.is_active"
            placeholder="用户状态"
            clearable
            class="status-select"
        >
          <el-option label="全部状态" :value="null" />
          <el-option label="正常" :value="true" />
          <el-option label="已封禁" :value="false" />
        </el-select>

        <el-button type="primary" @click="handleSearch">查 询</el-button>
      </div>

      <el-table
          :data="tableData"
          v-loading="loading"
          style="width: 100%"
          class="custom-table"
          @sort-change="handleSortChange"
      >
        <el-table-column type="expand">
          <template #default="props">
            <div class="expand-detail">
              <el-descriptions title="用户详细信息" :column="2" border>
                <el-descriptions-item label="用户ID">{{ props.row.id }}</el-descriptions-item>
                <el-descriptions-item label="用户名">{{ props.row.username }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{ props.row.email || '未绑定' }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ props.row.phone || '未绑定' }}</el-descriptions-item>
                <el-descriptions-item label="注册时间">{{ formatDate(props.row.create_time) }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="id" label="ID" width="100" sortable="custom" />
        <el-table-column prop="username" label="用户名" min-width="120" sortable="custom" />

        <el-table-column prop="role" label="权限" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'primary' : 'info'">
              {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="create_time" label="创建时间" min-width="180" sortable="custom">
          <template #default="scope">
            {{ formatDate(scope.row.create_time) }}
          </template>
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
                v-if="scope.row.role !== 'admin'"
                :type="scope.row.is_active ? 'danger' : 'success'"
                link
                @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.is_active ? '封禁' : '解封' }}
            </el-button>
            <span v-else class="admin-tip">-</span>
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
  </div>
</template>

<style scoped>
.users-container {
  min-height: 100%;
}

:deep(.admin-card) {
  background-color: var(--book-topbar-bg);
  border-color: var(--book-border-color);
  border-radius: 8px;
}

.search-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
}

.status-select {
  width: 150px;
}

:deep(.custom-table) {
  --el-table-bg-color: var(--book-topbar-bg);
  --el-table-tr-bg-color: var(--book-topbar-bg);
  --el-table-header-bg-color: var(--book-bg-color);
  --el-table-text-color: var(--book-text-color);
  --el-table-header-text-color: var(--book-text-color);
  --el-table-border-color: var(--book-border-color);
  --el-table-row-hover-bg-color: var(--book-bg-color);
}

.expand-detail {
  padding: 20px 40px;
  background-color: var(--book-bg-color);
}

:deep(.el-descriptions__title) {
  color: var(--book-text-color);
}
:deep(.el-descriptions__label) {
  background-color: var(--book-topbar-bg) !important;
  color: var(--book-text-color) !important;
  border-color: var(--book-border-color) !important;
}
:deep(.el-descriptions__content) {
  background-color: var(--book-bg-color) !important;
  color: var(--book-text-color) !important;
  border-color: var(--book-border-color) !important;
}

.admin-tip {
  color: var(--book-hover-color);
  font-size: 12px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-active)) {
  background-color: var(--book-bg-color);
  color: var(--book-text-color);
}
:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next) {
  background-color: var(--book-bg-color);
  color: var(--book-text-color);
}
:deep(.el-pagination__total),
:deep(.el-pagination__jump) {
  color: var(--book-text-color);
}
</style>