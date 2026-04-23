<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import request from '@/utils/request.js'
import MiniPost from '@/components/forum/MiniPost.vue'
import MiniBookList from '@/components/book/MiniBookList.vue'

// ================= 状态数据定义 =================

// 1. 帖子列表数据与分页/查询参数
const postList = ref([])
const postQuery = reactive({
  page: 1,
  size: 10,
  board_id: null, // 全局主页，不指定板块 ID
  sort_by: 'time' // 默认最新排序 ('time' 或 'view'/'upvote')
})
const loadingPosts = ref(false) // 正在加载防抖标记
const hasMorePosts = ref(true)  // 是否还有更多数据可以加载

// 2. 右侧推荐图书数据
const hotBooks = ref([])

// ================= 核心业务逻辑 =================

/**
 * 获取全站帖子列表 (支持重置/追加)
 * @param {boolean} reset - 是否清空现有列表从第一页重新加载
 */
const fetchPostList = async (reset = false) => {
  if (loadingPosts.value || (!hasMorePosts.value && !reset)) return

  loadingPosts.value = true
  if (reset) {
    postQuery.page = 1
    postList.value = []
    hasMorePosts.value = true
  }

  try {
    const res = await request.post('/post/page', postQuery)
    if (res.code === 200) {
      const records = res.data.records || []
      postList.value.push(...records)

      // 判断是否还有下一页数据
      if (records.length < postQuery.size) {
        hasMorePosts.value = false
      } else {
        postQuery.page += 1
      }
    }
  } catch (error) {
    console.error('获取全站帖子列表失败', error)
  } finally {
    loadingPosts.value = false
  }
}

/**
 * 无限滚动触发器 (Element Plus v-infinite-scroll)
 */
const loadMorePosts = () => {
  fetchPostList(false)
}

/**
 * 切换顶部 Tab (最新/热门) 时触发
 */
const handleSortChange = () => {
  fetchPostList(true) // 切换排序时，重置列表并从第一页开始查
}

/**
 * 获取右侧推荐图书
 */
const fetchHotBooks = async () => {
  try {
    // 复用推荐接口，限制获取 4 本适应侧边栏高度
    const res = await request.get('/book/recommend', { params: { limit: 4 } })
    if (res.code === 200) {
      hotBooks.value = res.data || []
    }
  } catch (error) {
    console.error('获取推荐图书失败', error)
  }
}

// ================= 生命周期 =================

const initPageData = () => {
  fetchHotBooks()
  fetchPostList(true)
}

onMounted(() => {
  initPageData()
})

// 用于 infinite-scroll 控制的计算属性
const infiniteScrollDisabled = computed(() => loadingPosts.value || !hasMorePosts.value)
</script>

<template>
  <div class="forum-home-container">

    <div class="main-content">

      <div class="list-control-bar">
        <el-tabs v-model="postQuery.sort_by" @tab-change="handleSortChange">
          <el-tab-pane label="全站最新" name="time"></el-tab-pane>
          <el-tab-pane label="全站热门" name="view"></el-tab-pane>
        </el-tabs>
      </div>

      <div
          class="post-list-wrapper"
          v-infinite-scroll="loadMorePosts"
          :infinite-scroll-disabled="infiniteScrollDisabled"
          :infinite-scroll-distance="50"
      >
        <MiniPost
            v-for="post in postList"
            :key="post.id"
            :post="post"
            class="post-item"
        />

        <div class="loading-state" v-if="loadingPosts">
          <el-icon class="is-loading"><Loading /></el-icon> 正在加载更多帖子...
        </div>
        <div class="no-more-state" v-if="!hasMorePosts && postList.length > 0">
          - 已经到底啦 -
        </div>

        <el-empty
            v-if="!loadingPosts && postList.length === 0"
            description="论坛暂时还没有帖子，快去发布第一篇吧！"
        />
      </div>

    </div>

    <div class="side-widget">
      <div class="widget-box">
        <MiniBookList
            title="热门图书"
            :books="hotBooks"
            :columns="2"
        />
      </div>
    </div>

  </div>
</template>

<style scoped>
/* 容器布局与 ForumBoard 保持一致，维持全局统一感 */
.forum-home-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}

.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 帖子排序 Tab 控制栏 */
.list-control-bar {
  background-color: var(--book-topbar-bg);
  border: 1px solid var(--book-border-color);
  border-radius: 8px;
  padding: 0 20px;
}
.list-control-bar :deep(.el-tabs__nav-wrap::after) {
  display: none;
}
.list-control-bar :deep(.el-tabs__header) {
  margin: 0;
}
.list-control-bar :deep(.el-tabs__item) {
  height: 50px;
  line-height: 50px;
  font-size: 16px;
  color: var(--book-text-color);
}
.list-control-bar :deep(.el-tabs__item.is-active) {
  color: var(--book-link-color);
  font-weight: bold;
}

/* 列表滚动容器 */
.post-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 状态提示字样 */
.loading-state, .no-more-state {
  text-align: center;
  padding: 20px 0;
  font-size: 14px;
  color: var(--book-hover-color);
}

/* 右侧侧边栏 */
.side-widget {
  width: 300px;
  flex-shrink: 0;
  position: sticky;
  top: 90px;
}

.widget-box {
  background-color: var(--book-topbar-bg);
  border: 1px solid var(--book-border-color);
  border-radius: 8px;
  padding: 20px;
}
</style>