<script setup>
import { ref } from 'vue'
import { CaretTop, CaretBottom, ChatDotRound, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request.js'
import { useUserStore } from '@/stores/user' // 引入用户状态用于判断删除权限

const props = defineProps({
  comment: { type: Object, required: true },
  postId: { type: [Number, String], required: true }
})

const emit = defineEmits(['refresh', 'report'])
const userStore = useUserStore()

const showReplyBox = ref(false)
const replyContent = ref('')
const isReplyingSub = ref(false)
const currentTarget = ref({})

const openReply = (targetComment, isSub = false) => {
  showReplyBox.value = true
  isReplyingSub.value = isSub
  currentTarget.value = targetComment
  replyContent.value = ''
}

const cancelReply = () => {
  showReplyBox.value = false; replyContent.value = ''
}

const submitReply = async () => {
  if (!replyContent.value.trim()) { ElMessage.warning('回复内容不能为空'); return }
  try {
    const res = await request.post('/comment/create', {
      post_id: Number(props.postId), content: replyContent.value,
      parent_id: props.comment.id,
      reply_to_user_id: isReplyingSub.value ? currentTarget.value.user_id : null
    })
    if (res.code === 200) {
      ElMessage.success('回复成功')
      showReplyBox.value = false; replyContent.value = ''
      emit('refresh')
    }
  } catch (error) { console.error('回复失败', error) }
}

const handleVote = async (type, target) => {
  try {
    const res = await request.post('/comment/vote', { comment_id: target.id, vote_type: type })
    if (res.code === 200) {
      if (target.my_vote === type) {
        target.my_vote = 0; if (type === 1) target.upvote_count--; if (type === -1) target.downvote_count--
      } else {
        if (target.my_vote === 1) target.upvote_count--; if (target.my_vote === -1) target.downvote_count--
        target.my_vote = type; if (type === 1) target.upvote_count++; if (type === -1) target.downvote_count++
      }
    }
  } catch (error) { console.error('评论投票失败', error) }
}

// 处理评论右上角的菜单命令（包含本人删除，他人举报）
const handleCommand = (command, targetComment) => {
  if (command === 'report') {
    emit('report', targetComment.id)
  } else if (command === 'delete') {
    ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    }).then(async () => {
      try {
        const res = await request.post('/comment/delete', { comment_id: targetComment.id })
        if (res.code === 200) {
          ElMessage.success('删除成功')
          emit('refresh') // 删除后通知父组件重新拉取列表
        }
      } catch (error) { console.error('删除评论失败', error) }
    }).catch(() => {})
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.replace('T', ' ')
}
</script>

