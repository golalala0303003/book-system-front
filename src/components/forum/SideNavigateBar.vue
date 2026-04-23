<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user' // 新增：引入 userStore 用于鉴权
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, House, Compass, Plus, EditPen, Picture as IconPicture } from '@element-plus/icons-vue'
import request from '@/utils/request.js'
import { watch } from 'vue'
import { refreshFavBoardTrigger } from '@/utils/eventBus.js'

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle'])
const router = useRouter()
const route = useRoute()
const userStore = useUserStore() // 实例化

// 真实数据源
const collectedBoards = ref([])
const recommendBoards = ref([])

// 默认展开的折叠面板
const defaultOpeneds = ref(['collected', 'recommend'])

const fetchBoardData = async () => {
  try {
    const [favRes, listRes] = await Promise.all([
      request.get('/board/favorite_list', { params: { limit: 10 } }),
      request.get('/board/list', { params: { limit: 10 } })
    ])

    if (favRes.code === 200) collectedBoards.value = favRes.data || []
    if (listRes.code === 200) recommendBoards.value = listRes.data || []
  } catch (error) {
    console.error('获取板块列表失败', error)
  }
}

onMounted(() => {
  fetchBoardData()
})

watch(refreshFavBoardTrigger, () => {
  fetchBoardData()
})

// 智能高亮逻辑
const activeMenu = computed(() => {
  if (route.name === 'forumHome') return 'home'
  if (route.params.id) return String(route.params.id)
  return ''
})

// ===================== 新增：创建板块逻辑 =====================

const createDialogVisible = ref(false)
const createLoading = ref(false)

const createForm = reactive({
  name: '',
  description: '',
  cover_url: ''
})

// 点击菜单项的核心跳转与鉴权逻辑
const handleSelect = (index) => {
  if (index === 'home') {
    router.push({ name: 'forumHome' })
  }
  else if (index === 'create_board') {
    // 【核心逻辑】：权限校验
    if (!userStore.isLogin) {
      ElMessage.warning("请先登录后再创建板块")
      router.push({ name: 'login' })
      return
    }
    // 已登录，打开弹窗
    createDialogVisible.value = true
  }
  else if (index !== 'collected' && index !== 'recommend' && index !== 'empty') {
    router.push({ name: 'forumBoard', params: { id: index } })
  }
}

// 处理图片上传
const handleCoverUpload = async (options) => {
  const file = options.file
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', 'boards') // 存到 boards 文件夹

  try {
    const res = await request.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    createForm.cover_url = res.data
    ElMessage.success("封面上传成功")
    options.onSuccess()
  } catch (error) {
    options.onError()
  }
}

const beforeCoverUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) ElMessage.error('只能上传图片文件!')
  if (!isLt5M) ElMessage.error('封面大小不能超过 5MB!')
  return isImage && isLt5M
}

// 提交创建
const submitCreateBoard = async () => {
  if (!createForm.name.trim()) {
    ElMessage.warning("板块名称不能为空")
    return
  }

  createLoading.value = true
  try {
    const res = await request.post('/board/create', createForm)
    if (res.code === 200) {
      ElMessage.success("板块创建成功！")
      createDialogVisible.value = false
      // 清空表单
      createForm.name = ''
      createForm.description = ''
      createForm.cover_url = ''
      // 【关键】：刷新侧边栏数据，展示新板块
      await fetchBoardData()
    }
  } catch (error) {
    console.error("创建板块失败", error)
  } finally {
    createLoading.value = false
  }
}

// ==========================================================

// 底部发帖按钮点击事件
const goToPublish = () => {
  router.push({ name: 'postPublish' })
}
</script>

