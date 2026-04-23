<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request.js'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const uploadLoading = ref(false)
const formRef = ref(null)

// 表单数据
const postForm = reactive({
  post_id: null,
  title: '',
  content: '',
  cover_image: ''
})

const rules = {
  title: [
    { required: true, message: '请输入帖子标题', trigger: 'blur' },
    { max: 100, message: '标题不能超过100个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入正文内容', trigger: 'blur' }
  ]
}

// 1. 初始化：获取当前帖子详情进行回显
const fetchPostDetail = async () => {
  const postId = route.params.id
  if (!postId) return

  loading.value = true
  try {
    // 借用详情接口，不增加浏览量
    const res = await request.get(`/post/detail/${postId}`, {
      params: { record_view: false }
    })
    if (res.code === 200 && res.data) {
      postForm.post_id = res.data.id
      postForm.title = res.data.title
      postForm.content = res.data.content
      postForm.cover_image = res.data.cover_image || ''
    }
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    ElMessage.error('获取帖子详情失败')
  } finally {
    loading.value = false
  }
}

// 2. 封面上传逻辑 (复用通用上传接口)
const handleUploadCover = async (options) => {
  const formData = new FormData()
  formData.append('file', options.file)
  formData.append('folder', 'posts') // 存入 OSS 的 posts 文件夹

  uploadLoading.value = true
  try {
    const res = await request.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.code === 200 && res.data) {
      postForm.cover_image = res.data
      options.onSuccess(res)
      ElMessage.success('封面更新成功')
    } else {
      throw new Error(res.message || '上传失败')
    }
  } catch (error) {
    options.onError(error)
    ElMessage.error('上传失败，请重试')
  } finally {
    uploadLoading.value = false
  }
}

// 3. 提交更新
const submitUpdate = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const payload = {
          post_id: postForm.post_id,
          title: postForm.title,
          content: postForm.content,
          cover_image: postForm.cover_image || null // 如果前端删除了图片，传 null
        }

        const res = await request.post('/post/update', payload)
        if (res.code === 200) {
          ElMessage.success('帖子修改成功')
          // 修改成功后，跳回该帖子的详情页
          router.push({ name: 'postDetail', params: { id: postForm.post_id } })
        }
      } catch (error) {
        console.error('帖子更新失败', error)
      }
    }
  })
}

const cancelEdit = () => {
  // 取消编辑，退回上一页
  router.back()
}

onMounted(() => {
  fetchPostDetail()
})
</script>

<template>
  <div class="edit-post-container" v-loading="loading">
    <el-card shadow="never" class="edit-card">
      <template #header>
        <div class="card-header">
          <h2>编辑帖子</h2>
        </div>
      </template>

      <el-form
          :model="postForm"
          :rules="rules"
          ref="formRef"
          label-position="top"
      >
        <el-form-item label="帖子标题" prop="title">
          <el-input
              v-model="postForm.title"
              placeholder="请输入吸引人的标题..."
              maxlength="100"
              show-word-limit
              class="title-input"
          />
        </el-form-item>

        <el-form-item label="封面图片 (可选)" prop="cover_image">
          <el-upload
              class="cover-uploader"
              action="#"
              :show-file-list="false"
              :http-request="handleUploadCover"
              accept="image/*"
              v-loading="uploadLoading"
          >
            <img v-if="postForm.cover_image" :src="postForm.cover_image" class="uploaded-cover" />
            <el-icon v-else class="uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议上传高质量图片作为帖子门面，支持 JPG/PNG</div>
        </el-form-item>

        <el-form-item label="正文内容" prop="content">
          <el-input
              v-model="postForm.content"
              type="textarea"
              :rows="15"
              placeholder="分享你的见解、书评或读书笔记..."
          />
        </el-form-item>

        <div class="form-actions">
          <el-button @click="cancelEdit">放弃修改</el-button>
          <el-button type="primary" @click="submitUpdate" class="submit-btn">保存修改</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.edit-post-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
}

.edit-card {
  background-color: var(--book-topbar-bg);
  border: 1px solid var(--book-border-color);
  border-radius: 8px;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--book-text-color);
}

.title-input :deep(.el-input__inner) {
  font-size: 16px;
  font-weight: bold;
}

/* 封面上传样式 */
.cover-uploader {
  border: 1px dashed var(--book-border-color);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
  background-color: var(--book-bg-color);
  display: inline-block;
}

.cover-uploader:hover {
  border-color: var(--book-link-color);
}

.uploader-icon {
  font-size: 28px;
  color: var(--book-hover-color);
  width: 240px;
  height: 135px; /* 16:9 比例 */
  text-align: center;
  line-height: 135px;
}

.uploaded-cover {
  width: 240px;
  height: 135px;
  display: block;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: var(--book-hover-color);
  margin-top: 8px;
}

/* 底部按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--book-border-color);
}

.submit-btn {
  padding: 0 30px;
}
</style>