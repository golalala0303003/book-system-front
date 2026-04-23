<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, View, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// --- 1. 状态定义 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

// 抽屉状态
const drawerVisible = ref(false)
const drawerLoading = ref(false)
const currentDetail = ref(null)

// 查询参数 (严格对应更新后的 PostAdminQueryDTO)
const queryParams = reactive({
  page: 1,
  size: 10,
  keyword: '',
  is_deleted: null, // 用户删除状态
  is_banned: null,  // 管理员封禁状态
  sort_by: 'create_time',
  sort_order: 'desc'
})

// --- 2. 获取表格数据 ---
const fetchPostPage = async () => {
  loading.value = true
  try {
    const res = await request.post('/admin/post/page', queryParams)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取帖子列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  fetchPostPage()
}

const handlePageChange = (newPage) => {
  queryParams.page = newPage
  fetchPostPage()
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
  fetchPostPage()
}

// --- 3. 抽屉操作：获取并预览富文本 ---
const openDrawer = async (row) => {
  drawerVisible.value = true
  drawerLoading.value = true
  currentDetail.value = null // 清空旧数据

  try {
    const res = await request.get(`/admin/post/${row.id}`)
    if (res.code === 200 && res.data) {
      currentDetail.value = res.data
    }
  } catch (error) {
    console.error('获取帖子详情失败', error)
    ElMessage.error('获取正文失败')
  } finally {
    drawerLoading.value = false
  }
}

// --- 4. 操作：区分封禁和删除操作 ---
const handleStatusChange = (row, type) => {
  let payload = {}
  let actionText = ''
  let msgType = 'warning'

  if (type === 'ban') {
    const targetStatus = !row.is_banned
    actionText = targetStatus ? '封禁(全站隐藏)' : '解封(恢复展示)'
    payload.is_banned = targetStatus
    msgType = targetStatus ? 'error' : 'info'
  } else if (type === 'delete') {
    const targetStatus = !row.is_deleted
    actionText = targetStatus ? '标记为用户删除' : '协助用户恢复帖子'
    payload.is_deleted = targetStatus
    msgType = 'warning'
  }

  ElMessageBox.confirm(
      `确定要对帖子【${row.title}】执行 ${actionText} 操作吗？`,
      '系统提示',
      {
        confirmButtonText: '确定执行',
        cancelButtonText: '取消',
        type: msgType
      }
  ).then(async () => {
    try {
      const res = await request.post(`/admin/post/${row.id}/status`, payload)
      if (res.code === 200) {
        ElMessage.success(res.message || `${actionText}操作成功`)
        fetchPostPage() // 刷新列表
      }
    } catch (error) {
      console.error(`${actionText}失败`, error)
    }
  }).catch(() => {})
}

// 日期格式化
const formatDate = (dateStr) => {
  if (!dateStr) return '无'
  return new Date(dateStr).toLocaleString()
}

onMounted(() => {
  fetchPostPage()
})
</script>

<template>
  <div class="posts-container">
    <el-card shadow="never" class="admin-card">

      <div class="toolbar">
        <div class="search-bar">
          <el-input
              v-model="queryParams.keyword"
              placeholder="搜索帖子标题 / ID..."
              clearable
              @keyup.enter="handleSearch"
              class="search-input"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="queryParams.is_deleted" placeholder="用户删除状态" clearable class="status-select">
            <el-option label="不限" :value="null" />
            <el-option label="用户正常" :value="false" />
            <el-option label="用户已删" :value="true" />
          </el-select>

          <el-select v-model="queryParams.is_banned" placeholder="系统封禁状态" clearable class="status-select">
            <el-option label="不限" :value="null" />
            <el-option label="系统正常" :value="false" />
            <el-option label="已被封禁" :value="true" />
          </el-select>

          <el-button type="primary" @click="handleSearch">查 询</el-button>
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

        <el-table-column label="标题" min-width="220" show-overflow-tooltip sortable="custom" prop="title">
          <template #default="scope">
            <div class="post-title-wrapper">
              <div v-if="scope.row.cover_image" class="cover-trigger" title="点击预览封面">
                <el-image
                    :src="scope.row.cover_image"
                    :preview-src-list="[scope.row.cover_image]"
                    preview-teleported
                    class="hidden-image"
                    hide-on-click-modal
                />
                <el-icon class="has-cover-icon"><View /></el-icon>
              </div>
              <span class="text-ellipsis">{{ scope.row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="所属板块" min-width="120">
          <template #default="scope">
            <el-tag size="small" type="info">{{ scope.row.board_name }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="发帖人" min-width="120">
          <template #default="scope">
            {{ scope.row.username }}
          </template>
        </el-table-column>

        <el-table-column label="数据表现" width="160">
          <template #default="scope">
            <div class="stats-text">阅读: {{ scope.row.view_count }} | 赞: {{ scope.row.upvote_count }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="create_time" label="发布时间" width="170" sortable="custom">
          <template #default="scope">{{ formatDate(scope.row.create_time) }}</template>
        </el-table-column>

        <el-table-column label="帖子状态" width="120">
          <template #default="scope">
            <div class="status-tags">
              <el-tag :type="scope.row.is_deleted ? 'info' : 'success'" size="small">
                用户: {{ scope.row.is_deleted ? '已删' : '正常' }}
              </el-tag>
              <el-tag :type="scope.row.is_banned ? 'danger' : 'success'" size="small">
                系统: {{ scope.row.is_banned ? '封禁' : '正常' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button type="primary" link :icon="Document" @click="openDrawer(scope.row)">
              审查
            </el-button>

            <el-button
                :type="scope.row.is_banned ? 'success' : 'danger'"
                link
                @click="handleStatusChange(scope.row, 'ban')"
            >
              {{ scope.row.is_banned ? '解封' : '封禁' }}
            </el-button>

            <el-button
                :type="scope.row.is_deleted ? 'warning' : 'info'"
                link
                @click="handleStatusChange(scope.row, 'delete')"
            >
              {{ scope.row.is_deleted ? '恢复' : '帮删' }}
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

    <el-drawer
        v-model="drawerVisible"
        title="帖子内容审查"
        size="50%"
        class="post-drawer"
        destroy-on-close
    >
      <div v-loading="drawerLoading" class="drawer-content">
        <template v-if="currentDetail">
          <h2 class="drawer-title">{{ currentDetail.title }}</h2>
          <div class="drawer-meta">
            <el-tag size="small">{{ currentDetail.board_name }}</el-tag>
            <span class="meta-item">作者: {{ currentDetail.username }}</span>
            <span class="meta-item">发布于: {{ formatDate(currentDetail.create_time) }}</span>
          </div>

          <el-divider />

          <div v-if="currentDetail.cover_image" class="drawer-cover-wrapper">
            <el-image
                :src="currentDetail.cover_image"
                class="drawer-cover-img"
                :preview-src-list="[currentDetail.cover_image]"
                fit="contain"
            />
          </div>

          <div class="rich-text-wrapper" v-html="currentDetail.content"></div>
        </template>
      </div>
    </el-drawer>

  </div>
</template>

<style scoped>
.posts-container { min-height: 100%; }

:deep(.admin-card) {
  background-color: var(--book-topbar-bg);
  border-color: var(--book-border-color);
  border-radius: 8px;
}

.toolbar {
  display: flex;
  margin-bottom: 20px;
}
.search-bar { display: flex; gap: 16px; }
.search-input { width: 280px; }
.status-select { width: 140px; } /* 固定宽度对齐 */

.post-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cover-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.hidden-image {
  position: absolute;
  inset: 0;
  opacity: 0;
  z-index: 1;
  cursor: zoom-in;
}
.has-cover-icon {
  color: var(--book-link-color);
  font-size: 16px;
  position: absolute;
  inset: 0;
  z-index: 0;
}
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stats-text {
  font-size: 13px;
  color: var(--book-hover-color);
}

.status-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.pagination-wrapper { margin-top: 20px; display: flex; justify-content: center; }
:deep(.el-pagination.is-background .el-pager li:not(.is-active)) { background-color: var(--book-bg-color); color: var(--book-text-color); }
:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next) { background-color: var(--book-bg-color); color: var(--book-text-color); }
:deep(.el-pagination__total), :deep(.el-pagination__jump) { color: var(--book-text-color); }

:deep(.post-drawer) {
  background-color: var(--book-topbar-bg);
  color: var(--book-text-color);
}
:deep(.post-drawer .el-drawer__header) {
  margin-bottom: 0;
  border-bottom: 1px solid var(--book-border-color);
  padding-bottom: 16px;
  color: var(--book-text-color);
}

.drawer-content {
  padding: 10px;
}
.drawer-title {
  margin: 10px 0;
  font-size: 22px;
  color: var(--book-text-color);
}
.drawer-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: var(--book-hover-color);
  margin-bottom: 10px;
}

.drawer-cover-wrapper {
  margin-bottom: 20px;
  text-align: center;
  background-color: var(--book-bg-color);
  border-radius: 8px;
  padding: 10px;
}
.drawer-cover-img {
  max-width: 100%;
  max-height: 350px;
  border-radius: 4px;
}

.rich-text-wrapper {
  line-height: 1.8;
  color: var(--book-text-color);
  font-size: 15px;
  word-wrap: break-word;
}
:deep(.rich-text-wrapper img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}
:deep(.rich-text-wrapper p) {
  margin-bottom: 1em;
}
:deep(.rich-text-wrapper a) {
  color: var(--book-link-color);
}
</style>