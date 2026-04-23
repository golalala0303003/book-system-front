<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, ChatLineRound } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// --- 1. 状态定义 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

// 查询参数 (严格对应更新后的 CommentAdminQueryDTO)
const queryParams = reactive({
  page: 1,
  size: 10,
  keyword: '',
  is_deleted: null, // 用户删除状态
  is_banned: null,  // 管理员封禁状态
  post_id: null,
  user_id: null,
  sort_by: 'create_time',
  sort_order: 'desc'
})

// --- 2. 获取表格数据 ---
const fetchCommentPage = async () => {
  loading.value = true
  try {
    const res = await request.post('/admin/comment/page', queryParams)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取评论列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  fetchCommentPage()
}

const handlePageChange = (newPage) => {
  queryParams.page = newPage
  fetchCommentPage()
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
  fetchCommentPage()
}

// --- 3. 操作：区分封禁和删除操作 ---
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
    actionText = targetStatus ? '标记为用户删除' : '协助用户恢复评论'
    payload.is_deleted = targetStatus
    msgType = 'warning'
  }

  ElMessageBox.confirm(
      `确定要对该评论执行 ${actionText} 操作吗？\n\n评论内容：${row.content.substring(0, 20)}...`,
      '系统提示',
      {
        confirmButtonText: '确定执行',
        cancelButtonText: '取消',
        type: msgType
      }
  ).then(async () => {
    try {
      const res = await request.post(`/admin/comment/${row.id}/status`, payload)
      if (res.code === 200) {
        ElMessage.success(res.message || `${actionText}操作成功`)
        fetchCommentPage() // 刷新列表
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
  fetchCommentPage()
})
</script>

<template>
  <div class="comments-container">
    <el-card shadow="never" class="admin-card">

      <div class="toolbar">
        <div class="search-bar">
          <el-input
              v-model="queryParams.keyword"
              placeholder="搜索评论内容 / ID..."
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

        <el-table-column label="评论内容" min-width="280" show-overflow-tooltip>
          <template #default="scope">
            <div class="comment-content-wrapper">
              <el-icon class="comment-icon"><ChatLineRound /></el-icon>
              <el-tag v-if="scope.row.reply_to_username" size="small" type="info" class="reply-tag">
                回复 @{{ scope.row.reply_to_username }}
              </el-tag>
              <span class="text-content">{{ scope.row.content }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="所属帖子" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            <span class="post-title-link">{{ scope.row.post_title }}</span>
          </template>
        </el-table-column>

        <el-table-column label="评论人" width="120">
          <template #default="scope">
            {{ scope.row.username }}
          </template>
        </el-table-column>

        <el-table-column label="互动" width="120">
          <template #default="scope">
            <div class="stats-text">
              <span class="up">赞: {{ scope.row.upvote_count }}</span> |
              <span class="down">踩: {{ scope.row.downvote_count }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="create_time" label="发布时间" width="170" sortable="custom">
          <template #default="scope">{{ formatDate(scope.row.create_time) }}</template>
        </el-table-column>

        <el-table-column label="评论状态" width="120">
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

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
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
  </div>
</template>

<style scoped>
.comments-container { min-height: 100%; }

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

/* 评论内容专属样式 */
.comment-content-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.comment-icon {
  color: var(--book-hover-color);
  flex-shrink: 0;
}
.reply-tag {
  flex-shrink: 0;
}
.text-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-title-link {
  color: var(--book-text-color);
  font-size: 13px;
  cursor: default;
}

.stats-text {
  font-size: 12px;
}
.stats-text .up { color: #67c23a; }
.stats-text .down { color: #f56c6c; }

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
</style>