<template>
  <div class="side-nav-wrapper" :class="{ 'is-collapsed': isCollapsed }">

    <div class="nav-inner">
      <el-menu
          :default-active="activeMenu"
          :default-openeds="defaultOpeneds"
          class="custom-el-menu"
          @select="handleSelect"
          background-color="transparent"
          text-color="var(--book-text-color)"
          active-text-color="var(--book-link-color)"
          :collapse-transition="false"
      >
        <div class="top-nav-section">
          <el-menu-item index="home">
            <el-icon><House /></el-icon>
            <template #title><span class="top-nav-text">首页</span></template>
          </el-menu-item>

          <el-menu-item index="create_board">
            <el-icon><Plus /></el-icon>
            <template #title><span class="top-nav-text">创建一个新的板块</span></template>
          </el-menu-item>
        </div>

        <div class="menu-divider"></div>

        <el-sub-menu index="collected">
          <template #title>
            <span class="section-title">您收藏的板块</span>
          </template>
          <el-menu-item v-for="board in collectedBoards" :key="board.id" :index="String(board.id)">
            <div class="board-item-content">
              <img v-if="board.cover_url" :src="board.cover_url" class="board-icon" />
              <div v-else class="board-icon fallback-icon">{{ board.name.charAt(0) }}</div>
              <span class="board-name" :title="board.name">{{ board.name }}</span>
            </div>
          </el-menu-item>
          <el-menu-item v-if="collectedBoards.length === 0" disabled index="empty">
            <div class="board-item-content"><span class="board-name empty-text">暂无收藏</span></div>
          </el-menu-item>
        </el-sub-menu>

        <div class="menu-divider"></div>

        <el-sub-menu index="recommend">
          <template #title>
            <span class="section-title">感兴趣的板块</span>
          </template>
          <el-menu-item v-for="board in recommendBoards" :key="board.id" :index="String(board.id)">
            <div class="board-item-content">
              <img v-if="board.cover_url" :src="board.cover_url" class="board-icon" />
              <div v-else class="board-icon fallback-icon">{{ board.name.charAt(0) }}</div>
              <span class="board-name" :title="board.name">{{ board.name }}</span>
            </div>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>

      <div class="nav-bottom-action">
        <el-button type="primary" class="post-btn" @click="goToPublish">
          <el-icon class="post-icon"><EditPen /></el-icon>
          发布新帖
        </el-button>
      </div>
    </div>

    <div class="toggle-btn" @click="emit('toggle')">
      <el-icon v-if="!isCollapsed"><ArrowLeft /></el-icon>
      <el-icon v-else><ArrowRight /></el-icon>
    </div>

    <el-dialog
        v-model="createDialogVisible"
        title="创建新板块"
        width="500px"
        append-to-body
        class="board-dialog"
    >
      <el-form :model="createForm" label-width="80px" label-position="top">

        <el-form-item label="板块名称" required>
          <el-input
              v-model="createForm.name"
              maxlength="50"
              show-word-limit
              placeholder="给板块起个响亮的名字（必填）"
              class="custom-input"
          />
        </el-form-item>

        <el-form-item label="板块简介">
          <el-input
              v-model="createForm.description"
              type="textarea"
              :rows="3"
              maxlength="255"
              show-word-limit
              placeholder="简单描述一下这个板块的主题..."
              class="custom-input"
          />
        </el-form-item>

        <el-form-item label="板块封面 (可选)">
          <el-upload
              class="cover-uploader"
              action=""
              :http-request="handleCoverUpload"
              :show-file-list="false"
              :before-upload="beforeCoverUpload"
          >
            <img v-if="createForm.cover_url" :src="createForm.cover_url" class="uploaded-cover" />
            <div v-else class="upload-placeholder">
              <el-icon class="upload-icon"><IconPicture /></el-icon>
              <span>点击上传封面</span>
            </div>
          </el-upload>
        </el-form-item>

      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="createLoading" @click="submitCreateBoard">
            确认创建
          </el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<style scoped>
/* =========== 原有样式保留 =========== */
.side-nav-wrapper {
  position: sticky;
  top: 90px;
  height: calc(100vh - 120px);
  display: flex;
  z-index: 100;
}

