<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const keyword = ref('')
const searchType = ref('1') // 1: 图书, 2: 帖子

// 获取联想建议
const querySearch = async (queryString, cb) => {
  if (!queryString || searchType.value !== '1') {
    cb([])
    return
  }

  try {
    const res = await request.get('/book/suggest', {
      params: { key_word: queryString, limit: 5 } // 注意你后端的参数名是 key_word
    })

    if (res.code === 200 && res.data) {
      // Element Plus 的 autocomplete 需要每个对象都有一个 value 属性用于显示在输入框内
      const formatData = res.data.map(item => ({
        ...item,
        value: item.title // 选中的时候，输入框里变成书名
      }))
      cb(formatData)
    } else {
      cb([])
    }
  } catch (error) {
    console.error("获取搜索建议失败", error)
    cb([])
  }
}

// 动作 B：点击下拉框的具体某本书 -> 直接跳图书详情页
const handleSelect = (item) => {
  keyword.value = item.value // 补全输入框
  if (searchType.value === '1') {
    router.push({ name: 'bookDetail', params: { id: item.id } })
  }
}

// 动作 C：直接按回车或点击放大镜 -> 跳转分页搜索页
const handleSearch = () => {
  const queryText = keyword.value.trim()
  if (!queryText) return

  if (searchType.value === '1') {
    // 跳转到图书分页查询页
    router.push({
      name: 'wikiPage',
      query: { keyword: queryText }
    })
  } else if (searchType.value === '2') {
    router.push({
      name: 'forumPage',
      query: { keyword: queryText }
    })
  }
}
</script>

<template>
  <div class="global-search-wrapper">
    <el-autocomplete
        v-model="keyword"
        :fetch-suggestions="querySearch"
        :teleported="false"
        placeholder="探索好书与帖子..."
        @select="handleSelect"
        @keyup.enter="handleSearch"
        class="custom-search"
        :trigger-on-focus="false"
        clearable
        popper-class="custom-suggest-popper"
    >
      <template #prepend>
        <el-select v-model="searchType" class="search-type-select">
          <el-option label="图书" value="1" />
          <el-option label="帖子" value="2" />
        </el-select>
      </template>

      <template #append>
        <el-button :icon="Search" @click="handleSearch" />
      </template>

      <template #default="{ item }">
        <div class="suggest-item">
          <el-image
              class="suggest-cover"
              :src="item.cover_url"
              fit="cover"
          >
            <template #error>
              <div class="suggest-cover-error">无图</div>
            </template>
          </el-image>

          <div class="suggest-info">
            <div class="suggest-title" :title="item.title">{{ item.title }}</div>
            <div class="suggest-author" v-if="item.author">{{ item.author }}</div>
          </div>
        </div>
      </template>
    </el-autocomplete>
  </div>
</template>

<style scoped>
.global-search-wrapper {
  width: 400px;
}

.custom-search :deep(.el-input-group__prepend) {
  background-color: var(--el-fill-color-light);
  border-right: none;
}
.search-type-select {
  width: 80px;
}
.custom-search :deep(.el-input__wrapper) {
  background-color: var(--el-fill-color-light);
}
.custom-search :deep(.el-input__wrapper.is-focus) {
  background-color: var(--el-input-bg-color);
  box-shadow: 0 0 0 1px var(--book-link-color) inset;
}

/* --- 自定义联想下拉列表的样式 --- */
.suggest-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
  gap: 12px;
}

/* 小封面样式 */
.suggest-cover {
  width: 30px;
  height: 42px; /* 仍然遵循 3:4 的大体比例 */
  border-radius: 2px;
  flex-shrink: 0;
  border: 1px solid var(--book-border-color);
  background-color: var(--el-fill-color-light);
}

.suggest-cover-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  font-size: 10px;
  color: var(--book-hover-color);
}

/* 右侧文字信息 */
.suggest-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden; /* 防止长文本撑破 */
}

.suggest-title {
  font-size: 14px;
  color: var(--book-text-color);
  line-height: 1.2;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggest-author {
  font-size: 12px;
  color: var(--book-hover-color);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<style>
.custom-suggest-popper .el-autocomplete-suggestion__wrap {
  max-height: 400px; /* 稍微加高一点，容纳图片 */
}
</style>