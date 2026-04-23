<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View } from '@element-plus/icons-vue' // 引入浏览量图标
import request from '@/utils/request.js'
import MiniBookList from '@/components/book/MiniBookList.vue'
import AiChatCard from '@/components/AiChatCard.vue'
import RelatedPostsCard from '@/components/forum/RelatedPostsCard.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const book = ref(null)
const relatedBooks = ref([])

// 返回上一页
const goBack = () => {
  router.back()
}

// 1. 获取图书详情 (接收 id 作为参数)
const fetchBookDetail = async (id) => {
  try {
    const res = await request.get(`/book/detail/${id}`)
    if (res.code === 200) {
      book.value = res.data
    }
  } catch (error) {
    console.error("获取图书详情失败", error)
  }
}

// 2. 获取右侧相关图书占位数据
const fetchRelatedBooks = async (id) => {
  try {
    const res = await request.get('/book/similar', { params: { limit: 4, book_id: id} })
    if (res.code === 200) {
      relatedBooks.value = res.data || []
    }
  } catch (error) {
    console.error("获取相关图书失败", error)
  }
}

// 初始化数据
const initData = async (id) => {
  loading.value = true
  await Promise.all([fetchBookDetail(id), fetchRelatedBooks(id)])
  loading.value = false
  // 切换图书后，滚动条回到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  initData(Number(route.params.id))
})

// 监听路由参数变化（解决从相关推荐点击另一本书，页面不刷新的问题）
watch(() => route.params.id, (newId) => {
  if (newId && route.name === 'bookDetail') {
    initData(Number(newId))
  }
})

// --- 交互功能区 ---

// 点击标签跳转分页
const handleTagClick = (tag) => {
  router.push({ name: 'wikiPage', query: { tag } })
}

// 格式化标签字符串为数组
const bookTags = computed(() => {
  if (book.value && book.value.tags) {
    return book.value.tags.split(',').filter(t => t.trim() !== '')
  }
  return []
})

// 豆瓣评分除以 2 (适配 el-rate 5星制)
const rateValue = computed(() => {
  return book.value?.douban_rating ? Number((book.value.douban_rating / 2).toFixed(1)) : 0
})

// 计算当前收藏按钮的文字
const favoriteLabel = computed(() => {
  const statusMap = {
    0: '收藏',
    1: '想读',
    2: '在读',
    3: '读过'
  }
  return statusMap[book.value?.my_favorite_status] || '收藏'
})

// 点赞 / 踩 (前端手动计算状态，防止刷新页面污染浏览量)
const handleVote = async (type) => {
  try {
    const res = await request.post('/book/vote', {
      book_id: Number(route.params.id),
      vote_type: type
    })

    if (res.code === 200) {
      if (book.value.my_vote === type) {
        book.value.my_vote = 0
        if (type === 1) book.value.upvote_count--
        if (type === -1) book.value.downvote_count--
      } else {
        if (book.value.my_vote === 1) book.value.upvote_count--
        if (book.value.my_vote === -1) book.value.downvote_count--

        book.value.my_vote = type
        if (type === 1) book.value.upvote_count++
        if (type === -1) book.value.downvote_count++
      }
    }
  } catch (error) {
    console.error("投票失败", error)
  }
}

// 收藏 / 修改阅读状态 (前端手动计算状态)
const handleFavorite = async (command) => {
  if (command === book.value.my_favorite_status) return

  try {
    const res = await request.post('/book/favorite', {
      book_id: Number(route.params.id),
      status: command
    })

    if (res.code === 200) {
      if (command === 0) {
        book.value.favorite_count--
        book.value.my_favorite_status = 0
        ElMessage.success('已取消收藏')
      } else {
        if (book.value.my_favorite_status === 0) {
          book.value.favorite_count++
        }
        book.value.my_favorite_status = command
        ElMessage.success('收藏状态已更新')
      }
    }
  } catch (error) {
    console.error("操作收藏失败", error)
  }
}
</script>

