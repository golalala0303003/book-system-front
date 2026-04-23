<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request.js'
import { fetchSSE } from '@/utils/sseFetch.js'
import MarkdownIt from 'markdown-it'

// 组件引入
import MiniBook from '@/components/book/MiniBook.vue'
import MiniPost from '@/components/forum/MiniPost.vue'
import { Loading } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()

// Markdown 配置
const md = new MarkdownIt({ breaks: true, html: true, linkify: true })
const renderMarkdown = (text) => (text ? md.render(text) : '')

// ================= 区域二：今日图书与 AI 推荐 =================
const dailyBooks = ref([])
const loadingBooks = ref(true)

const aiReasonMap = reactive({})
const aiCacheStatus = reactive({})
const isGeneratingAI = ref(false)
let currentAbortController = null

/**
 * 格式化标签字符串为数组 (严格遵循 BookWikiDetail 规范)
 */
const formatTags = (tagsStr) => {
  if (tagsStr) {
    return tagsStr.split(',').filter(t => t.trim() !== '')
  }
  return []
}

/**
 * 点击标签跳转到百科分页页 (严格遵循交互规范)
 */
const handleTagClick = (tag) => {
  router.push({ name: 'wikiPage', query: { tag } })
}

const fetchDailyBooks = async () => {
  try {
    const res = await request.get('/book/recommend', { params: { limit: 5 } })
    if (res.code === 200 && res.data) {
      dailyBooks.value = res.data
      if (dailyBooks.value.length > 0) {
        fetchAIReason(dailyBooks.value[0].id)
      }
    }
  } catch (error) {
    console.error('获取今日图书失败', error)
  } finally {
    loadingBooks.value = false
  }
}

const fetchAIReason = async (bookId) => {
  if (aiCacheStatus[bookId] === 'done') {
    isGeneratingAI.value = false
    return
  }

  if (currentAbortController) {
    currentAbortController.abort()
  }

  currentAbortController = new AbortController()
  isGeneratingAI.value = true
  aiCacheStatus[bookId] = 'generating'

  if (typeof aiReasonMap[bookId] === 'undefined') {
    aiReasonMap[bookId] = ''
  }

  await fetchSSE(
      `/ai/reason/${bookId}`,
      { method: 'GET', signal: currentAbortController.signal },
      {
        onMessage: (chunk) => {
          aiReasonMap[bookId] += chunk
        },
        onError: () => {
          aiReasonMap[bookId] += '\n[推荐语生成失败，请稍后再试]'
          isGeneratingAI.value = false
          aiCacheStatus[bookId] = 'error'
        },
        onComplete: () => {
          isGeneratingAI.value = false
          aiCacheStatus[bookId] = 'done'
        }
      }
  )
}

const handleCarouselChange = (index) => {
  const book = dailyBooks.value[index]
  if (book) {
    fetchAIReason(book.id)
  }
}

// ================= 区域三：可能想看的帖子 =================
const postList = ref([])
const postQuery = reactive({ page: 1, size: 10 })
const loadingPosts = ref(false)
const hasMorePosts = ref(true)

const fetchRecommendPosts = async () => {
  if (loadingPosts.value || !hasMorePosts.value) return
  loadingPosts.value = true
  try {
    const res = await request.get('/post/recommend/page', { params: postQuery })
    if (res.code === 200) {
      const records = res.data.records || []
      postList.value.push(...records)
      if (records.length < postQuery.size) {
        hasMorePosts.value = false
      } else {
        postQuery.page += 1
      }
    }
  } catch (error) {
    console.error('获取推荐帖子失败', error)
  } finally {
    loadingPosts.value = false
  }
}

const loadMorePosts = () => {
  fetchRecommendPosts()
}

const infiniteScrollDisabled = computed(() => loadingPosts.value || !hasMorePosts.value)

onMounted(() => {
  fetchDailyBooks()
})
</script>

