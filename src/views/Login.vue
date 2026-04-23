<script setup>
import { ref, reactive } from "vue"
import { ElMessage } from "element-plus"
import request from "@/utils/request.js"
import { useRouter } from "vue-router"
import { useUserStore } from "@/stores/user"

const userStore = useUserStore()
const router = useRouter()
const isLogin = ref(true)

const form = reactive({
  username: "",
  password: "",
  confirmPassword: ""
})

function switchMode() {
  isLogin.value = !isLogin.value
  form.username = ""
  form.password = ""
  form.confirmPassword = ""
}

function submit() {
  if (!form.username || !form.password) {
    ElMessage.warning("请填写完整用户名和密码")
    return
  }

  if (isLogin.value) {
    handleLogin()
  } else {
    // 【核心修复】：注册时校验两次密码是否一致
    if (form.password !== form.confirmPassword) {
      ElMessage.warning("两次输入的密码不一致，请重新输入")
      return
    }
    handleRegister()
  }
}

async function handleLogin() {
  try {
    const res = await request.post('/user/login', {
      username: form.username,
      password: form.password
    })

    // 存入pinia
    userStore.setLoginData(res.data.access_token, {
      id: res.data.id,
      username: res.data.username,
      avatar: res.data.avatar,
      role: res.data.role
    })

    ElMessage.success("登录成功，欢迎回来！")
    await router.push('/')
  } catch (error) {
    console.log("登录流程终止", error)
  }
}

async function handleRegister() {
  try {
    const res = await request.post('/user/register', {
      username: form.username,
      password: form.password
    })
    ElMessage.success(res.message || "注册成功，请登录！")
    switchMode()
  } catch (error) {
    console.log("注册流程终止", error)
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card" shadow="hover">
      <div class="card-body">

        <div class="left">
          <h2 class="title">{{ isLogin ? "账号登录" : "注册新账号" }}</h2>

          <el-form label-position="top">
            <el-form-item label="用户名">
              <el-input
                  v-model="form.username"
                  class="custom-input"
                  placeholder="请输入用户名"
              />
            </el-form-item>

            <el-form-item label="密码">
              <el-input
                  v-model="form.password"
                  type="password"
                  show-password
                  class="custom-input"
                  placeholder="请输入密码"
                  @keyup.enter="submit"
              />
            </el-form-item>

            <el-form-item v-if="!isLogin" label="确认密码">
              <el-input
                  v-model="form.confirmPassword"
                  type="password"
                  show-password
                  class="custom-input"
                  placeholder="请再次输入密码"
                  @keyup.enter="submit"
              />
            </el-form-item>

            <el-button type="primary" class="submit-btn" @click="submit">
              {{ isLogin ? "立即登录" : "立即注册" }}
            </el-button>
          </el-form>
        </div>

        <div class="right">
          <h2 class="welcome-title">{{ isLogin ? "您好！" : "欢迎加入！" }}</h2>
          <p class="welcome-desc">
            {{
              isLogin
                  ? "如果您还没有账号，请点击下方按钮快速注册，开启您的探索之旅。"
                  : "如果您已经拥有账号，请直接登录以同步您的所有数据。"
            }}
          </p>
          <el-button type="primary" plain round class="switch-btn" @click="switchMode">
            {{ isLogin ? "去注册账号" : "返回登录页" }}
          </el-button>
        </div>

      </div>
    </el-card>
  </div>
</template>

<style scoped>
/* 整个页面的背景：使用全局变量，适配深浅色模式 */
.login-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--book-bg-color);
}

/* 覆盖 el-card 的默认样式 */
.login-card {
  width: 820px;
  border-radius: 12px;
  border: 1px solid var(--book-border-color);
  background-color: var(--book-topbar-bg);
  overflow: hidden;
}

/* 消除 el-card 自带的 padding */
.login-card :deep(.el-card__body) {
  padding: 0;
}

.card-body {
  display: flex;
  height: 480px; /* 稍微增高一点，防止注册多一个输入框时挤压 */
}

/* --- 左侧表单区域 --- */
.left {
  flex: 1;
  padding: 50px 60px;
  background-color: var(--book-topbar-bg);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title {
  color: var(--book-text-color);
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: bold;
}

/* 适配全站统一的输入框高亮效果 */
.custom-input :deep(.el-input__wrapper) {
  background-color: var(--el-fill-color-light);
  box-shadow: 0 0 0 1px transparent inset;
  transition: all 0.3s;
}
.custom-input :deep(.el-input__wrapper:focus-within) {
  background-color: var(--el-input-bg-color);
  box-shadow: 0 0 0 1px var(--book-link-color) inset;
}

/* 表单 Label 字体颜色适配 */
:deep(.el-form-item__label) {
  color: var(--book-text-color);
  font-weight: 500;
}

.submit-btn {
  width: 100%;
  margin-top: 20px;
  height: 40px;
  font-size: 16px;
}

/* --- 右侧引导区域 --- */
.right {
  flex: 1;
  /* 使用稍深的背景色形成视觉分割，同时适配主题 */
  background-color: var(--book-bg-color);
  border-left: 1px solid var(--book-border-color);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 50px;
}

.welcome-title {
  color: var(--book-text-color);
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: bold;
}

.welcome-desc {
  color: var(--book-hover-color);
  margin-bottom: 40px;
  line-height: 1.8;
  font-size: 15px;
}

.switch-btn {
  width: 160px;
}
</style>