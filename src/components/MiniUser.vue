<script setup>
import { ref } from "vue";
import {User} from '@element-plus/icons-vue'
import {useRouter} from "vue-router";
import {useUserStore} from "@/stores/user.js";


const router = useRouter();
const userStore = useUserStore()
import defaultAvatar from '@/assets/test-avatar.jpg'

function goLogin() {
  router.push({name: 'login'})
}

function goProfile() {
  console.log("跳转用户资料界面")
}

</script>

<template>
  <div class="container">
    <!-- 未登录 -->
    <div v-if="!userStore.isLogin" class="login-prompt">
      <el-icon><User /></el-icon>
      未登录，请先
      <span class="login-link" @click="goLogin">[登录]</span>
    </div>

    <!-- 已登录 -->
    <div v-else class="user-card" @click="goProfile">
      <img :src="userStore.userInfo.avatar || defaultAvatar" alt="头像" class="avatar" />
      <div class="user-info">
        <div class="user-name">{{userStore.userInfo.username}}</div>
        <div class="user-link">个人主页</div>
      </div>
    </div>

  </div>

</template>

<style scoped>
.container {
  border: 1px solid #ccc; /* 细灰边框 */
}
.container:hover {
  background-color: rgba(255, 255, 255, 0.1); /* 背景微亮，可调 */
  border-color: #ffd04b;                      /* 边框高亮，可选 */
  cursor: pointer;                             /* 鼠标变手型 */
}
.login-prompt {
  cursor: default;
  font-size: 14px;
  color: #fff;
  line-height: 60px;
}

.login-link {
  color: #ffd04b;
  cursor: pointer;
  margin-left: 4px;
}

/* 已登录用户卡片 */
.user-card {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
  margin-left: 3px;
  margin-right: 3px;
}

.user-card .avatar {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px; /* 方形 */
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-size: 16px;
  color: #fff;
}

.user-link {
  font-size: 16px;
  color: #ffd04b;
}
</style>