<template>
  <div class="wiki-detail-container" v-loading="loading">

    <div class="header-action" v-if="!loading">
      <el-button link @click="goBack" class="back-btn">
        &lt; 返回
      </el-button>
    </div>

    <div v-if="book" class="detail-layout">

      <div class="main-content">
        <div class="book-header">
          <div class="cover-wrapper">
            <el-image
                class="book-cover"
                :src="book.cover_url"
                fit="cover"
                :preview-src-list="[book.cover_url]"
                preview-teleported
            >
              <template #error>
                <div class="image-slot">暂无封面</div>
              </template>
            </el-image>
          </div>

          <div class="info-wrapper">
            <h1 class="title">{{ book.title }}</h1>

            <div class="meta-info">
              <span>作者：{{ book.author || '未知' }}</span>
              <span>出版社：{{ book.publisher || '未知' }}</span>
              <span>出版年：{{ book.publish_year || '未知' }}</span>
              <span>ISBN：{{ book.isbn || '未知' }}</span>
              <span class="view-count"><el-icon><View /></el-icon> {{ book.view_count }} 次浏览</span>
            </div>

            <div class="rating-area" v-if="book.douban_rating > 0">
              <span class="rating-score">{{ book.douban_rating }}</span>
              <el-rate
                  v-model="rateValue"
                  disabled
                  show-score
                  text-color="#ff9900"
                  score-template="豆瓣评分"
              />
            </div>
            <div class="rating-area" v-else>
              <span class="no-rating">暂无评分</span>
            </div>

            <div class="action-group">
              <el-button
                  :type="book.my_vote === 1 ? 'primary' : 'default'"
                  @click="handleVote(1)"
              >
                好评 {{ book.upvote_count }}
              </el-button>

              <el-button
                  :type="book.my_vote === -1 ? 'info' : 'default'"
                  @click="handleVote(-1)"
              >
                差评 {{ book.downvote_count }}
              </el-button>

              <el-dropdown trigger="click" @command="handleFavorite">
                <el-button :type="book.my_favorite_status !== 0 ? 'success' : 'default'">
                  {{ favoriteLabel }} {{ book.favorite_count }}
                </el-button>

                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="1" :disabled="book.my_favorite_status === 1">想读</el-dropdown-item>
                    <el-dropdown-item :command="2" :disabled="book.my_favorite_status === 2">在读</el-dropdown-item>
                    <el-dropdown-item :command="3" :disabled="book.my_favorite_status === 3">读过</el-dropdown-item>
                    <el-dropdown-item v-if="book.my_favorite_status !== 0" :command="0" divided style="color: #F56C6C;">
                      取消收藏
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <div class="tags-area" v-if="bookTags.length > 0">
              <el-tag
                  v-for="tag in bookTags"
                  :key="tag"
                  class="clickable-tag"
                  effect="plain"
                  type="info"
                  @click="handleTagClick(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="book-summary">
          <div class="section-title">内容简介</div>
          <div class="summary-content">
            {{ book.summary || '暂无简介' }}
          </div>
        </div>
      </div>

      <div class="side-bar">
        <AiChatCard target-type="book" :target-id="route.params.id" />
        <RelatedPostsCard
            v-if="book"
            :book-id="route.params.id"
            :book-title="book.title"
        />

        <div class="related-books-section">
          <MiniBookList
              title="相关图书"
              :books="relatedBooks"
              :columns="2"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.wiki-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

/* 顶部返回按钮样式 */
.header-action {
  margin-bottom: 20px;
}
.back-btn {
  font-size: 16px;
  color: var(--book-text-color);
  transition: color 0.3s;
}
.back-btn:hover {
  color: var(--book-link-color);
}

.detail-layout {
  display: flex;
  align-items: flex-start;
  gap: 40px;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.book-header {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
}

.cover-wrapper {
  width: 200px;
  flex-shrink: 0;
  aspect-ratio: 3 / 4;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--book-border-color);
  background-color: var(--el-fill-color-light);
}
.book-cover {
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: var(--book-hover-color);
}

.info-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.title {
  margin: 0 0 15px 0;
  font-size: 26px;
  color: var(--book-text-color);
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  column-gap: 20px;
  row-gap: 8px;
  color: var(--book-hover-color);
  font-size: 14px;
  margin-bottom: 20px;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-area {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
}
.rating-score {
  font-size: 32px;
  font-weight: bold;
  color: #ff9900;
  line-height: 1;
}
.no-rating {
  font-size: 14px;
  color: var(--book-hover-color);
  margin-bottom: 25px;
}

/* 交互按钮组 */
.action-group {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
}

/* 消除 Element Plus 按钮默认的连贯边距叠加问题 */
.action-group .el-button {
  margin-left: 0 !important;
}

.tags-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.clickable-tag {
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.clickable-tag:hover {
  color: var(--book-link-color);
  border-color: var(--book-link-color);
}

.book-summary {
  margin-top: 20px;
}
.section-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--book-text-color);
  margin-bottom: 15px;
}
.summary-content {
  font-size: 15px;
  line-height: 1.8;
  color: var(--book-text-color);
  white-space: pre-wrap;
}

.side-bar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.side-card {
  border-radius: 8px;
  border: 1px solid var(--book-border-color);
}

.card-title {
  font-weight: bold;
  font-size: 16px;
  color: var(--book-text-color);
}
</style>