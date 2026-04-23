<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Edit } from '@element-plus/icons-vue' // 新增：引入编辑图标
import request from '@/utils/request'

const props = defineProps({
  bookId: {
    type: [Number, String],
    required: true
  },
  bookTitle: {
    type: String,
    default: ''
  }
})

const router = useRouter()
const postList = ref([])
const loading = ref(true)

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fetchRelatedPosts = async () => {
  loading.value = true
  try {
    const res = await request.post('/post/page', {
      book_id: Number(props.bookId),
      page: 1,
      size: 5,
      sort_by: 'time'
    })
    if (res.code === 200 && res.data) {
      postList.value = res.data.records || []
    }
  } catch (error) {
    console.error('获取相关帖子失败', error)
  } finally {
    loading.value = false
  }
}

const goToPost = (postId) => {
  router.push({ name: 'postDetail', params: { id: postId } })
}

const goToUser = (userId) => {
  router.push({ name: 'profile', params: { id: userId } })
}

const viewMore = () => {
  router.push({
    name: 'forumPage',
    query: {
      book_id: props.bookId,
      book_title: props.bookTitle
    }
  })
}

// 新增：跳转到发帖页面
const goToPublish = () => {
  router.push({
    name: 'postPublish',
    // 将当前书本的信息带过去，方便发帖页做自动关联
    query: {
      book_id: props.bookId,
      book_title: props.bookTitle
    }
  })
}

onMounted(() => {
  fetchRelatedPosts()
})
</script>

<template>
  <el-card shadow="never" class="related-posts-card" v-loading="loading">
    <template #header>
      <div class="card-header">
        <span class="card-title">相关帖子</span>
        <el-button
            type="primary"
            size="small"
            :icon="Edit"
            @click="goToPublish"
            plain
        >
          发帖
        </el-button>
      </div>
    </template>

    <div v-if="postList.length > 0" class="post-list">
      <div v-for="post in postList" :key="post.id" class="mini-post-item">
        <div class="post-title" @click="goToPost(post.id)" :title="post.title">
          {{ post.title }}
        </div>
        <div class="post-meta">
          <span class="meta-author" @click.stop="goToUser(post.user_id)">
            {{ post.user?.username || '匿名用户' }}
          </span>
          <span class="meta-dot">·</span>
          <span class="meta-time">{{ formatDate(post.create_time) }}</span>
        </div>
      </div>
      <div class="view-more-wrapper">
        <el-button link type="primary" @click="viewMore">
          查看更多帖子 >
        </el-button>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="暂无相关帖子" :image-size="60" />
  </el-card>
</template>

<style scoped>
.related-posts-card {
  border-radius: 8px;
  border: 1px solid var(--book-border-color);
  background-color: var(--book-topbar-bg);
}

/* 新增：卡片头部 Flex 布局 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: bold;
  font-size: 16px;
  color: var(--book-text-color);
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mini-post-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.post-title {
  font-size: 14px;
  color: var(--book-text-color);
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s;
}

.post-title:hover {
  color: var(--book-link-color);
}

.post-meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--book-hover-color);
}

.meta-author {
  cursor: pointer;
  transition: color 0.2s;
}

.meta-author:hover {
  color: var(--book-link-color);
}

.meta-dot {
  margin: 0 6px;
}

.view-more-wrapper {
  margin-top: 10px;
  text-align: center;
  border-top: 1px solid var(--book-border-color);
  padding-top: 12px;
}
</style>