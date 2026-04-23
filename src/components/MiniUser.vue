<script setup>
import { User } from '@element-plus/icons-vue'
import { useRouter } from "vue-router"
import { useUserStore } from "@/stores/user.js"
import { ElMessage, ElMessageBox } from 'element-plus'

// 如果你有默认头像图片，可以保留这里的 import
import defaultAvatar from '@/assets/test-avatar.jpg'

const router = useRouter()
const userStore = useUserStore()

// 1. 跳转登录页
const goLogin = () => {
  router.push({ name: 'login' })
}

// 2. 处理下拉菜单的点击事件
const handleCommand = (command) => {
  if (command === 'profile') {
    router.push({ name: 'profile', params: { id: userStore.userInfo.id } })
  } else if (command === 'settings') {
    router.push({ name: 'profileEdit' })
  } else if (command === 'logout') {
    executeLogout()
  }
}

// 3. 退出登录逻辑 (纯 JWT 模式：仅前端销毁)
const executeLogout = () => {
  ElMessageBox.confirm(
      '确定要退出当前账号吗？',
      '退出提示',
      {
        confirmButtonText: '确定退出',
        cancelButtonText: '取消',
        type: 'warning',
      }
  ).then(() => {
    // 调用 Pinia 中的 logout 动作清理 Token 和用户信息
    // 前提：确保你的 userStore.js 中写了 logout 方法（如 this.token = ''; this.userInfo = {};）
    userStore.logout()

    ElMessage.success('已安全退出')

    // 退出后如果身处需要鉴权的页面（如个人主页），直接踢回首页
    if (router.currentRoute.value.name === 'profile') {
      router.push('/')
    }
  }).catch(() => {
    // 取消退出，静默处理
  })
}
</script>

<template>
  <div class="mini-user-container">

    <div v-if="!userStore.isLogin" class="unlogged-box" @click="goLogin">
      <el-avatar :size="40" :icon="User" class="default-avatar" />
      <div class="unlogged-info">
        <span class="welcome-text">欢迎来到社区</span>
        <span class="login-link">点击登录/注册</span>
      </div>
    </div>

    <el-dropdown v-else trigger="hover" @command="handleCommand" class="user-dropdown">
      <div class="logged-box">
        <el-avatar
            :size="40"
            shape="square"
            :src="userStore.userInfo?.avatar || defaultAvatar"
        />
        <div class="user-info">
          <div class="user-name">{{ userStore.userInfo?.username || '用户' }}</div>
          <div class="user-role">{{ userStore.userInfo?.role === 'admin' ? '管理员' : '普通用户' }}</div>
        </div>
      </div>

      <template #dropdown>
        <el-dropdown-menu class="custom-dropdown-menu">
          <el-dropdown-item command="profile">个人主页</el-dropdown-item>
          <el-dropdown-item command="settings">修改资料</el-dropdown-item>
          <el-dropdown-item command="logout" divided class="logout-item">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

  </div>
</template>

<style scoped>
.mini-user-container {
  height: 100%;
  display: flex;
  align-items: center;
}

/* --- 未登录样式 --- */
.unlogged-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.unlogged-box:hover {
  background-color: var(--book-hover-color, rgba(0, 0, 0, 0.05));
}

.default-avatar {
  background-color: var(--book-border-color);
  color: #fff;
}

.unlogged-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.welcome-text {
  font-size: 13px;
  color: var(--book-text-color);
}

.login-link {
  font-size: 14px;
  font-weight: bold;
  color: var(--book-link-color);
}

/* --- 已登录样式 --- */
.user-dropdown {
  height: 100%;
  display: flex;
  align-items: center;
}

.logged-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  outline: none; /* 消除 el-dropdown 自带的点击边框 */
}

.logged-box:hover {
  background-color: var(--book-hover-color, rgba(0, 0, 0, 0.05));
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.user-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--book-text-color);
}

.user-role {
  font-size: 12px;
  color: var(--book-text-color);
}

/* --- 下拉菜单样式定制 --- */
.custom-dropdown-menu {
  min-width: 120px;
}

/* 退出登录按钮标红警示 */
.logout-item {
  color: #f56c6c !important;
}
.logout-item:hover {
  background-color: rgba(245, 108, 108, 0.1) !important;
  color: #f56c6c !important;
}
</style>