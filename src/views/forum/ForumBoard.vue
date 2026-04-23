<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, StarFilled, MoreFilled } from '@element-plus/icons-vue'
import request from '@/utils/request.js'
import MiniPost from '@/components/forum/MiniPost.vue'
import MiniBookList from '@/components/book/MiniBookList.vue'
import ReportDialog from '@/components/ReportDialog.vue'
import { refreshFavBoardTrigger } from '@/utils/eventBus.js'

const route = useRoute()

const boardInfo = ref({})
const postList = ref([])
const postQuery = reactive({ page: 1, size: 10, board_id: null, sort_by: 'time' })
const loadingPosts = ref(false)
const hasMorePosts = ref(true)
const hotBooks = ref([])

const reportDialogRef = ref(null) // 举报弹窗引用

const fetchBoardDetail = async () => {
  try {
    const res = await request.get(`/board/detail/${postQuery.board_id}`)
    if (res.code === 200) { boardInfo.value = res.data }
  } catch (error) { console.error('获取板块详情失败', error) }
}

const toggleFavorite = async () => {
  try {
    const targetStatus = boardInfo.value.fav_status ? -1 : 1
    const res = await request.post('/board/favorite', { board_id: postQuery.board_id, status: targetStatus })
    if (res.code === 200) {
      boardInfo.value.fav_status = !boardInfo.value.fav_status
      ElMessage.success(targetStatus === 1 ? '收藏成功' : '已取消收藏')
      refreshFavBoardTrigger.value++
    }
  } catch (error) { console.error('收藏板块失败', error) }
}

// 处理板块右上角菜单
const handleBoardCommand = (command) => {
  if (command === 'report') {
    reportDialogRef.value.open('board', boardInfo.value.id)
  }
}

const fetchPostList = async (reset = false) => {
  if (loadingPosts.value || (!hasMorePosts.value && !reset)) return
  loadingPosts.value = true
  if (reset) { postQuery.page = 1; postList.value = []; hasMorePosts.value = true }
  try {
    const res = await request.post('/post/page', postQuery)
    if (res.code === 200) {
      const records = res.data.records || []
      postList.value.push(...records)
      if (records.length < postQuery.size) { hasMorePosts.value = false }
      else { postQuery.page += 1 }
    }
  } catch (error) { console.error('获取帖子列表失败', error) }
  finally { loadingPosts.value = false }
}

const loadMorePosts = () => { fetchPostList(false) }
const handleSortChange = () => { fetchPostList(true) }

const fetchHotBooks = async () => {
  try {
    const res = await request.get('/book/recommend', { params: { limit: 4 } })
    if (res.code === 200) { hotBooks.value = res.data || [] }
  } catch (error) { console.error('获取推荐图书失败', error) }
}

const initPageData = () => {
  const boardId = Number(route.params.id)
  if (!boardId) return
  postQuery.board_id = boardId
  fetchBoardDetail()
  fetchHotBooks()
  fetchPostList(true)
}

onMounted(() => { initPageData() })
watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId && route.name === 'forumBoard') { initPageData() }
})

const infiniteScrollDisabled = computed(() => loadingPosts.value || !hasMorePosts.value)
</script>

<template>
  <div class="forum-board-container">
    <div class="main-content">
      <div class="board-header">
        <el-image class="board-cover" :src="boardInfo.cover_url" fit="cover">
          <template #error><div class="fallback-cover">{{ boardInfo.name ? boardInfo.name.charAt(0) : '版' }}</div></template>
        </el-image>

        <div class="board-info">
          <h2 class="board-name">{{ boardInfo.name }}</h2>
          <p class="board-desc">{{ boardInfo.description || '暂无板块简介' }}</p>
        </div>

        <div class="board-actions">
          <el-button :type="boardInfo.fav_status ? 'primary' : 'default'" :plain="!boardInfo.fav_status" @click="toggleFavorite">
            <el-icon><StarFilled v-if="boardInfo.fav_status"/><Star v-else/></el-icon>
            {{ boardInfo.fav_status ? '已收藏' : '收藏板块' }}
          </el-button>

          <el-dropdown trigger="click" @command="handleBoardCommand">
            <el-button class="more-btn" plain>
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="report">举报板块</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="list-control-bar">
        <el-tabs v-model="postQuery.sort_by" @tab-change="handleSortChange">
          <el-tab-pane label="最新" name="time"></el-tab-pane>
          <el-tab-pane label="热门" name="view"></el-tab-pane>
        </el-tabs>
      </div>

      <div class="post-list-wrapper" v-infinite-scroll="loadMorePosts" :infinite-scroll-disabled="infiniteScrollDisabled" :infinite-scroll-distance="50">
        <MiniPost v-for="post in postList" :key="post.id" :post="post" class="post-item" />
        <div class="loading-state" v-if="loadingPosts"><el-icon class="is-loading"><Loading /></el-icon> 正在加载更多帖子...</div>
        <div class="no-more-state" v-if="!hasMorePosts && postList.length > 0">- 已经到底啦 -</div>
        <el-empty v-if="!loadingPosts && postList.length === 0" description="该板块暂时还没有帖子哦" />
      </div>
    </div>

    <div class="side-widget">
      <div class="widget-box"><MiniBookList title="热门图书" :books="hotBooks" :columns="2" /></div>
    </div>

    <ReportDialog ref="reportDialogRef" />
  </div>
</template>

<style scoped>
.forum-board-container { display: flex; justify-content: center; align-items: flex-start; gap: 24px; max-width: 1200px; margin: 0 auto; padding: 24px 20px; }
.main-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.board-header { display: flex; align-items: center; gap: 20px; padding: 24px; background-color: var(--book-topbar-bg); border: 1px solid var(--book-border-color); border-radius: 8px; }
.board-cover, .fallback-cover { width: 80px; height: 80px; border-radius: 8px; flex-shrink: 0; }
.fallback-cover { background-color: var(--book-bg-color); color: var(--book-hover-color); font-size: 32px; font-weight: bold; display: flex; align-items: center; justify-content: center; }
.board-info { flex: 1; }
.board-name { margin: 0 0 8px 0; font-size: 24px; color: var(--book-text-color); }
.board-desc { margin: 0; font-size: 14px; color: var(--book-hover-color); }

/* 右侧操作按钮组对齐 */
.board-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.more-btn {
  padding: 8px;
}

.list-control-bar { background-color: var(--book-topbar-bg); border: 1px solid var(--book-border-color); border-radius: 8px; padding: 0 20px; }
.list-control-bar :deep(.el-tabs__nav-wrap::after) { display: none; }
.list-control-bar :deep(.el-tabs__header) { margin: 0; }
.list-control-bar :deep(.el-tabs__item) { height: 50px; line-height: 50px; font-size: 16px; color: var(--book-text-color); }
.list-control-bar :deep(.el-tabs__item.is-active) { color: var(--book-link-color); font-weight: bold; }
.post-list-wrapper { display: flex; flex-direction: column; gap: 12px; }
.loading-state, .no-more-state { text-align: center; padding: 20px 0; font-size: 14px; color: var(--book-hover-color); }
.side-widget { width: 300px; flex-shrink: 0; position: sticky; top: 90px; }
.widget-box { background-color: var(--book-topbar-bg); border: 1px solid var(--book-border-color); border-radius: 8px; padding: 20px; }
</style>