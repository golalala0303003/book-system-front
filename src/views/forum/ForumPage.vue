<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/utils/request.js'
import MiniPost from '@/components/forum/MiniPost.vue'
import { Search, Reading } from '@element-plus/icons-vue' // 引入一个书籍图标

const route = useRoute()

// ================= 状态数据定义 =================
const postList = ref([])
const totalPosts = ref(0)
const loading = ref(false)

// UI 渲染上下文，用来控制顶部提示文字是显示 "关键词" 还是 "书名"
const searchContext = reactive({
  type: 'keyword', // 'keyword' 或 'book'
  displayValue: '' // 对应的展示文字
})

const postQuery = reactive({
  page: 1,
  size: 10,
  keyword: '',
  book_id: null, // 新增 book_id 参数
  sort_by: 'time'
})

// ================= 核心业务逻辑 =================

const fetchSearchResults = async () => {
  // 防御：如果既没有搜索词，又没有指定书，则不请求（可根据业务需求调整）
  if (!postQuery.keyword && !postQuery.book_id) {
    postList.value = []
    totalPosts.value = 0
    return
  }

  loading.value = true
  try {
    const res = await request.post('/post/page', postQuery)
    if (res.code === 200) {
      postList.value = res.data.records || []
      totalPosts.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取帖子分页失败', error)
  } finally {
    loading.value = false
  }
}

const handleCurrentChange = (newPage) => {
  postQuery.page = newPage
  fetchSearchResults()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ================= 生命周期与监听 =================

const initSearch = () => {
  // 同时提取 keyword 和 book_id
  const keyword = route.query.keyword || ''
  const bookId = route.query.book_id ? Number(route.query.book_id) : null
  const bookTitle = route.query.book_title || ''

  // 1. 组装请求参数
  postQuery.keyword = keyword
  postQuery.book_id = bookId
  postQuery.page = 1

  // 2. 组装 UI 上下文（用于展示顶栏文字）
  if (bookId) {
    searchContext.type = 'book'
    searchContext.displayValue = bookTitle || '指定书籍'
  } else {
    searchContext.type = 'keyword'
    searchContext.displayValue = keyword
  }

  fetchSearchResults()
}

onMounted(() => {
  initSearch()
})

// 监听整个 route.query，无论是 keyword 还是 book_id 发生变化，都会重新查询
watch(
    () => route.query,
    () => {
      if (route.name === 'forumPage') {
        initSearch()
      }
    },
    { deep: true }
)
</script>

<template>
  <div class="forum-search-container">
    <div class="search-main-content">

      <div class="search-header">
        <template v-if="searchContext.type === 'keyword'">
          <el-icon class="search-icon"><Search /></el-icon>
          <span class="search-summary">
            共找到和 <span class="highlight-keyword">“{{ searchContext.displayValue }}”</span> 有关的帖子
            <span class="highlight-count">{{ totalPosts }}</span> 篇
          </span>
        </template>

        <template v-else>
          <el-icon class="search-icon"><Reading /></el-icon>
          <span class="search-summary">
            共找到书籍 <span class="highlight-keyword">《{{ searchContext.displayValue }}》</span> 的关联帖子
            <span class="highlight-count">{{ totalPosts }}</span> 篇
          </span>
        </template>
      </div>

      <div class="list-wrapper" v-loading="loading" element-loading-background="transparent">
        <template v-if="postList.length > 0">
          <MiniPost v-for="post in postList" :key="post.id" :post="post" class="search-post-item" />
          <div class="pagination-wrapper">
            <el-pagination
                background
                layout="prev, pager, next"
                :total="totalPosts"
                :page-size="postQuery.size"
                :current-page="postQuery.page"
                @current-change="handleCurrentChange"
                hide-on-single-page
            />
          </div>
        </template>
        <el-empty v-else-if="!loading" description="没有找到相关的帖子" />
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 居中布局，无侧边栏 */
.forum-search-container {
  display: flex;
  justify-content: center;
  padding: 24px 20px;
  background-color: var(--book-bg-color);
  min-height: calc(100vh - 60px);
}

.search-main-content {
  width: 100%;
  max-width: 900px; /* 限制最大宽度，提升阅读体验 */
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部的统计文字栏 */
.search-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--book-topbar-bg);
  border: 1px solid var(--book-border-color);
  border-radius: 8px;
  font-size: 15px;
  color: var(--book-text-color);
}

.search-icon {
  font-size: 18px;
  margin-right: 10px;
  color: var(--book-hover-color);
}

.highlight-keyword {
  color: var(--book-link-color);
  font-weight: bold;
  margin: 0 4px;
}

.highlight-count {
  color: var(--el-color-danger); /* 使用 Element 的红色突出数量 */
  font-weight: bold;
  font-size: 16px;
  margin: 0 4px;
}

/* 列表包装器 */
.list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px; /* 防止 loading 时容器塌陷 */
}

/* 分页器样式 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 10px 0;
}
</style>