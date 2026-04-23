<script setup>
import { ref } from 'vue'
import MiniPost from '@/components/forum/MiniPost.vue'

// 将你给的完整返回值中的 data 部分直接作为模拟数据
const mockPostData = ref({
  "id": 1,
  "title": "大家好啊，这是一篇测试文章",
  "content": "大家好啊，这是测试文章的内容",
  "cover_image": "https://zr-book-system-oss.oss-cn-shanghai.aliyuncs.com/images/others/3c1f4cb63d2b46f3b31d5d7b6383b9b4.png",
  "user_id": 1,
  "user": {
    "id": 1,
    "username": "zengrui",
    "email": "2531594414@qq.com",
    "phone": "18120724337",
    "avatar": "https://zr-book-system-oss.oss-cn-shanghai.aliyuncs.com/images/avatars/cb66ff138a1e49b8b9077a3c94e46879.png",
    "age": 21,
    "gender": "unknown",
    "school": "福州大学",
    "role": "admin",
    "create_time": "2026-03-31T18:51:05"
  },
  "board_id": 2,
  "book_id": 2106,
  "book": {
    "id": 2106,
    "douban_id": "35333759",
    "isbn": "9787020169481",
    "title": "伤物语",
    "author": "[日] 西尾维新",
    "publisher": "人民文学出版社",
    "publish_year": "2022-1-1",
    "cover_url": "https://zr-book-system-oss.oss-cn-shanghai.aliyuncs.com/images/books/pic/35333759.jpg",
    "summary": "某日，阿良良木历遇见了一位美丽惊人的金发吸血 鬼。如果没有遇见她，阿良良木就不会知道有怪异的存在 ，命运的邂逅由此开启……“物语系列”是由日本轻小说 作家西尾维新创作的轻小说系列。本系列的故事背景是21 世纪初的某个日本小镇，讲述的是高中少年阿良良木历与 身边的少女遇到各种民间怪谈的故事。本系列不以寻找事 发原因之类的解谜为主线，而是主要通过对话描写少男少 女的内心世界。故事之中还加入了恋爱喜剧，情节跌宕起 伏，十分有趣。",
    "tags": "轻小说,西尾维新,小说,日本,长篇小说,虚构,电子版,物语系列,日本文學,微信读书",
    "douban_rating": 7.3,
    "view_count": 0,
    "favorite_count": 0,
    "upvote_count": 0,
    "downvote_count": 0,
    "post_count": 0,
    "is_active": true,
    "my_vote": 0,
    "my_favorite_status": 0
  },
  "view_count": 1,
  "upvote_count": 0,
  "downvote_count": 0,
  "comment_count": 0,
  "my_vote": 0,
  "create_time": "2026-04-03T17:32:15",
  "update_time": "2026-04-03T17:36:10"
})
</script>

<template>
  <div class="test-page-container">
    <h2>MiniPost 组件测试</h2>

    <div class="feed-container">
      <MiniPost :post="mockPostData" />
    </div>

  </div>
</template>

<style scoped>
.test-page-container {
  padding: 40px;
  background-color: var(--book-bg-color);
  min-height: 100vh;
}

h2 {
  color: var(--book-text-color);
  margin-bottom: 20px;
}

/* 模拟真实论坛中心区域的宽度 */
.feed-container {
  max-width: 800px;
  background-color: var(--book-topbar-bg);
  border: 1px solid var(--book-border-color);
  border-radius: 8px;
  overflow: hidden;
}
</style>