<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CaretTop, CaretBottom, ChatDotRound, Reading, MoreFilled } from '@element-plus/icons-vue'
import request from '@/utils/request.js'
import MiniBook from '@/components/book/MiniBook.vue'
import MiniPost from '@/components/forum/MiniPost.vue'
import CommentSection from '@/components/forum/CommentSection.vue'
import ReportDialog from '@/components/ReportDialog.vue' // 引入举报组件
import { useUserStore } from '@/stores/user' // 引入用户状态

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const postDetail = ref({})
const recommendPosts = ref([])
const commentSectionRef = ref(null)
const reportDialogRef = ref(null) // 举报弹窗引用

// 判断当前登录用户是否是该帖子的作者
const isPostOwner = computed(() => {
  return postDetail.value.user_id && userStore.userInfo?.id === postDetail.value.user_id
})

const goToUserProfile = () => {
  if (postDetail.value.user_id) {
    router.push({ name: 'profile', params: { id: postDetail.value.user_id } })
  }
}

const fetchPostDetail = async () => {
  const postId = route.params.id
  if (!postId) return

  loading.value = true
  try {
    const res = await request.get(`/post/detail/${postId}`, {
      params: { record_view: true }
    })
    if (res.code === 200) {
      postDetail.value = res.data || {}
    }
  } catch (error) {
    console.error('获取帖子详情异常:', error)
  } finally {
    loading.value = false
  }
}

const fetchRecommendPosts = async () => {
  try {
    const res = await request.post('/post/page', {
      page: 1, size: 5, sort_by: 'view'
    })
    if (res.code === 200) {
      const records = res.data.records || []
      recommendPosts.value = records.filter(p => String(p.id) !== String(route.params.id))
    }
  } catch (error) {
    console.error('获取推荐帖子异常:', error)
  }
}

const handleVote = async (type) => {
  if (!postDetail.value.id) return
  try {
    const res = await request.post('/post/vote', {
      post_id: postDetail.value.id, vote_type: type
    })
    if (res.code === 200) {
      const pd = postDetail.value
      if (pd.my_vote === type) {
        pd.my_vote = 0
        if (type === 1) pd.upvote_count--
        if (type === -1) pd.downvote_count--
      } else {
        if (pd.my_vote === 1) pd.upvote_count--
        if (pd.my_vote === -1) pd.downvote_count--
        pd.my_vote = type
        if (type === 1) pd.upvote_count++
        if (type === -1) pd.downvote_count++
      }
    }
  } catch (error) {
    console.error('互动状态更新异常:', error)
  }
}

// 处理帖子右上角菜单指令
const handlePostCommand = (command) => {
  if (command === 'report') {
    reportDialogRef.value.open('post', postDetail.value.id)
  } else if (command === 'edit') {
    router.push({ name: 'editPost', params: { id: postDetail.value.id } })
  } else if (command === 'delete') {
    ElMessageBox.confirm('确定要永久删除这篇帖子吗？删除后将无法恢复。', '系统提示', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const res = await request.post('/post/delete', { post_id: postDetail.value.id })
        if (res.code === 200) {
          ElMessage.success('帖子删除成功')
          router.push({ name: 'forumHome' }) // 删除后跳回论坛首页
        }
      } catch (error) {
        console.error('删除帖子失败', error)
      }
    }).catch(() => {})
  }
}

