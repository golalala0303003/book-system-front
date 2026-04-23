<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Promotion, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request.js'

// 引入 WangEditor
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

const router = useRouter()
const route = useRoute()

// ================= 表单与状态数据 =================
const postForm = reactive({
  board_id: null,
  title: '',
  content: '',
  cover_image: null, // 仅靠这一个字段即可控制封面UI的所有状态
  book_id: null
})

const selectedBoardName = ref('')
const selectedBookTitle = ref('')
const favoriteBoards = ref([])

// ================= WangEditor 配置 =================
const editorRef = shallowRef()
const mode = 'default'

const toolbarConfig = {
  excludeKeys: [
    'group-video',
    'insertVideo',
    'uploadVideo',
    'codeBlock',
    'fullScreen',
    'emotion'
  ]
}

const editorConfig = {
  placeholder: '写下精彩的内容...',
  autoFocus: false,
  MENU_CONF: {
    uploadImage: {
      async customUpload(file, insertFn) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'post')

        try {
          const res = await request.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          if (res.code === 200 && res.data) {
            insertFn(res.data)
          } else {
            ElMessage.error(res.message || '图片上传失败')
          }
        } catch (error) {
          console.error('富文本图片上传异常:', error)
          ElMessage.error('图片上传异常')
        }
      }
    }
  }
}

