<script setup>
import { ref, onMounted, watch } from 'vue'
import request from '@/utils/request.js'
import {
  Document,
  Reading,
  Pointer,
  View,
  ChatDotRound
} from '@element-plus/icons-vue'

const props = defineProps({
  userId: {
    type: [Number, String],
    required: true
  }
})

const loading = ref(true)
const stats = ref({
  post_count: 0,
  favorite_book_count: 0,
  received_upvote_count: 0,
  viewed_post_count: 0,
  comment_count: 0
})

const fetchUserStats = async () => {
  if (!props.userId) return

  loading.value = true
  try {
    const res = await request.get(`/user/${props.userId}/stats`)
    if (res.code === 200 && res.data) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('获取用户统计数据失败', error)
  } finally {
    loading.value = false
  }
}

// 监听 userId 变化，当在主页之间跳转时重新拉取数据
watch(() => props.userId, () => {
  fetchUserStats()
})

onMounted(() => {
  fetchUserStats()
})
</script>

<template>
  <el-card shadow="never" class="user-stats-card" v-loading="loading">
    <template #header>
      <div class="card-header">
        <span class="title">数据与成就</span>
      </div>
    </template>

    <div class="stats-grid">
      <div class="stat-item highlight">
        <div class="stat-icon-wrapper upvote">
          <el-icon><Pointer /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.received_upvote_count }}</div>
          <div class="stat-label">获得点赞</div>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon-wrapper post">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.post_count }}</div>
          <div class="stat-label">发布帖子</div>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon-wrapper book">
          <el-icon><Reading /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.favorite_book_count }}</div>
          <div class="stat-label">藏书与阅读</div>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon-wrapper comment">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.comment_count }}</div>
          <div class="stat-label">参与评论</div>
        </div>
      </div>

      <div class="stat-item full-width">
        <div class="stat-icon-wrapper view">
          <el-icon><View /></el-icon>
        </div>
        <div class="stat-info horizontal">
          <div class="stat-label">生涯总计浏览帖子</div>
          <div class="stat-value">{{ stats.viewed_post_count }}</div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.user-stats-card {
  border-radius: 8px;
  border: 1px solid var(--book-border-color);
  background-color: var(--book-topbar-bg);
}

.card-header .title {
  font-weight: bold;
  font-size: 16px;
  color: var(--book-text-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: var(--book-bg-color);
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 最后一个元素横跨两列 */
.full-width {
  grid-column: span 2;
  justify-content: center;
}

.stat-icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  flex-shrink: 0;
}

/* 不同数据配置不同颜色的图标背景，提升视觉层次 */
.upvote { background-color: rgba(245, 108, 108, 0.1); color: #f56c6c; }
.post { background-color: rgba(64, 158, 255, 0.1); color: #409eff; }
.book { background-color: rgba(103, 194, 58, 0.1); color: #67c23a; }
.comment { background-color: rgba(230, 162, 60, 0.1); color: #e6a23c; }
.view { background-color: rgba(144, 147, 153, 0.1); color: #909399; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-info.horizontal {
  flex-direction: row;
  align-items: baseline;
  gap: 12px;
}

.stat-value {
  font-size: 22px;
  font-weight: bold;
  color: var(--book-text-color);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--book-hover-color);
  margin-top: 4px;
}

.horizontal .stat-label {
  margin-top: 0;
}
</style>