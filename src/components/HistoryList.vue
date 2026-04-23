<script setup>
import { ref, reactive, watch } from 'vue'
import request from '@/utils/request'
import MiniPost from '@/components/forum/MiniPost.vue'
import MiniBook from '@/components/book/MiniBook.vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  userId: {
    type: [Number, String],
    required: true
  },
  isSelf: {
    type: Boolean,
    default: false
  }
})

// 默认 Tab 动态分配，不在顶层写死
const activeTab = ref('')

// ================= 状态管理 (三个模块完全隔离) =================
const createListState = () => ({
  list: [],
  page: 1,
  size: 10,
  loading: false,
  hasMore: true
})

const stateMap = reactive({
  history: createListState(),
  // 收藏模块额外需要一个 status 字段
  favorite: { ...createListState(), status: 0 },
  post: createListState()
})

// ================= 数据请求逻辑 =================

// 1. 浏览历史 (GET) - 仅本人可见
const fetchHistory = async () => {
  const state = stateMap.history
  if (state.loading || !state.hasMore) return
  state.loading = true
  try {
    const res = await request.get('/post/history', {
      params: { user_id: props.userId, page: state.page, size: state.size }
    })
    if (res.code === 200 && res.data) {
      const records = res.data.records || []
      state.list.push(...records)
      if (records.length < state.size) state.hasMore = false
      else state.page++
    }
  } catch (error) {
    console.error('获取浏览历史失败', error)
  } finally {
    state.loading = false
  }
}

// 2. 收藏书籍 (GET) - 带有 status 状态筛选
const fetchFavorite = async () => {
  const state = stateMap.favorite
  if (state.loading || !state.hasMore) return
  state.loading = true
  try {
    const res = await request.get('/book/get_favorites', {
      params: {
        user_id: props.userId,
        page: state.page,
        size: state.size,
        status: state.status
      }
    })
    if (res.code === 200 && res.data) {
      const records = res.data.records || []
      state.list.push(...records)
      if (records.length < state.size) state.hasMore = false
      else state.page++
    }
  } catch (error) {
    console.error('获取收藏书籍失败', error)
  } finally {
    state.loading = false
  }
}

// 3. 发帖记录 (POST)
const fetchPost = async () => {
  const state = stateMap.post
  if (state.loading || !state.hasMore) return
  state.loading = true
  try {
    const res = await request.post('/post/page', {
      user_id: Number(props.userId),
      page: state.page,
      size: state.size,
      sort_by: 'time'
    })
    if (res.code === 200 && res.data) {
      const records = res.data.records || []
      state.list.push(...records)
      if (records.length < state.size) state.hasMore = false
      else state.page++
    }
  } catch (error) {
    console.error('获取发帖记录失败', error)
  } finally {
    state.loading = false
  }
}

// ================= 交互控制 =================

// 收藏书籍状态切换事件
const handleFavoriteStatusChange = () => {
  const state = stateMap.favorite
  state.list = []
  state.page = 1
  state.hasMore = true
  fetchFavorite()
}

// 路由加载器：根据当前 Tab 调用对应接口
const loadActiveTabData = () => {
  if (activeTab.value === 'history') fetchHistory()
  else if (activeTab.value === 'favorite') fetchFavorite()
  else if (activeTab.value === 'post') fetchPost()
}

// Tab 切换事件：懒加载控制
const handleTabChange = (tabName) => {
  if (stateMap[tabName].list.length === 0 && stateMap[tabName].hasMore) {
    loadActiveTabData()
  }
}

// 【核心修复】：监听 userId 与 isSelf 的变化，实现鉴权与重置
watch(
    () => [props.userId, props.isSelf],
    ([newUserId, newIsSelf]) => {
      if (!newUserId) return

      // 清空历史状态
      stateMap.history = createListState()
      stateMap.favorite = { ...createListState(), status: 0 }
      stateMap.post = createListState()

      // 动态分配默认 Tab：本人看历史，访客看发帖
      activeTab.value = newIsSelf ? 'history' : 'post'

      // 加载首页数据
      loadActiveTabData()
    },
    { immediate: true } // 组件挂载时自动触发一次
)
</script>

