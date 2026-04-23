<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import MiniBook from '@/components/book/MiniBook.vue'

const props = defineProps({
  // 列表标题，例如 "热门图书"
  title: {
    type: String,
    default: ''
  },
  // 图书数据数组
  books: {
    type: Array,
    default: () => []
  },
  // 一行显示多少本书（列数），默认 5 本
  columns: {
    type: Number,
    default: 5
  },
  // 是否显示右上角的“更多”按钮
  showMore: {
    type: Boolean,
    default: false
  },
  // 点击更多时，带给 BookWikiPage 的查询参数对象，例如 { type: 'recommend' }
  moreQuery: {
    type: Object,
    default: () => ({})
  }
})

const router = useRouter()

// 点击更多跳转到分页搜索页面
const goMore = () => {
  router.push({
    name: 'wikiPage',
    query: props.moreQuery
  })
}

// 动态计算 CSS 变量，用于控制 Grid 网格的列数
const gridStyle = computed(() => {
  return {
    '--book-columns': props.columns
  }
})
</script>

<template>
  <div class="mini-book-list">
    <div class="list-header" v-if="title || showMore">
      <h3 class="list-title">{{ title }}</h3>
      <el-button
          v-if="showMore"
          link
          class="more-btn"
          @click="goMore"
      >
        更多 &gt;
      </el-button>
    </div>

    <el-empty v-if="books.length === 0" description="暂无相关图书" :image-size="100" />

    <div v-else class="books-grid" :style="gridStyle">
      <MiniBook
          v-for="book in books"
          :key="book.id"
          :book="book"
      />
    </div>
  </div>
</template>

<style scoped>
.mini-book-list {
  width: 100%;
  margin-bottom: 30px; /* 多个 List 之间的垂直间距 */
}

/* --- 头部样式 --- */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--book-border-color); /* 增加一条底边线，让区块更清晰 */
}

.list-title {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: var(--book-text-color);
}

.more-btn {
  font-size: 14px;
  color: var(--book-hover-color);
}

.more-btn:hover {
  color: var(--book-link-color);
}

/* --- 网格布局样式 --- */
.books-grid {
  display: grid;
  /* 使用父组件传进来的 columns 动态控制列数，1fr 代表平分剩余空间 */
  grid-template-columns: repeat(var(--book-columns), 1fr);
  /* 调整卡片之间的间距，水平间距 20px，垂直间距 24px */
  gap: 24px 20px;
}
</style>