const handleCreated = (editor) => {
  editorRef.value = editor
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

// ================= 核心交互逻辑 =================

// 板块联想查询
const queryBoardSuggest = async (queryString, cb) => {
  if (!queryString) return cb([])
  try {
    const res = await request.post('/board/suggest', null, { params: { key_word: queryString, limit: 5 } })
    cb(res.code === 200 ? res.data.map(i => ({ ...i, value: i.name })) : [])
  } catch (e) { cb([]) }
}

const handleBoardSelect = (item) => {
  postForm.board_id = item.id
  selectedBoardName.value = item.name
}

// 获取收藏板块
const fetchFavoriteBoards = async () => {
  try {
    const res = await request.get('/board/favorite_list', { params: { limit: 10 } })
    if (res.code === 200) favoriteBoards.value = res.data || []
  } catch (e) { console.error(e) }
}

const handleFavoriteBoardChange = (boardId) => {
  const target = favoriteBoards.value.find(b => b.id === boardId)
  if (target) {
    postForm.board_id = target.id
    selectedBoardName.value = target.name
  }
}

// 书籍联想查询
const queryBookSuggest = async (queryString, cb) => {
  if (!queryString) {
    cb([])
    return
  }
  try {
    const res = await request.get('/book/suggest', {
      params: { key_word: queryString, limit: 5 }
    })
    if (res.code === 200 && res.data) {
      const formatData = res.data.map(item => ({
        ...item,
        value: item.title
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

const handleBookSelect = (item) => {
  postForm.book_id = item.id
  selectedBookTitle.value = item.value
}

// ================= 封面图片处理 (Plan A 自定义渲染) =================

const handleCoverUpload = async (options) => {
  const formData = new FormData()
  formData.append('file', options.file)
  formData.append('folder', 'post')
  try {
    const res = await request.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.code === 200) {
      postForm.cover_image = res.data
      options.onSuccess(res.data)
      ElMessage.success('封面上传成功')
    } else { throw new Error() }
  } catch (e) {
    options.onError(e)
    ElMessage.error('封面上传失败')
  }
}

// 手动删除封面
const handleRemoveCover = () => {
  postForm.cover_image = null
}

// ================= 发布提交 =================

const submitPost = async () => {
  const editor = editorRef.value
  const isEmpty = editor ? editor.isEmpty() : true
  const textContent = editor ? editor.getText() : ''
  if (!postForm.board_id) return ElMessage.warning('请选择所属板块')
  if (!postForm.title.trim()) return ElMessage.warning('请输入帖子标题')
  if (isEmpty && !textContent.trim()) return ElMessage.warning('请输入帖子正文内容')

  try {
    const res = await request.post('/post/create', postForm)
    if (res.code === 200) {
      ElMessage.success('发布成功')
      router.push('/')
    }
  } catch (e) { console.error(e) }
}

onMounted(() => {
  fetchFavoriteBoards()
  const queryBookId = route.query.book_id
  const queryBookTitle = route.query.book_title

  if (queryBookId) {
    postForm.book_id = Number(queryBookId)
    selectedBookTitle.value = queryBookTitle || '已选择书籍'
  }
})
</script>

<template>
  <div class="publish-container">
    <div class="publish-card">
      <div class="header-section">
        <h2 class="page-title">撰写新帖子</h2>
      </div>

      <div class="form-row split-row">
        <div class="form-item main-select">
          <div class="label">所属板块</div>
          <div v-if="postForm.board_id" class="selected-tag-container">
            <el-tag closable size="large" @close="postForm.board_id = null; selectedBoardName = ''">
              {{ selectedBoardName }}
            </el-tag>
          </div>
          <el-autocomplete
              v-else
              v-model="selectedBoardName"
              :fetch-suggestions="queryBoardSuggest"
              placeholder="搜索板块..."
              @select="handleBoardSelect"
              class="w-full"
          />
        </div>
        <div class="form-item sub-select">
          <div class="label">快捷选取</div>
          <el-select
              placeholder="收藏的板块"
              class="w-full custom-round-select"
              @change="handleFavoriteBoardChange"
              v-model="postForm.board_id"
          >
            <el-option v-for="b in favoriteBoards" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </div>
      </div>

      <div class="form-row">
        <div class="label">标题</div>
        <el-input
            v-model="postForm.title"
            placeholder="请输入精彩的标题..."
            size="large"
            maxlength="100"
            show-word-limit
        />
      </div>

      <div class="form-row split-row">
        <div class="form-item main-select">
          <div class="label">关联书籍 (可选)</div>
          <div v-if="postForm.book_id" class="selected-tag-container">
            <el-tag closable type="info" size="large" @close="postForm.book_id = null; selectedBookTitle = ''">
              {{ selectedBookTitle }}
            </el-tag>
          </div>
          <el-autocomplete
              v-else
              v-model="selectedBookTitle"
              :fetch-suggestions="queryBookSuggest"
              placeholder="搜索关联书籍..."
              @select="handleBookSelect"
              class="w-full"
              :trigger-on-focus="false"
              clearable
          >
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

        <div class="form-item sub-select">
          <div class="label">封面图片 (可选)</div>
          <div class="custom-cover-uploader">

            <div v-if="postForm.cover_image" class="cover-preview-box">
              <el-image
                  class="uploaded-cover"
                  :src="postForm.cover_image"
                  :preview-src-list="[postForm.cover_image]"
                  fit="cover"
                  hide-on-click-modal
              />
              <div class="delete-btn" @click.stop="handleRemoveCover" title="移除封面">
                <el-icon><Delete /></el-icon>
              </div>
            </div>

            <el-upload
                v-else
                class="cover-uploader"
                :show-file-list="false"
                :http-request="handleCoverUpload"
                accept="image/*"
            >
              <div class="upload-trigger">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <div class="upload-text">点击上传</div>
              </div>
            </el-upload>

          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="label">正文内容</div>
        <div class="editor-outer-box">
          <Toolbar
              class="editor-toolbar"
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              :mode="mode"
          />
          <Editor
              class="editor-content-area"
              v-model="postForm.content"
              :defaultConfig="editorConfig"
              :mode="mode"
              @onCreated="handleCreated"
          />
        </div>
      </div>

      <div class="action-bar">
        <el-button type="primary" size="large" @click="submitPost" class="submit-btn">
          <el-icon><Promotion /></el-icon> 立即发布
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ================= 页面基础布局 ================= */
.publish-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  background-color: var(--book-bg-color);
  min-height: 100vh;
}

.publish-card {
  width: 100%;
  max-width: 950px;
  background-color: var(--book-topbar-bg);
  border-radius: 12px;
  border: 1px solid var(--book-border-color);
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 30px 0;
  color: var(--book-text-color);
}

.form-row { margin-bottom: 25px; }
.split-row { display: flex; gap: 30px; }
.main-select { flex: 2; }
.sub-select { flex: 1; }
.label { font-size: 14px; font-weight: 600; margin-bottom: 10px; color: var(--book-text-color); }
.w-full { width: 100%; }

.selected-tag-container {
  height: 40px;
  display: flex;
  align-items: center;
}

.custom-round-select :deep(.el-input__wrapper) {
  border-radius: 20px;
}

/* ================= 全新：自定义封面上传样式 ================= */
.custom-cover-uploader {
  width: 120px; /* 控制封面的宽高，这里设为120px */
  height: 120px;
}

/* 已上传预览框 */
.cover-preview-box {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  border: 1px solid var(--book-border-color);
  overflow: hidden;
  background-color: var(--el-fill-color-light);
}

.uploaded-cover {
  width: 100%;
  height: 100%;
  display: block;
}

/* 悬浮在右上角的删除按钮 */
.delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.delete-btn:hover {
  background-color: #f56c6c; /* Element 默认的红色危险色 */
  transform: scale(1.1);
}

/* 未上传触发框 */
.cover-uploader {
  width: 100%;
  height: 100%;
}

.cover-uploader :deep(.el-upload) {
  width: 100%;
  height: 100%;
  border: 1px dashed var(--book-border-color);
  border-radius: 8px;
  background-color: var(--el-fill-color-light);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: border-color 0.3s;
}

.cover-uploader :deep(.el-upload:hover) {
  border-color: var(--book-link-color);
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--book-hover-color);
}

.upload-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 12px;
}

/* ================= 书籍联想展示样式 ================= */
.suggest-item {
  display: flex;
  align-items: center;
  padding: 4px 0;
  gap: 12px;
}

.suggest-cover {
  width: 35px;
  height: 48px;
  border-radius: 4px;
  flex-shrink: 0;
}

.suggest-cover-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
  font-size: 10px;
}

.suggest-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.suggest-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--book-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggest-author {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

/* ================= 编辑器核心样式 ================= */
.editor-outer-box {
  border: 1px solid var(--book-border-color);
  border-radius: 8px;
  overflow: visible;
  background-color: var(--book-topbar-bg);
  margin-top: 5px;
  --w-e-toolbar-bg-color: var(--book-topbar-bg);
  --w-e-toolbar-color: var(--book-text-color);
  --w-e-toolbar-active-bg-color: var(--el-fill-color-light);
  --w-e-toolbar-active-color: var(--book-link-color);
  --w-e-toolbar-border-color: var(--book-border-color);
  --w-e-textarea-bg-color: var(--book-topbar-bg);
  --w-e-textarea-color: var(--book-text-color);
  --w-e-textarea-border-color: var(--book-border-color);
  --w-e-textarea-handler-bg-color: var(--book-link-color);
  --w-e-textarea-sls-color: var(--el-text-color-placeholder);
}

.editor-toolbar { border-bottom: 1px solid var(--book-border-color); }

.editor-content-area {
  min-height: 400px;
  height: auto !important;
}

:deep(.w-e-text-container) {
  height: auto !important;
  min-height: 400px;
  background-color: transparent !important;
  border: none !important;
}

:deep(.w-e-scroll) { overflow-y: visible !important; }
:deep(.w-e-text-placeholder) { top: 20px; }

:deep(.w-e-select-list) {
  background-color: var(--book-topbar-bg);
  color: var(--book-text-color);
  border: 1px solid var(--book-border-color);
}
:deep(.w-e-select-list ul li:hover) { background-color: var(--el-fill-color-light); }

.action-bar { margin-top: 40px; display: flex; justify-content: flex-end; }
.submit-btn { padding: 0 40px; font-weight: bold; }
</style>