<template>
  <el-card shadow="never" class="history-list-card">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="custom-tabs">

      <el-tab-pane label="浏览历史" name="history" v-if="props.isSelf">
        <div
            class="scroll-container"
            v-infinite-scroll="fetchHistory"
            :infinite-scroll-disabled="stateMap.history.loading || !stateMap.history.hasMore"
            :infinite-scroll-distance="30"
        >
          <div class="post-list-wrapper">
            <MiniPost v-for="post in stateMap.history.list" :key="post.id" :post="post" />
          </div>
          <div class="loading-state" v-if="stateMap.history.loading"><el-icon class="is-loading"><Loading /></el-icon> 加载中...</div>
          <div class="no-more-state" v-if="!stateMap.history.hasMore && stateMap.history.list.length > 0">- 到底啦 -</div>
          <el-empty v-if="!stateMap.history.loading && stateMap.history.list.length === 0" description="暂无浏览记录" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="收藏书籍" name="favorite">
        <div class="filter-bar">
          <el-radio-group v-model="stateMap.favorite.status" @change="handleFavoriteStatusChange" size="small">
            <el-radio-button :label="0">全部</el-radio-button>
            <el-radio-button :label="1">想读</el-radio-button>
            <el-radio-button :label="2">在读</el-radio-button>
            <el-radio-button :label="3">读过</el-radio-button>
          </el-radio-group>
        </div>
        <div
            class="scroll-container"
            v-infinite-scroll="fetchFavorite"
            :infinite-scroll-disabled="stateMap.favorite.loading || !stateMap.favorite.hasMore"
            :infinite-scroll-distance="30"
        >
          <div class="book-grid-wrapper">
            <MiniBook v-for="book in stateMap.favorite.list" :key="book.id" :book="book" />
          </div>
          <div class="loading-state" v-if="stateMap.favorite.loading"><el-icon class="is-loading"><Loading /></el-icon> 加载中...</div>
          <div class="no-more-state" v-if="!stateMap.favorite.hasMore && stateMap.favorite.list.length > 0">- 到底啦 -</div>
          <el-empty v-if="!stateMap.favorite.loading && stateMap.favorite.list.length === 0" description="暂无符合条件的书籍" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="发帖记录" name="post">
        <div
            class="scroll-container"
            v-infinite-scroll="fetchPost"
            :infinite-scroll-disabled="stateMap.post.loading || !stateMap.post.hasMore"
            :infinite-scroll-distance="30"
        >
          <div class="post-list-wrapper">
            <MiniPost v-for="post in stateMap.post.list" :key="post.id" :post="post" />
          </div>
          <div class="loading-state" v-if="stateMap.post.loading"><el-icon class="is-loading"><Loading /></el-icon> 加载中...</div>
          <div class="no-more-state" v-if="!stateMap.post.hasMore && stateMap.post.list.length > 0">- 到底啦 -</div>
          <el-empty v-if="!stateMap.post.loading && stateMap.post.list.length === 0" description="暂无发帖记录" />
        </div>
      </el-tab-pane>

    </el-tabs>
  </el-card>
</template>

<style scoped>
.history-list-card {
  border-radius: 8px;
  border: 1px solid var(--book-border-color);
  background-color: var(--book-topbar-bg);
}

.custom-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  color: var(--book-text-color);
}
.custom-tabs :deep(.el-tabs__item.is-active) {
  color: var(--book-link-color);
  font-weight: bold;
}

.filter-bar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-start;
}

.scroll-container {
  height: 600px;
  overflow-y: auto;
  padding-right: 10px;
}

.scroll-container::-webkit-scrollbar { width: 6px; }
.scroll-container::-webkit-scrollbar-thumb { background: var(--book-border-color); border-radius: 3px; }
.scroll-container::-webkit-scrollbar-track { background: transparent; }

.post-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px 0;
}

.book-grid-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 20px;
  padding: 10px 0;
}

.loading-state, .no-more-state {
  text-align: center;
  padding: 15px 0;
  font-size: 13px;
  color: var(--book-hover-color);
}
</style>