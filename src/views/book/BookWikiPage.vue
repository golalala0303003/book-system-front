<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request.js'
import MiniBook from '@/components/book/MiniBook.vue'
import MiniBookList from '@/components/book/MiniBookList.vue'

const route = useRoute()
const router = useRouter()

// 页面状态
const loading = ref(true)
const isRecommendMode = ref(false) // 是否处于“猜你喜欢”特殊模式
const bookList = ref([]) // 主列表数据
const total = ref(0) // 数据总条数

// 右侧侧边栏的兜底推荐数据
const sideRecommendBooks = ref([])

// 查询参数 DTO (严格对应后端的 BookQueryDTO)
const queryParams = reactive({
  page: 1,
  size: 24, // 每页 24 本 6*4
  keyword: '',
  tag: '',
  sort_by: 'time' // 默认按最新排序
})

// --- 核心数据获取逻辑 ---

// 1. 获取分页检索数据
const fetchPageData = async () => {
  try {
    const res = await request.post('/book/page', queryParams)
    if (res.code === 200 && res.data) {
      bookList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error("获取分页数据失败", error)
  }
}

// 2. 获取“猜你喜欢”数据 (20本)
const fetchRecommendData = async () => {
  try {
    const res = await request.get('/book/recommend', { params: { limit: 20 } })
    if (res.code === 200) {
      bookList.value = res.data || []
      total.value = res.data.length // 推荐模式下没有真实的分页，总数即当前数组长度
    }
  } catch (error) {
    console.error("获取推荐数据失败", error)
  }
}

// 3. 获取侧边栏的占位推荐数据 (只在初始化时请求一次，请求 4 本即可)
const fetchSideRecommend = async () => {
  try {
    const res = await request.get('/book/recommend', { params: { limit: 4 } })
    if (res.code === 200) {
      sideRecommendBooks.value = res.data || []
    }
  } catch (error) {
    console.error("获取侧边栏推荐失败", error)
  }
}

// --- 路由同步与状态派发 ---

// 统一的路由变化处理函数
const handleRouteChange = async () => {
  loading.value = true
  const q = route.query

  // 判断是否是特殊的“推荐模式”
  isRecommendMode.value = q.type === 'recommend'

  if (isRecommendMode.value) {
    // 拦截分页，走推荐逻辑
    await fetchRecommendData()
  } else {
    // 同步 URL 参数到 DTO
    queryParams.keyword = q.keyword || ''
    queryParams.tag = q.tag || ''
    queryParams.sort_by = q.sort_by || 'time'
    queryParams.page = Number(q.page) || 1

    await fetchPageData()
  }

  // 数据请求完毕后，平滑滚动回页面顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
  loading.value = false
}

// 监听 URL Query 变化，自动触发刷新
watch(() => route.query, () => {
  // 确保只有在当前页面才触发
  if (route.name === 'wikiPage') {
    handleRouteChange()
  }
}, { deep: true })

onMounted(() => {
  fetchSideRecommend()
  handleRouteChange()
})

// --- 交互操作响应 ---

// 切换排序方式时，改变 URL (同时将页码重置为 1)
const handleSortChange = (newSort) => {
  router.push({
    query: { ...route.query, sort_by: newSort, page: 1 }
  })
}

// 切换页码时，只改变 URL 的 page 参数
const handlePageChange = (newPage) => {
  router.push({
    query: { ...route.query, page: newPage }
  })
}

// 计算页面大标题
const pageTitle = computed(() => {
  if (isRecommendMode.value) return '你可能会喜欢'
  if (queryParams.keyword) return `关于 "${queryParams.keyword}" 的搜索结果`
  if (queryParams.tag) return `标签：${queryParams.tag}`
  return '全部图书'
})
</script>

<template>
  <div class="wiki-page-container">
    <div class="page-layout">

      <div class="main-content" v-loading="loading">

        <div class="content-header">
          <div class="header-left">
            <h2 class="page-title">{{ pageTitle }}</h2>
            <span class="result-count" v-if="!isRecommendMode">共找到 {{ total }} 本书</span>
          </div>

          <div class="header-right" v-if="!isRecommendMode">
            <el-radio-group v-model="queryParams.sort_by" @change="handleSortChange" size="small">
              <el-radio-button label="time">最新上架</el-radio-button>
              <el-radio-button label="hot">最受关注</el-radio-button>
              <el-radio-button label="rating">最高评分</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <el-empty
            v-if="bookList.length === 0 && !loading"
            description="没有找到相关的图书..."
            :image-size="120"
        />

        <div class="books-grid" v-else>
          <MiniBook
              v-for="book in bookList"
              :key="book.id"
              :book="book"
          />
        </div>

        <div class="pagination-wrapper" v-if="!isRecommendMode && total > 0">
          <el-pagination
              background
              layout="prev, pager, next, jumper"
              :total="total"
              :page-size="queryParams.size"
              :current-page="queryParams.page"
              @current-change="handlePageChange"
          />
        </div>

      </div>

      <div class="side-bar">
        <div class="sticky-wrapper">
          <MiniBookList
              title="猜你喜欢"
              :books="sideRecommendBooks"
              :columns="2"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.wiki-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

.page-layout {
  display: flex;
  align-items: flex-start;
  gap: 30px;
}

/* --- 左侧检索区 --- */
.main-content {
  flex: 1;
  min-width: 0;
  min-height: 500px; /* 防止 loading 时坍塌 */
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--book-border-color);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 15px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: bold;
  color: var(--book-text-color);
}

.result-count {
  font-size: 14px;
  color: var(--book-hover-color);
}


/* 核心：6 列网格布局 */
.books-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 24px 16px; /* 垂直间距 24px，水平间距 16px */
  margin-bottom: 40px;
}

/* 分页器居中 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px dashed var(--book-border-color);
}



/* --- 右侧边栏 --- */
.side-bar {
  width: 280px; /* 为了给左边 6 列留够空间，右侧栏稍微缩窄一点点 */
  flex-shrink: 0;
}

.sticky-wrapper {
  position: sticky;
  top: 90px;
}
</style>