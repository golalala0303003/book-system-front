<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user' // 引入 userStore 获取用户名
import {
  User,
  Reading,
  Document,
  ChatDotRound,
  Warning,
  Collection
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const loading = ref(true)

const stats = ref({
  total_users: 0,
  total_books: 0,
  total_posts: 0,
  total_comments: 0,
  pending_reports: 0,
  active_boards: 0
})

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/dashboard')
    if (res.code === 200 && res.data) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('获取大盘数据失败', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="dashboard-container">

    <el-card shadow="never" class="admin-card welcome-card">
      <div class="welcome-content">
        <h2>欢迎回来，{{ userStore.userInfo?.username || '管理员' }}！</h2>
        <p>欢迎来到图书分享系统后台管理，请通过左侧导航栏选择您要管理的功能模块。</p>
      </div>
    </el-card>

    <el-card shadow="never" class="admin-card data-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span class="title">系统大盘统计</span>
        </div>
      </template>

      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon-wrapper user-icon"><el-icon><User /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_users }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon-wrapper book-icon"><el-icon><Reading /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_books }}</div>
            <div class="stat-label">总图书数</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon-wrapper post-icon"><el-icon><Document /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_posts }}</div>
            <div class="stat-label">总帖子数</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon-wrapper comment-icon"><el-icon><ChatDotRound /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_comments }}</div>
            <div class="stat-label">总评论数</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon-wrapper report-icon"><el-icon><Warning /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pending_reports }}</div>
            <div class="stat-label">待处理举报</div>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon-wrapper board-icon"><el-icon><Collection /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.active_boards }}</div>
            <div class="stat-label">已激活板块</div>
          </div>
        </div>
      </div>
    </el-card>

  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px; /* 两个卡片之间的间距 */
}

/* 穿透修改 El-Card，适配主题变量 */
:deep(.admin-card) {
  background-color: var(--book-topbar-bg);
  border-color: var(--book-border-color);
  color: var(--book-text-color);
  border-radius: 8px;
}

:deep(.admin-card .el-card__header) {
  border-bottom-color: var(--book-border-color);
}

/* 欢迎区域样式 */
.welcome-content {
  padding: 10px 0;
}

.welcome-content h2 {
  margin: 0 0 10px 0;
  font-size: 22px;
  color: var(--book-text-color);
}

.welcome-content p {
  margin: 0;
  color: var(--book-hover-color);
  font-size: 14px;
}

/* 数据大盘头部 */
.card-header .title {
  font-weight: bold;
  font-size: 16px;
  color: var(--book-text-color);
}

/* 3 列布局 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 10px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background-color: var(--book-bg-color);
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid var(--book-border-color);
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: var(--book-link-color);
}

.stat-icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 24px;
  flex-shrink: 0;
}

.user-icon { background-color: rgba(64, 158, 255, 0.1); color: #409eff; }
.book-icon { background-color: rgba(103, 194, 58, 0.1); color: #67c23a; }
.post-icon { background-color: rgba(230, 162, 60, 0.1); color: #e6a23c; }
.comment-icon { background-color: rgba(144, 147, 153, 0.1); color: #909399; }
.report-icon { background-color: rgba(245, 108, 108, 0.1); color: #f56c6c; }
.board-icon { background-color: rgba(114, 46, 209, 0.1); color: #722ed1; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 26px;
  font-weight: bold;
  color: var(--book-text-color);
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: var(--book-hover-color);
  margin-top: 6px;
}
</style>