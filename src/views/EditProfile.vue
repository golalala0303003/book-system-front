<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

// 页面整体加载状态
const pageLoading = ref(true)
const loading = ref(false) // 提交按钮的加载状态

const form = reactive({
  username: '',
  email: '',
  phone: '',
  school: '',
  age: null,
  gender: 'unknown',
  avatar: ''
})

const fetchMyInfo = async () => {
  try {
    const res = await request.get('/user/me')
    const info = res.data

    form.username = info.username || ''
    form.email = info.email || ''
    form.phone = info.phone || ''
    form.school = info.school || ''
    form.age = info.age || null
    form.gender = info.gender || 'unknown'
    form.avatar = info.avatar || ''
  } catch (error) {
    console.error("获取个人信息失败", error)
    // 如果获取失败（比如 token 错误），可以考虑踢回登录页
  } finally {
    pageLoading.value = false
  }
}

onMounted(() => {
  fetchMyInfo()
})

// 返回主页
const goBack = () => {
  if (userStore.userInfo.id) {
    router.push({ name: 'profile', params: { id: userStore.userInfo.id } })
  } else {
    router.push('/')
  }
}

// 头像上传
const handleAvatarUpload = async (options) => {
  const file = options.file
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', 'avatars')

  try {
    const res = await request.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    form.avatar = res.data
    ElMessage.success("头像上传成功，请记得点击下方【保存修改】！")
    options.onSuccess()
  } catch (error) {
    options.onError()
  }
}

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) ElMessage.error('只能上传图片文件!')
  if (!isLt5M) ElMessage.error('头像图片大小不能超过 5MB!')
  return isImage && isLt5M
}

// 提交表单
const submitUpdate = async () => {
  loading.value = true
  try {
    const updateDTO = {}
    for (const key in form) {
      if (form[key] !== '' && form[key] !== null) {
        updateDTO[key] = form[key]
      }
    }

    const res = await request.post('/user/update', updateDTO)
    ElMessage.success("个人资料更新成功！")

    // 存入pinia
    userStore.setLoginData(userStore.token, {
      id: res.data.id,
      username: res.data.username,
      avatar: res.data.avatar
    })

    goBack()
  } catch (error) {
    console.error("更新失败", error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="settings-container" v-loading="pageLoading">
    <div class="header">
      <el-button link @click="goBack" class="back-btn">
        &lt; 返回个人主页
      </el-button>
    </div>

    <el-card shadow="never" class="settings-card" v-if="!pageLoading">
      <template #header>
        <div class="card-header">基本信息修改</div>
      </template>

      <div class="form-layout">
        <div class="left-form">
          <el-form :model="form" label-width="80px" label-position="left">
            <el-form-item label="用户名">
              <el-input v-model="form.username" class="custom-input" placeholder="请输入用户名" />
            </el-form-item>

            <el-form-item label="邮箱">
              <el-input v-model="form.email" class="custom-input" placeholder="请输入邮箱" />
            </el-form-item>

            <el-form-item label="电话">
              <el-input v-model="form.phone" class="custom-input" placeholder="请输入电话" />
            </el-form-item>

            <el-form-item label="年龄">
              <el-input-number v-model="form.age" :min="1" :max="120" placeholder="年龄" />
            </el-form-item>

            <el-form-item label="性别">
              <el-radio-group v-model="form.gender">
                <el-radio label="male">男</el-radio>
                <el-radio label="female">女</el-radio>
                <el-radio label="unknown">保密</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="学校">
              <el-input v-model="form.school" class="custom-input" placeholder="请输入学校" />
            </el-form-item>

            <el-form-item style="margin-top: 30px;">
              <el-button type="primary" :loading="loading" @click="submitUpdate" class="save-btn">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="right-avatar">
          <div class="avatar-label">头像</div>
          <el-upload
              class="avatar-uploader"
              action=""
              :http-request="handleAvatarUpload"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
          >
            <img v-if="form.avatar" :src="form.avatar" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">点击上传头像</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.settings-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.header {
  margin-bottom: 20px;
}
.back-btn {
  font-size: 16px;
  color: var(--book-text-color); /* 适配全局文字颜色 */
}
.back-btn:hover {
  color: var(--book-link-color); /* 适配全局高亮颜色 */
}
.card-header {
  font-weight: bold;
  font-size: 18px;
}
.form-layout {
  display: flex;
  justify-content: space-between;
  gap: 60px;
  padding: 20px 0;
}
.left-form {
  flex: 1;
  max-width: 500px;
}
.save-btn {
  width: 120px;
}

.custom-input :deep(.el-input__wrapper) {
  background-color: var(--el-fill-color-light);
  box-shadow: 0 0 0 1px transparent inset;
  transition: all 0.3s;
}
.custom-input :deep(.el-input__wrapper:focus-within) {
  background-color: var(--el-input-bg-color);
  box-shadow: 0 0 0 1px var(--book-link-color) inset;
}

.right-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 40px;
}
.avatar-label {
  align-self: flex-start;
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--book-text-color);
}
.avatar-uploader {
  border: 1px dashed var(--book-border-color);
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 140px;
  height: 140px;
  transition: border-color 0.3s;
}
.avatar-uploader:hover {
  border-color: var(--book-link-color);
}
.avatar-uploader-icon {
  font-size: 28px;
  color: var(--book-hover-color);
  width: 140px;
  height: 140px;
  text-align: center;
  line-height: 140px;
}
.avatar {
  width: 140px;
  height: 140px;
  display: block;
  object-fit: cover;
}
.upload-tip {
  margin-top: 15px;
  font-size: 12px;
  color: var(--book-hover-color);
}
</style>