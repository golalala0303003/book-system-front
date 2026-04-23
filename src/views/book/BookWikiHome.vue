<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request.js'
import MiniBookList from '@/components/book/MiniBookList.vue'

const router = useRouter()

// 响应式数据源
const recommendBooks = ref([])
const hotBooks = ref([])
const tags = ref([])

// 页面全局加载状态
const loading = ref(true)

// 1. 获取猜你喜欢 (10本)
const fetchRecommendBooks = async () => {
  try {
    const res = await request.get('/book/recommend', { params: { limit: 10 } })
    if (res.code === 200) {
      recommendBooks.value = res.data || []
    }
  } catch (error) {
    console.error('获取推荐图书失败', error)
  }
}

// 2. 获取热门书籍 (走分页接口，第一页，按 hot 排序)
const fetchHotBooks = async () => {
  try {
    const res = await request.post('/book/page', {
      page: 1,
      size: 10,
      sort_by: 'hot'
    })
    if (res.code === 200) {
      // 因为是 PageData 结构，真正的数组在 data.records 里
      hotBooks.value = res.data.records || []
    }
  } catch (error) {
    console.error('获取热门图书失败', error)
  }
}

// 3. 获取高频标签
const fetchTags = async () => {
  try {
    const res = await request.get('/book/tags')
    if (res.code === 200) {
      tags.value = res.data || []
    }
  } catch (error) {
    console.error('获取标签失败', error)
  }
}

// 页面初始化：并发请求所有数据
const initData = async () => {
  loading.value = true
  // Promise.all 可以让三个不相干的请求同时发出去，极大减少页面等待时间
  await Promise.all([
    fetchRecommendBooks(),
    fetchHotBooks(),
    fetchTags()
  ])
  loading.value = false
}

onMounted(() => {
  initData()
})

// 点击右侧标签，跳转至分页查询页
const goToSearchByTag = (tagName) => {
  router.push({
    name: 'wikiPage', // 假设你的分页页路由 name 是 wikiPage
    query: { tag: tagName }
  })
}
</script>

<template>
  <div class="wiki-home-container" v-loading="loading">

    <div class="main-content">
      <MiniBookList
          title="你可能会喜欢"
          :books="recommendBooks"
          :columns="5"
          showMore
          :moreQuery="{ type: 'recommend' }"
      />

      <MiniBookList
          title="热门"
          :books="hotBooks"
          :columns="5"
          showMore
          :moreQuery="{ sort_by: 'hot' }"
      />
    </div>

    <div class="side-bar">
      <el-card shadow="never" class="tag-card">
        <template #header>
          <div class="tag-header">
            <span>发现好标签</span>
          </div>
        </template>

        <div class="tag-list">
          <div
              v-for="tag in tags"
              :key="tag"
              class="tag-item"
              @click="goToSearchByTag(tag)"
          >
            {{ tag }}
          </div>
          <el-empty v-if="tags.length === 0" description="暂无标签" :image-size="60" />
        </div>
      </el-card>
    </div>

  </div>
</template>

<style scoped>
/* 整个页面容器的最大宽度和居中对齐 */
.wiki-home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  display: flex;
  align-items: flex-start; /* 顶部对齐 */
  gap: 40px; /* 左右两栏的间距 */
  min-height: 500px; /* 给一个最小高度防止 loading 时页面太小 */
}

/* 左侧主体内容占据剩余的全部空间 */
.main-content {
  flex: 1;
  /* 防止在小屏幕下内容溢出 */
  min-width: 0;
}

/* 右侧侧边栏固定宽度 */
.side-bar {
  width: 240px;
  position: sticky;
  top: 90px; /* 利用 sticky 定位，随着页面向下滚动，侧边栏会悬浮固定在视口 */
}

/* --- 侧边栏样式细节 --- */
.tag-card {
  border-radius: 8px;
  border: 1px solid var(--book-border-color);
}

.tag-header span {
  font-weight: bold;
  font-size: 16px;
  color: var(--book-text-color);
}

.tag-list {
  display: flex;
  flex-direction: column;
}

.tag-item {
  padding: 10px 16px;
  color: var(--book-text-color);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.tag-item:hover {
  background-color: var(--el-fill-color-light);
  color: var(--book-link-color);
  padding-left: 20px; /* hover 时文字有一个微妙的右移效果 */
}
</style>