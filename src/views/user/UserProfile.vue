<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user.js'
import request from '@/utils/request.js'

import UserCard from '@/components/user/UserCard.vue'
import HistoryList from '@/components/HistoryList.vue'
import UserStats from '@/components/user/UserStats.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userInfo = ref({})
const isSelf = ref(false) // 是否是当前登录用户在看自己的主页
const loading = ref(true)

// 获取用户数据的核心逻辑
const fetchUserData = async (userId) => {
  loading.value = true
  try {
    const res = await request.get(`/user/profile/${userId}`)
    userInfo.value = res.data


    // 是否是自身页面
    isSelf.value = Number(userId) === userStore.userInfo.id

  } catch (error) {
    console.error("获取主页信息失败", error)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push("/")
}

// 组件挂载时请求一次
onMounted(() => {
  fetchUserData(route.params.id)
})

// 监听路由参数变化（解决从用户A的主页直接跳到用户B的主页，页面不刷新的问题）
watch(() => route.params.id, (newId) => {
  if (newId) fetchUserData(newId)
})
</script>

<template>
  <div class="profile-container" v-loading="loading">
    <el-row :gutter="20">

      <el-col :span="16">
        <el-button link @click="goBack" class="back-btn">
          &lt; 返回首页
        </el-button>
        <UserCard :user-info="userInfo" :is-self="isSelf" class="mb-20" />

        <HistoryList :user-id="route.params.id" :is-self="isSelf" />
      </el-col>

      <el-col :span="8">
        <UserStats :user-id="route.params.id" />
      </el-col>

    </el-row>
  </div>
</template>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 1200px; /* 限制最大宽度, 页面居中*/
  margin: 0 auto;
}
.back-btn {
  margin-bottom: 20px;
  font-size: 16px;
  color: var(--book-text-color);
}
.back-btn:hover {
  color: var(--book-link-color);
}
.mb-20 {
  margin-bottom: 20px; /* 给卡片下方留点空隙 */
}
</style>