<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request.js'
import CommentItem from './CommentItem.vue'
import ReportDialog from '@/components/ReportDialog.vue' // 引入举报弹窗
import { useUserStore } from '@/stores/user'

const props = defineProps({
  postId: { type: [Number, String], required: true },
  postAuthorId: { type: [Number, String], required: true }
})

const userStore = useUserStore()
const comments = ref([])
const topContent = ref('')
const loading = ref(false)
const isAsc = ref(true)
const isOnlyAuthor = ref(false)
const reportDialogRef = ref(null) // 举报弹窗引用

const fetchComments = async () => {
  loading.value = true
  try {
    const res = await request.get(`/comment/list/${props.postId}`)
    if (res.code === 200) { comments.value = res.data || [] }
  } catch (error) { console.error('获取评论列表失败', error) }
  finally { loading.value = false }
}

const submitTopComment = async () => {
  if (!topContent.value.trim()) { ElMessage.warning('评论内容不能为空'); return }
  try {
    const res = await request.post('/comment/create', {
      post_id: Number(props.postId), content: topContent.value, parent_id: null, reply_to_user_id: null
    })
    if (res.code === 200) {
      ElMessage.success('评论发布成功')
      topContent.value = ''
      fetchComments()
    }
  } catch (error) { console.error('发布评论失败', error) }
}

// 接收子组件的举报请求
const handleReport = (commentId) => {
  reportDialogRef.value.open('comment', commentId)
}

const totalCommentsCount = computed(() => {
  return comments.value.reduce((total, current) => total + 1 + (current.children ? current.children.length : 0), 0)
})

const processedComments = computed(() => {
  let result = [...comments.value]
  if (isOnlyAuthor.value) result = result.filter(item => String(item.user_id) === String(props.postAuthorId))
  if (!isAsc.value) result.reverse()
  return result
})

onMounted(() => { fetchComments() })
</script>

<template>
  <div class="comment-section-container">
    <div class="top-publish-area">
      <el-avatar class="current-user-avatar" :size="48" :src="userStore.userInfo?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
      <div class="publish-input-box">
        <el-input v-model="topContent" type="textarea" :rows="3" placeholder="写下你的评论..." maxlength="1000" show-word-limit />
        <div class="publish-actions"><el-button type="primary" class="send-btn" @click="submitTopComment">发送</el-button></div>
      </div>
    </div>

    <div class="comment-control-bar">
      <div class="left-stats">
        <span class="total-text">全部回复 ({{ totalCommentsCount }}条)</span>
        <el-switch v-model="isOnlyAuthor" active-text="只看楼主" class="author-switch" />
      </div>
      <div class="right-sort">
        <el-radio-group v-model="isAsc" size="small">
          <el-radio-button :value="true">正序</el-radio-button>
          <el-radio-button :value="false">倒序</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="comment-list" v-loading="loading">
      <template v-if="processedComments.length > 0">
        <CommentItem
            v-for="comment in processedComments"
            :key="comment.id"
            :comment="comment"
            :postId="postId"
            @refresh="fetchComments"
            @report="handleReport"
        />
      </template>
      <el-empty v-else description="还没有人评论，快来抢沙发吧！" />
    </div>

    <ReportDialog ref="reportDialogRef" />
  </div>
</template>

<style scoped>
.comment-section-container { margin-top: 20px; }
.top-publish-area { display: flex; gap: 16px; margin-bottom: 30px; background-color: var(--el-fill-color-light); padding: 20px; border-radius: 8px; }
.publish-input-box { flex: 1; display: flex; flex-direction: column; }
.publish-actions { display: flex; justify-content: flex-end; margin-top: 12px; }
.send-btn { width: 100px; }
.comment-control-bar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid var(--book-border-color); margin-bottom: 24px; }
.left-stats { display: flex; align-items: center; gap: 20px; }
.total-text { font-size: 16px; font-weight: bold; color: var(--book-text-color); }
.author-switch { --el-switch-on-color: var(--book-link-color); }
.comment-list { min-height: 200px; }
</style>