const scrollToComments = () => {
  if (commentSectionRef.value) {
    commentSectionRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const initPage = () => {
  fetchPostDetail()
  fetchRecommendPosts()
}

onMounted(() => { initPage() })
watch(() => route.params.id, (newId) => {
  if (newId && route.name === 'postDetail') {
    window.scrollTo({ top: 0 }); initPage()
  }
})
</script>

<template>
  <div class="post-detail-layout" v-loading="loading">
    <template v-if="postDetail.id">
      <aside class="left-action-bar">
        <div class="author-info hover-pointer" @click="goToUserProfile">
          <el-avatar :size="50" :src="postDetail.user?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
          <span class="author-name">{{ postDetail.user?.username || '未知' }}</span>
        </div>
        <div class="action-buttons">
          <el-tooltip content="好评" placement="right">
            <div class="action-circle-btn" :class="{ 'is-active': postDetail.my_vote === 1 }" @click="handleVote(1)"><el-icon><CaretTop /></el-icon></div>
          </el-tooltip>
          <span class="action-count">{{ postDetail.upvote_count }}</span>
          <el-tooltip content="差评" placement="right">
            <div class="action-circle-btn" :class="{ 'is-active': postDetail.my_vote === -1 }" @click="handleVote(-1)"><el-icon><CaretBottom /></el-icon></div>
          </el-tooltip>
          <span class="action-count">{{ postDetail.downvote_count }}</span>
          <el-tooltip content="前往评论" placement="right">
            <div class="action-circle-btn comment-btn" @click="scrollToComments"><el-icon><ChatDotRound /></el-icon></div>
          </el-tooltip>
        </div>
      </aside>

      <main class="middle-main-content">
        <div class="post-cover-wrapper" v-if="postDetail.cover_image">
          <el-image class="post-cover-image" :src="postDetail.cover_image" fit="cover" :preview-src-list="[postDetail.cover_image]" />
        </div>

        <div class="post-header-info">
          <div class="title-row">
            <h1 class="post-title">{{ postDetail.title }}</h1>

            <el-dropdown trigger="click" @command="handlePostCommand">
              <span class="more-action-btn">
                <el-icon><MoreFilled /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <template v-if="isPostOwner">
                    <el-dropdown-item command="edit">编辑帖子</el-dropdown-item>
                    <el-dropdown-item command="delete" class="text-danger">删除帖子</el-dropdown-item>
                  </template>
                  <template v-else>
                    <el-dropdown-item command="report">举报违规</el-dropdown-item>
                  </template>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <div class="post-meta">
            发布于 {{ postDetail.create_time?.replace('T', ' ') }} <span class="divider">·</span> {{ postDetail.view_count }} 次阅读
          </div>
        </div>

        <el-divider border-style="dashed" />

        <div class="rich-text-container" v-html="postDetail.content"></div>

        <div class="comment-section-placeholder" ref="commentSectionRef">
          <el-divider>评论区</el-divider>
          <CommentSection :postId="postDetail.id" :postAuthorId="postDetail.user_id" />
        </div>
      </main>

      <aside class="right-side-bar">
        <div class="side-widget book-widget" v-if="postDetail.book">
          <div class="widget-header"><el-icon><Reading /></el-icon> 关联图书</div>
          <div class="widget-body book-widget-container"><MiniBook :book="postDetail.book" /></div>
        </div>
        <div class="side-widget">
          <div class="widget-header">你可能会喜欢</div>
          <div class="widget-body recommend-list">
            <MiniPost v-for="post in recommendPosts" :key="post.id" :post="post" />
            <el-empty v-if="recommendPosts.length === 0" description="暂无推荐数据" :image-size="60" />
          </div>
        </div>
      </aside>
    </template>
    <el-empty v-else-if="!loading" description="内容加载失败或已被删除" />

    <ReportDialog ref="reportDialogRef" />
  </div>
</template>

<style scoped>
.post-detail-layout {
  display: flex; justify-content: center; align-items: flex-start; gap: 24px;
  max-width: 1400px; min-width: 1200px; margin: 0 auto; padding: 24px 20px; overflow-x: auto;
}
.left-action-bar { position: sticky; top: 100px; display: flex; flex-direction: column; align-items: center; width: 80px; gap: 30px; flex-shrink: 0; }
.author-info { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.author-name { font-size: 13px; color: var(--book-text-color); text-align: center; word-break: break-all; }
.action-buttons { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.action-circle-btn { width: 48px; height: 48px; border-radius: 50%; background-color: var(--book-topbar-bg); border: 1px solid var(--book-border-color); display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--book-hover-color); cursor: pointer; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.action-circle-btn:hover { color: var(--book-link-color); border-color: var(--book-link-color); }
.action-circle-btn.is-active { background-color: var(--book-link-color); color: #fff; border-color: var(--book-link-color); }
.comment-btn { margin-top: 10px; }
.action-count { font-size: 14px; color: var(--book-hover-color); margin-top: -8px; margin-bottom: 8px; }

.middle-main-content { flex: 1; min-width: 750px; flex-shrink: 0; background-color: var(--book-topbar-bg); border-radius: 8px; border: 1px solid var(--book-border-color); padding: 30px; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05); }
.post-cover-wrapper { width: 100%; height: 300px; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
.post-cover-image { width: 100%; height: 100%; }

/* 标题行使用 flex 布局把操作按钮挤到右边 */
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}
.post-title { flex: 1; font-size: 28px; font-weight: bold; color: var(--book-text-color); margin: 0 0 12px 0; line-height: 1.4; }

.more-action-btn {
  display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;
  border-radius: 50%; color: var(--book-hover-color); cursor: pointer; transition: background 0.2s;
}
.more-action-btn:hover { background-color: var(--book-bg-color); color: var(--book-text-color); }
.text-danger { color: #f56c6c !important; }

.post-meta { font-size: 14px; color: var(--book-hover-color); }
.divider { margin: 0 8px; }
.rich-text-container { font-size: 16px; line-height: 1.8; color: var(--book-text-color); word-wrap: break-word; min-height: 300px; }
.rich-text-container :deep(img) { max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0; }
.comment-section-placeholder { margin-top: 50px; }

.right-side-bar { width: 450px; flex-shrink: 0; display: flex; flex-direction: column; gap: 20px; position: sticky; top: 100px; }
.side-widget { background-color: var(--book-topbar-bg); border: 1px solid var(--book-border-color); border-radius: 8px; overflow: hidden; }
.book-widget { align-self: flex-start; width: max-content; min-width: 220px; }
.widget-header { padding: 16px 20px; font-size: 16px; font-weight: bold; color: var(--book-text-color); border-bottom: 1px solid var(--book-border-color); background-color: var(--el-fill-color-light); display: flex; align-items: center; gap: 8px; }
.widget-body { padding: 16px; }
.book-widget-container { display: flex; justify-content: center; }
.recommend-list { display: flex; flex-direction: column; gap: 16px; }

.hover-pointer { cursor: pointer; transition: opacity 0.2s; }
.hover-pointer:hover { opacity: 0.8; }
.hover-pointer:hover .author-name { color: var(--book-link-color); }
</style>