.nav-inner {
  width: 240px;
  height: 100%;
  background-color: var(--book-topbar-bg);
  border-right: 1px solid var(--book-border-color);
  border-top: 1px solid var(--book-border-color);
  border-bottom: 1px solid var(--book-border-color);
  border-radius: 0 8px 8px 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.side-nav-wrapper.is-collapsed .nav-inner { width: 0; border-right: none; }

.custom-el-menu {
  flex: 1; border-right: none; width: 240px !important; min-width: 240px;
  overflow-y: auto; scrollbar-width: none;
}
.custom-el-menu::-webkit-scrollbar { display: none; }

.top-nav-section { padding-top: 8px; }
.top-nav-text { font-size: 14px; font-weight: 500; }
.top-nav-section .el-icon { font-size: 18px; margin-right: 12px; }

.custom-el-menu :deep(.el-sub-menu__title) { height: 40px !important; line-height: 40px !important; padding-left: 14px !important; }
.section-title { font-size: 12px; font-weight: 600; color: var(--book-hover-color); text-transform: uppercase; letter-spacing: 0.5px; }

.custom-el-menu :deep(.el-menu-item) { height: 44px; line-height: 44px; padding-left: 20px !important; border-radius: 6px; margin: 2px 8px; }
.custom-el-menu :deep(.el-menu-item:hover) { background-color: var(--el-fill-color-light); }

.board-item-content { display: flex; align-items: center; gap: 12px; width: 100%; }
.board-icon { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.fallback-icon { background-color: var(--book-border-color); color: var(--book-text-color); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
.board-name { flex: 1; font-size: 14px; color: var(--book-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty-text { color: var(--book-hover-color); }
.custom-el-menu :deep(.el-menu-item.is-active) { background-color: var(--el-fill-color-light); }
.custom-el-menu :deep(.el-menu-item.is-active .board-name), .custom-el-menu :deep(.el-menu-item.is-active .top-nav-text) { color: var(--book-link-color); font-weight: bold; }

.menu-divider { height: 1px; background-color: var(--book-border-color); margin: 10px 20px; }

.nav-bottom-action { padding: 16px; border-top: 1px solid var(--book-border-color); background-color: var(--book-topbar-bg); flex-shrink: 0; width: 240px; box-sizing: border-box; }
.post-btn { width: 100%; border-radius: 20px; height: 40px; font-size: 15px; font-weight: bold; }
.post-icon { margin-right: 6px; font-size: 16px; }

.toggle-btn { position: absolute; right: -14px; top: 50%; transform: translateY(-50%); width: 28px; height: 50px; background-color: var(--book-topbar-bg); border: 1px solid var(--book-border-color); border-radius: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--book-hover-color); box-shadow: 2px 0 6px rgba(0,0,0,0.05); transition: all 0.3s; }
.toggle-btn:hover { color: var(--book-link-color); }
.is-collapsed .toggle-btn { right: -28px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

/* =========== 新增：弹窗内部表单样式 =========== */
.board-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
  padding-bottom: 10px;
}

/* 输入框高亮特效复用 */
.custom-input :deep(.el-input__wrapper),
.custom-input :deep(.el-textarea__inner) {
  background-color: var(--el-fill-color-light);
  box-shadow: 0 0 0 1px transparent inset;
  transition: all 0.3s;
}
.custom-input :deep(.el-input__wrapper:focus-within),
.custom-input :deep(.el-textarea__inner:focus) {
  background-color: var(--el-input-bg-color);
  box-shadow: 0 0 0 1px var(--book-link-color) inset;
}

/* 封面上传框样式 (横向圆角矩形，适合做背景图/封面图的预览) */
.cover-uploader {
  width: 100%;
}
.cover-uploader :deep(.el-upload) {
  width: 100%;
  border: 1px dashed var(--book-border-color);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
  background-color: var(--el-fill-color-light);
}
.cover-uploader :deep(.el-upload:hover) {
  border-color: var(--book-link-color);
}
.upload-placeholder {
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--book-hover-color);
  font-size: 14px;
}
.upload-icon {
  font-size: 28px;
  margin-bottom: 8px;
}
.uploaded-cover {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}
</style>