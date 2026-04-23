<script setup>
import defaultAvatar from '@/assets/test-avatar.jpg'
import { useRouter } from "vue-router";
import {computed, ref} from 'vue'

const router = useRouter();

// 接收父组件传过来的数据
const props = defineProps({
  userInfo: {
    type: Object,
    required: true,
    default: () => ({})
  },
  isSelf: {
    type: Boolean,
    default: false
  }
})

const avatarUrl = computed(() => {
   return props.userInfo.avatar || defaultAvatar
})

const handleSetting = () => {
  console.log("点击了设置按钮，准备修改资料")
  router.push({ name: "profileEdit" })
}
</script>

<template>
  <el-card shadow="never" class="user-card-box">
    <div class="card-layout">

      <div class="avatar-area">
        <el-image
            class="round-avatar clickable-avatar"
            :src="avatarUrl"
            fit="cover"
            alt="用户头像"
            :preview-src-list="[avatarUrl]"
            preview-teleported
            @error="(e) => e.target.src = defaultAvatar"
        />
      </div>

      <div class="info-area">
        <h2 class="username">{{ userInfo.username || '未知用户' }}</h2>
        <p class="bio">{{ userInfo.bio || '这个用户很懒，什么都没写...' }}</p>
      </div>

      <div class="action-area" v-if="isSelf">
        <el-button type="info" plain @click="handleSetting">设置资料</el-button>
      </div>

    </div>
  </el-card>
</template>

<style scoped>
.user-card-box {
  border-radius: 8px;
}

.card-layout {
  display: flex;
  align-items: center;
  gap: 24px; /* 三个区域之间的间距 */
}

/* 头像区域固定大小，不随右侧内容挤压 */
.avatar-area {
  flex-shrink: 0;
  /* 确保 el-image 也是圆的 */
  overflow: hidden;
  border-radius: 50%;
  width: 100px;
  height: 100px;
}

.round-avatar {
  width: 100px;
  height: 100px;
  border: 1px solid var(--book-border-color);
}

.clickable-avatar {
  cursor: pointer;
  transition: all 0.3s;
}
.clickable-avatar:hover {
  opacity: 0.8;
}


.info-area {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.username {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: var(--book-text-color);
}

.bio {
  margin: 0;
  font-size: 14px;
  color: var(--book-text-color);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.action-area {
  flex-shrink: 0;
}
</style>