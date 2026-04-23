<script setup>
import { ref, nextTick } from 'vue'
import { fetchSSE } from '@/utils/sseFetch'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'

// 初始化 Markdown 解析器
// 注意：之前我们约定过把 html 改为 true，以防止大模型的个别排版符号乱码
const md = new MarkdownIt({
  breaks: true,
  html: true,
  linkify: true
})

const props = defineProps({
  targetType: {
    type: String,
    default: 'book' // 'book' 或 'post'
  },
  targetId: {
    type: [Number, String],
    required: true
  }
})

const dialogVisible = ref(false)
const isGenerating = ref(false)
const userInput = ref('')
const messages = ref([])
const scrollbarRef = ref(null)

// 新增：用于中断请求的控制器
let currentAbortController = null

// 自动滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (scrollbarRef.value) {
    const wrap = scrollbarRef.value.wrapRef
    if (wrap) {
      wrap.scrollTop = wrap.scrollHeight
    }
  }
}

const openDialog = () => {
  dialogVisible.value = true
  scrollToBottom()
}

// 渲染 Markdown
const renderMarkdown = (text) => {
  if (!text) return ''
  return md.render(text)
}

const sendMessage = async () => {
  const text = userInput.value.trim()
  if (!text || isGenerating.value) return

  messages.value.push({ role: 'user', content: text })
  userInput.value = ''

  messages.value.push({ role: 'assistant', content: '' })
  const aiMsgIndex = messages.value.length - 1
  isGenerating.value = true
  scrollToBottom()

  const url = props.targetType === 'book' ? '/ai/chat/book' : '/ai/chat/post'
  const body = {
    book_id: Number(props.targetId),
    messages: messages.value.slice(0, -1),
    enable_search: false
  }

  // 新增：如果用户在生成时强行再次触发（虽然按钮被 disabled，但为了代码健壮性），中断上一个
  if (currentAbortController) {
    currentAbortController.abort()
  }
  currentAbortController = new AbortController()

  // 核心修复：适配新的 fetchSSE 入参格式 options = { method, bodyData, signal }
  await fetchSSE(
      url,
      {
        method: 'POST',
        bodyData: body,
        signal: currentAbortController.signal
      },
      {
        onMessage: (chunk) => {
          messages.value[aiMsgIndex].content += chunk
          scrollToBottom()
        },
        onError: (err) => {
          isGenerating.value = false
          // 忽略主动中断带来的报错
          if (err.name !== 'AbortError') {
            ElMessage.error(err.message || 'AI 响应出错')
          }
        },
        onComplete: () => {
          isGenerating.value = false
        }
      })
}
</script>

<template>
  <div class="ai-card-container">
    <el-card shadow="hover" class="trigger-card">
      <div class="trigger-header">
        <span class="sparkle-icon">✨</span>
        <span class="title">AI 书籍科普</span>
      </div>
      <p class="description">对于书籍不太了解？让 AI 为你解惑。</p>
      <el-button type="primary" class="action-btn" @click="openDialog">
        开启 AI 智能辅助
      </el-button>
    </el-card>

    <el-dialog
        v-model="dialogVisible"
        title="AI 智能伴读"
        width="800px"
        append-to-body
        :close-on-click-modal="false"
        custom-class="ai-chat-dialog"
    >
      <div class="chat-window">
        <el-scrollbar ref="scrollbarRef" class="message-list">
          <div v-if="messages.length === 0" class="welcome-box">
            <p>你好！我是图书智能助手。你可以问我关于这本书的背景、核心观点或相关评价。</p>
          </div>

          <div
              v-for="(msg, index) in messages"
              :key="index"
              :class="[
              'message-item',
              msg.role,
              { 'is-generating': isGenerating && index === messages.length - 1 && msg.role === 'assistant' }
            ]"
          >
            <div class="avatar">
              {{ msg.role === 'user' ? 'ME' : 'AI' }}
            </div>

            <div v-if="msg.role === 'user'" class="content-bubble">
              {{ msg.content }}
            </div>

            <div
                v-else
                class="content-bubble markdown-body"
                v-html="renderMarkdown(msg.content)"
            ></div>
          </div>
        </el-scrollbar>

        <div class="input-section">
          <el-input
              v-model="userInput"
              type="textarea"
              :rows="3"
              placeholder="输入您的问题 (Enter 发送)"
              resize="none"
              @keydown.enter.prevent="sendMessage"
              :disabled="isGenerating"
          />
          <div class="input-footer">
            <span class="tip">Shift + Enter 换行</span>
            <el-button type="primary" :loading="isGenerating" @click="sendMessage">发送</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
/* --- 卡片与布局样式 (保持不变) --- */
.trigger-card {
  margin-bottom: 20px;
  border: 1px solid var(--book-border-color);
  background-color: var(--book-topbar-bg);
}
.trigger-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.trigger-header .title {
  font-weight: bold;
  font-size: 16px;
  color: var(--book-text-color);
}
.description {
  font-size: 13px;
  color: var(--book-hover-color);
  margin-bottom: 15px;
}
.action-btn {
  width: 100%;
}

/* --- 弹窗与对话样式 --- */
.chat-window {
  display: flex;
  flex-direction: column;
  height: 65vh; /* 高度从固定的 500px 改为视口高度的 65%，更大气 */
  min-height: 500px;
  background-color: var(--book-bg-color);
  border-radius: 8px;
  padding: 15px;
}
.message-list {
  flex: 1;
  padding-right: 10px;
}
.welcome-box {
  text-align: center;
  color: var(--book-hover-color);
  padding: 40px 20px;
  font-size: 14px;
}
.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.message-item.user {
  flex-direction: row-reverse;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--book-border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}
.user .avatar {
  background-color: var(--book-link-color);
  color: white;
}
.content-bubble {
  max-width: 85%; /* 放宽了最大宽度 */
  padding: 12px 18px;
  border-radius: 12px;
  font-size: 15px; /* 字号略微调大 */
  line-height: 1.6;
  word-break: break-word;
}
.assistant .content-bubble {
  background-color: var(--book-topbar-bg);
  color: var(--book-text-color);
  border: 1px solid var(--book-border-color);
}
.user .content-bubble {
  background-color: var(--book-link-color);
  color: white;
  white-space: pre-wrap; /* 用户的换行仍然使用 pre-wrap 保持 */
}

/* --- Markdown 专属基础排版样式 --- */
/* 防止 markdown-it 生成的 <p> 标签产生过大的上下边距 */
:deep(.markdown-body p) {
  margin: 0 0 10px 0;
}
:deep(.markdown-body p:last-child) {
  margin-bottom: 0;
}
:deep(.markdown-body ul), :deep(.markdown-body ol) {
  margin: 8px 0 8px 20px;
  padding: 0;
}
:deep(.markdown-body li) {
  margin-bottom: 4px;
}
:deep(.markdown-body strong) {
  font-weight: 600;
  color: var(--book-text-color);
}

/* --- 打字机光标动画 --- */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
/* 利用 CSS 伪元素挂载在最后一个块级元素之后，防止因为 html 渲染导致的换行跳动 */
:deep(.is-generating .markdown-body > *:last-child::after) {
  content: '|';
  display: inline-block;
  animation: blink 1s infinite;
  margin-left: 4px;
  font-weight: bold;
  color: var(--book-link-color);
}

.input-section {
  margin-top: 15px;
  background-color: var(--book-topbar-bg);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--book-border-color);
}
.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
.tip {
  font-size: 12px;
  color: var(--book-hover-color);
}
</style>