<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { CaretTop, CaretBottom, ChatDotRound, Reading, View } from '@element-plus/icons-vue'
import request from '@/utils/request.js'
import MiniBook from '@/components/book/MiniBook.vue'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

const router = useRouter()

// 纯文本摘要 (限制 100 字)
const plainTextSummary = computed(() => {
  if (!props.post.content) return ''
  const strippedText = props.post.content.replace(/<[^>]+>/g, '')
  return strippedText.length > 100 ? strippedText.substring(0, 100) + '...' : strippedText
})

// 格式化时间
const formattedTime = computed(() => {
  if (!props.post.create_time) return ''
  return props.post.create_time.split('T')[0]
})

// 跳转详情页
const goToPostDetail = () => {
  router.push({ name: 'postDetail', params: { id: props.post.id } })
}

const goToUserProfile = () => {
  if (props.post.user_id) {
    router.push({ name: 'profile', params: { id: props.post.user_id } })
  }
}

// 点赞/踩 前端无刷新响应逻辑
const handleVote = async (type) => {
  try {
    const res = await request.post('/post/vote', {
      post_id: props.post.id,
      vote_type: type
    })

    if (res.code === 200) {
      // 1. 取消操作
      if (props.post.my_vote === type) {
        props.post.my_vote = 0
        if (type === 1) props.post.upvote_count--
        if (type === -1) props.post.downvote_count--
      }
      // 2. 新增或反转操作
      else {
        // 撤销旧状态
        if (props.post.my_vote === 1) props.post.upvote_count--
        if (props.post.my_vote === -1) props.post.downvote_count--

        // 赋予新状态
        props.post.my_vote = type
        if (type === 1) props.post.upvote_count++
        if (type === -1) props.post.downvote_count++
      }
    }
  } catch (error) {
    console.error("投票失败", error)
  }
}
</script>

<template>
  <div class="mini-post-card" @click="goToPostDetail">

    <div class="post-main-area">
      <div class="post-header">
        <div class="user-click-area" @click.stop="goToUserProfile">
          <el-avatar
              :size="28"
              :src="props.post.user?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"
          />
          <span class="username">{{ props.post.user?.username || '未知用户' }}</span>
        </div>
        <span class="dot">·</span>
        <span class="time">{{ formattedTime }}</span>
      </div>

      <div class="post-body">
        <h3 class="title" :title="props.post.title">{{ props.post.title }}</h3>
        <p class="summary">{{ plainTextSummary }}</p>
      </div>

      <div class="post-footer">
        <div class="action-item">
          <el-icon><View /></el-icon>
          <span>{{ props.post.view_count }}</span>
        </div>

        <div
            class="action-item clickable"
            :class="{ 'is-active': props.post.my_vote === 1 }"
            @click.stop="handleVote(1)"
        >
          <el-icon><CaretTop /></el-icon>
          <span>{{ props.post.upvote_count }}</span>
        </div>

        <div
            class="action-item clickable"
            :class="{ 'is-active': props.post.my_vote === -1 }"
            @click.stop="handleVote(-1)"
        >
          <el-icon><CaretBottom /></el-icon>
          <span>{{ props.post.downvote_count }}</span>
        </div>

        <div class="action-item">
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ props.post.comment_count }}</span>
        </div>
      </div>
    </div>

    <div class="post-right-area" v-if="props.post.cover_image || props.post.book">

      <div class="post-cover-area" v-if="props.post.cover_image">
        <el-image
            :src="props.post.cover_image"
            fit="cover"
            class="cover-image"
        >
          <template #error>
            <div class="image-slot">暂无图片</div>
          </template>
        </el-image>
      </div>

      <div class="associated-book" @click.stop v-if="props.post.book">
        <el-popover
            placement="left"
            :width="150"
            trigger="hover"
            :show-after="200"
        >
          <template #reference>
            <el-button type="primary" plain class="book-tag-btn" size="small">
              <el-icon class="book-icon"><Reading /></el-icon> 关联图书
            </el-button>
          </template>

          <div class="popover-book-wrapper">
            <MiniBook :book="props.post.book" />
          </div>
        </el-popover>
      </div>

    </div>

  </div>
</template>

<style scoped>
.mini-post-card {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: var(--book-topbar-bg);
  border-bottom: 1px solid var(--book-border-color);
  cursor: pointer;
  transition: background-color 0.2s;
  /* 由父组件控制宽度，自身适应100% */
  width: 100%;
  box-sizing: border-box;
}

.mini-post-card:hover {
  background-color: var(--el-fill-color-light);
}

/* --- 左侧主内容区 --- */
.post-main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.username {
  font-size: 14px;
  color: var(--book-text-color);
  font-weight: 500;
}
.dot, .time {
  font-size: 13px;
  color: var(--book-hover-color);
}

.post-body {
  margin-bottom: 12px;
  padding-right: 20px;
}
.title {
  font-size: 16px;
  font-weight: bold;
  color: var(--book-text-color);
  margin: 0 0 8px 0;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.summary {
  font-size: 14px;
  color: var(--book-hover-color);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* 底部互动数据排版修复 */
.post-footer {
  display: flex;
  align-items: center;
  gap: 28px; /* 统一拉大四个数据之间的距离 */
}
.action-item {
  display: flex;
  align-items: center;
  gap: 6px; /* 图标和文字之间的微距 */
  font-size: 14px;
  color: var(--book-hover-color);
  transition: color 0.2s;
}
.action-item.clickable:hover {
  color: var(--book-link-color);
}
.action-item.is-active {
  color: var(--book-link-color);
  font-weight: bold;
}

/* --- 右侧附加区 (垂直排列图和按钮) --- */
.post-right-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* 靠右对齐 */
  justify-content: flex-start;
  gap: 12px; /* 图片和按钮的间距 */
  width: 140px; /* 固定右侧专属区域的宽度 */
  flex-shrink: 0;
  margin-left: 20px;
}

/* 封面图 */
.post-cover-area {
  width: 100%; /* 撑满 140px */
  height: 90px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--book-border-color);
}
.cover-image {
  width: 100%;
  height: 100%;
}
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--book-hover-color);
  font-size: 12px;
}

/* 关联图书按钮 */
.associated-book {
  width: 100%;
}
.book-tag-btn {
  width: 100%; /* 按钮宽度和图片一样长，整齐划一 */
  border-radius: 4px;
}
.book-icon {
  margin-right: 4px;
  font-size: 16px;
}

.popover-book-wrapper {
  display: flex;
  justify-content: center;
}

/* 新增：左侧头像和用户名点击区域特效 */
.user-click-area {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.user-click-area:hover .username {
  color: var(--book-link-color);
}
</style>