<template>
  <div class="comment-item-container">

    <div class="root-comment">
      <el-avatar class="user-avatar" :size="40" :src="comment.user_avatar_url || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
      <div class="comment-main">
        <div class="user-info">
          <span class="username">{{ comment.user_name }}</span>
          <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, comment)">
            <span class="more-action-btn"><el-icon><MoreFilled /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="comment.user_id === userStore.userInfo?.id" command="delete" class="text-danger">删除评论</el-dropdown-item>
                <el-dropdown-item v-else command="report">举报评论</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="content">{{ comment.content }}</div>
        <div class="comment-footer">
          <span class="time">{{ formatTime(comment.create_time) }}</span>
          <div class="actions">
            <div class="action-btn" :class="{ 'is-active': comment.my_vote === 1 }" @click="handleVote(1, comment)">
              <el-icon><CaretTop /></el-icon> {{ comment.upvote_count > 0 ? comment.upvote_count : '点赞' }}
            </div>
            <div class="action-btn" :class="{ 'is-active': comment.my_vote === -1 }" @click="handleVote(-1, comment)">
              <el-icon><CaretBottom /></el-icon> 踩
            </div>
            <div class="action-btn" @click="openReply(comment, false)">
              <el-icon><ChatDotRound /></el-icon> 回复
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="sub-comments-wrapper" v-if="comment.children && comment.children.length > 0">
      <div class="sub-comment" v-for="child in comment.children" :key="child.id">
        <el-avatar class="user-avatar" :size="24" :src="child.user_avatar_url || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
        <div class="comment-main">
          <div class="user-info sub-user-info">
            <div class="sub-user-left">
              <span class="username">{{ child.user_name }}</span>
              <span class="time">{{ formatTime(child.create_time) }}</span>
            </div>
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, child)">
              <span class="more-action-btn"><el-icon><MoreFilled /></el-icon></span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="child.user_id === userStore.userInfo?.id" command="delete" class="text-danger">删除评论</el-dropdown-item>
                  <el-dropdown-item v-else command="report">举报评论</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="content">
            <template v-if="child.reply_to_user_id">
              回复 <router-link :to="{ name: 'profile', params: { id: child.reply_to_user_id } }" class="at-link">@{{ child.reply_to_user_name }}</router-link>：
            </template>
            <span>{{ child.content }}</span>
          </div>
          <div class="comment-footer sub-footer">
            <div class="actions">
              <div class="action-btn" :class="{ 'is-active': child.my_vote === 1 }" @click="handleVote(1, child)">
                <el-icon><CaretTop /></el-icon> {{ child.upvote_count > 0 ? child.upvote_count : '' }}
              </div>
              <div class="action-btn" :class="{ 'is-active': child.my_vote === -1 }" @click="handleVote(-1, child)">
                <el-icon><CaretBottom /></el-icon>
              </div>
              <div class="action-btn" @click="openReply(child, true)">回复</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="inline-reply-box" v-if="showReplyBox">
      <el-input v-model="replyContent" type="textarea" :rows="2" :placeholder="isReplyingSub ? `回复 @${currentTarget.user_name}` : '写下你的回复...'" maxlength="1000" show-word-limit />
      <div class="reply-actions">
        <el-button size="small" @click="cancelReply">取消</el-button>
        <el-button type="primary" size="small" @click="submitReply">发送</el-button>
      </div>
    </div>

    <el-divider border-style="dashed" />
  </div>
</template>

<style scoped>
.comment-item-container { margin-bottom: 20px; }
.root-comment, .sub-comment { display: flex; gap: 16px; }
.sub-comment { margin-top: 16px; gap: 12px; }
.comment-main { flex: 1; min-width: 0; }

/* 用户信息栏横向两端对齐，以防 ... 按钮跑偏 */
.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.sub-user-info {
  margin-bottom: 4px;
}
.sub-user-left {
  display: flex; align-items: center; gap: 12px;
}

.more-action-btn { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; color: var(--book-hover-color); cursor: pointer; transition: background 0.2s; }
.more-action-btn:hover { background-color: var(--book-bg-color); color: var(--book-text-color); }
.text-danger { color: #f56c6c !important; }

.username { font-weight: bold; font-size: 14px; color: var(--book-text-color); }
.content { font-size: 15px; line-height: 1.6; color: var(--book-text-color); margin-bottom: 10px; word-wrap: break-word; }
.at-link { color: var(--book-link-color); text-decoration: none; font-weight: 500; margin-right: 4px; }
.at-link:hover { text-decoration: underline; }
.comment-footer { display: flex; align-items: center; gap: 20px; }
.time { font-size: 12px; color: var(--book-hover-color); }
.actions { display: flex; align-items: center; gap: 16px; }
.action-btn { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--book-hover-color); cursor: pointer; transition: color 0.2s; }
.action-btn:hover { color: var(--book-link-color); }
.action-btn.is-active { color: var(--book-link-color); }
.sub-comments-wrapper { margin-left: 56px; background-color: var(--el-fill-color-light); border-radius: 8px; padding: 16px; margin-top: 12px; }
.sub-footer { gap: 16px; }
.inline-reply-box { margin-left: 56px; margin-top: 16px; background-color: var(--book-topbar-bg); padding: 12px; border-radius: 8px; border: 1px solid var(--book-border-color); }
.reply-actions { display: flex; justify-content: flex-end; margin-top: 10px; gap: 10px; }
</style>