<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

// 接收props
const props = defineProps({
  book: {
    type: Object,
    required: true
  }
})

const router = useRouter()

// 点击卡片，跳转到图书详情页
const goToDetail = () => {
  router.push({ name: 'bookDetail', params: { id: props.book.id } })
}

// el-rate是5分的
const rateValue = computed(() => {
  return props.book.douban_rating ? Number((props.book.douban_rating / 2).toFixed(1)) : 0
})
</script>

<template>
  <div class="mini-book-card" @click="goToDetail">
    <el-popover
        placement="right"
        :width="280"
        trigger="hover"
        :show-after="300"
    >
      <div class="popover-content">
        <h4 class="pop-title">{{ book.title }}</h4>

        <div class="pop-rating" v-if="book.douban_rating > 0">
          <el-rate
              v-model="rateValue"
              disabled
              show-score
              text-color="#ff9900"
              :score-template="`${book.douban_rating} 分`"
          />
        </div>
        <div class="pop-rating" v-else>
          <span class="no-rating">暂无评分</span>
        </div>

        <div class="pop-meta">
          <p><strong>作者：</strong>{{ book.author || '未知' }}</p>
          <p><strong>出版社：</strong>{{ book.publisher || '未知' }}</p>
          <p><strong>出版年：</strong>{{ book.publish_year || '未知' }}</p>
        </div>

        <div class="pop-summary">
          {{ book.summary || '暂无内容简介...' }}
        </div>
      </div>

      <template #reference>
        <div class="cover-wrapper">
          <el-image
              :src="book.cover_url"
              fit="cover"
              class="book-cover"
              lazy
          >
            <template #error>
              <div class="image-slot">
                <span>暂无封面</span>
              </div>
            </template>
          </el-image>
        </div>
      </template>
    </el-popover>

    <div class="book-info">
      <div class="book-title" :title="book.title">{{ book.title }}</div>
      <div class="book-author" :title="book.author">{{ book.author || '佚名' }}</div>
    </div>
  </div>
</template>

<style scoped>
.mini-book-card {
  width: 120px; /* 基础宽度，父组件可通过 flex/grid 覆盖它 */
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
}

.mini-book-card:hover {
  transform: translateY(-4px); /* 鼠标悬浮时整个卡片微微上浮 */
}

/* 封面包装器，固定比例，约 3:4 */
.cover-wrapper {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--book-border-color);
  background-color: var(--el-fill-color-light); /* 使用 Element 的背景变量 */
}

.book-cover {
  width: 100%;
  height: 100%;
}

/* 图片加载失败的样式 */
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--book-hover-color);
  font-size: 12px;
}

/* 底部信息区 */
.book-info {
  margin-top: 8px;
}

.book-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--book-text-color);
  /* 单行溢出显示省略号 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-author {
  font-size: 12px;
  color: var(--book-hover-color);
  margin-top: 4px;
  /* 单行溢出显示省略号 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- Popover 内部样式 --- */
.popover-content {
  color: var(--book-text-color);
}

.pop-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--book-text-color);
}

.pop-rating {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.no-rating {
  font-size: 13px;
  color: var(--book-hover-color);
}

.pop-meta p {
  margin: 4px 0;
  font-size: 12px;
  color: var(--book-hover-color);
}

.pop-meta strong {
  color: var(--book-text-color);
}

.pop-summary {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--book-text-color);
  /* 简介最多显示 5 行，超出的显示省略号 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
  overflow: hidden;
  border-top: 1px dashed var(--book-border-color);
  padding-top: 10px;
}
</style>