<template>
  <div class="welcome-container">

    <div class="welcome-header">
      <h1 class="greeting">
        欢迎！<span v-if="userStore.token">{{ userStore.userInfo?.username || userStore.username }}</span>
      </h1>
      <p class="subtitle">您的今日专属推荐</p>
    </div>

    <div class="daily-recommend-section" v-loading="loadingBooks">
      <el-carousel
          v-if="dailyBooks.length > 0"
          height="320px"
          :autoplay="false"
          indicator-position="outside"
          arrow="always"
          @change="handleCarouselChange"
          class="custom-carousel"
      >
        <el-carousel-item v-for="book in dailyBooks" :key="book.id">
          <div class="carousel-content-wrapper">

            <div class="book-card-area">
              <div class="mini-book-wrapper">
                <MiniBook :book="book" />
              </div>

              <div class="book-tags-box">
                <div class="tag-label">相关标签</div>
                <div class="tags-list">
                  <el-tag
                      v-for="tag in formatTags(book.tags)"
                      :key="tag"
                      class="clickable-tag"
                      effect="plain"
                      type="info"
                      size="small"
                      @click="handleTagClick(tag)"
                  >
                    {{ tag }}
                  </el-tag>
                  <span v-if="formatTags(book.tags).length === 0" class="no-tags">暂无标签</span>
                </div>
              </div>
            </div>

            <div class="ai-reason-area">
              <div class="ai-header">
                <span class="sparkle">✨</span> AI 推荐理由
              </div>
              <el-scrollbar height="240px" class="ai-content-scroll">
                <div
                    class="markdown-body ai-text"
                    v-html="renderMarkdown(aiReasonMap[book.id])"
                    :class="{ 'is-generating': isGeneratingAI && aiCacheStatus[book.id] === 'generating' }"
                ></div>
                <div v-if="!aiReasonMap[book.id] && aiCacheStatus[book.id] !== 'done'" class="ai-placeholder">
                  正在为您生成推荐语...
                </div>
              </el-scrollbar>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
      <el-empty v-else-if="!loadingBooks" description="暂无图书推荐" />
    </div>

    <el-divider border-style="dashed" />

    <div class="recommended-posts-section">
      <h2 class="section-title">你可能想看</h2>

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
          <el-icon class="is-loading"><Loading /></el-icon> 正在加载推荐内容...
        </div>
        <div class="no-more-state" v-if="!hasMorePosts && postList.length > 0">
          - 已经到底啦 -
        </div>
        <el-empty
            v-if="!loadingPosts && postList.length === 0"
            description="暂无个性化帖子推荐"
        />
      </div>
    </div>

  </div>
</template>

<style scoped>
.welcome-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
}

.welcome-header { margin-bottom: 25px; }
.greeting { font-size: 28px; font-weight: bold; color: var(--book-text-color); margin: 0 0 8px 0; }
.subtitle { font-size: 16px; color: var(--book-hover-color); margin: 0; }

.daily-recommend-section {
  background-color: var(--book-topbar-bg);
  border: 1px solid var(--book-border-color);
  border-radius: 12px;
  padding: 20px 10px;
  margin-bottom: 30px;
}

/* 轮播图控制 */
.carousel-content-wrapper {
  display: flex;
  gap: 30px;
  height: 100%;
  margin-left: 80px;  /* 新增：为左侧箭头腾出专用空间 */
  margin-right: 80px; /* 新增：为右侧箭头腾出专用空间 */
}

/* 左侧：图书卡片与标签 */
.book-card-area {
  width: 45%;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  border-right: 1px solid var(--book-border-color);
  padding-right: 20px;
}

.mini-book-wrapper {
  flex-shrink: 0;
}

.book-tags-box {
  flex: 1;
}
.tag-label {
  font-size: 13px;
  color: var(--book-hover-color);
  margin-bottom: 10px;
  font-weight: bold;
}
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.clickable-tag {
  cursor: pointer;
  transition: all 0.2s;
}
.clickable-tag:hover {
  color: var(--book-link-color);
  border-color: var(--book-link-color);
}
.no-tags {
  font-size: 12px;
  color: var(--book-hover-color);
  font-style: italic;
}

/* 右侧 AI 理由 */
.ai-reason-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.ai-header {
  font-size: 16px;
  font-weight: bold;
  color: var(--book-link-color);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.ai-content-scroll {
  background-color: var(--book-bg-color);
  border-radius: 8px;
  padding: 15px;
}
.ai-text { font-size: 15px; line-height: 1.8; color: var(--book-text-color); }
.ai-placeholder { color: var(--book-hover-color); font-style: italic; font-size: 14px; }

:deep(.markdown-body p) { margin: 0 0 10px 0; }
:deep(.markdown-body p:last-child) { margin-bottom: 0; }
:deep(.markdown-body strong) { font-weight: 600; color: var(--book-text-color); }

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
:deep(.is-generating.markdown-body > *:last-child::after) {
  content: '|';
  display: inline-block;
  animation: blink 1s infinite;
  margin-left: 4px;
  font-weight: bold;
  color: var(--book-link-color);
}

.recommended-posts-section { margin-top: 30px; }
.section-title { font-size: 20px; font-weight: bold; color: var(--book-text-color); margin-bottom: 20px; }
.post-list-wrapper { display: flex; flex-direction: column; gap: 12px; }
.loading-state, .no-more-state { text-align: center; padding: 20px 0; font-size: 14px; color: var(--book-hover-color); }
</style>