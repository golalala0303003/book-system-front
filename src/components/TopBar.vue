<script setup>
import { House, Reading, Comment, Sunny, Moon } from '@element-plus/icons-vue' // 引入 Sunny 和 Moon
import { ref, onMounted, onUnmounted } from "vue" // 引入了 onMounted 和 onUnmounted
import { useRouter } from "vue-router"
import MiniUser from "@/components/MiniUser.vue";

const router = useRouter()
const defaultIdx = ref('1')
const isVisible = ref(true) // 控制显隐
const isDark = ref(localStorage.getItem('theme') === 'dark')
let lastScrollTop = 0

const toggleTheme = (val) => {
  if (val) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const handleScroll = () => {
  const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop

  // 避免微小抖动触发
  if (Math.abs(currentScrollTop - lastScrollTop) < 10) return

  // 判断方向,向下滚且距离超过 100px 隐藏，向上滚显示
  if (currentScrollTop > lastScrollTop && currentScrollTop > 150) {
    isVisible.value = false
  } else {
    isVisible.value = true
  }

  lastScrollTop = currentScrollTop
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)

  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

function handleSelect(key, keyPath) {
  console.log(key, keyPath)
  handleJmpPage(key)
}

function handleJmpPage(key) {
  if (key === '1') {
    console.log("跳转首页")
  }
  else if (key === '2') {
    console.log("跳转图书百科")
  }
  else if (key === '3') {
    console.log("跳转图书交流论坛")
  }
}
</script>

<template>
  <el-row :class="['topbar-wrapper', { 'is-hidden': !isVisible }]">

    <el-col :span="2" class="logo">这是一个logo</el-col>
    <el-col :span="10" class="navigate-bar">
      <el-menu
          @select="handleSelect"
          :default-active="defaultIdx"
          mode="horizontal"
          background-color="transparent"
          text-color="var(--book-text-color)"
          active-text-color="var(--book-link-color)"
          class="navigate-menu"
      >
        <el-menu-item index="1">
          <el-icon><House /></el-icon>
          首页
        </el-menu-item>
        <el-menu-item index="2">
          <el-icon><Reading /></el-icon>
          图书百科
        </el-menu-item>
        <el-menu-item index="3" >
          <el-icon><Comment /></el-icon>
          图书交流论坛
        </el-menu-item>
      </el-menu>
    </el-col>

    <el-col :span="12" class="function-bar">
      <div class="theme-switch-wrapper">
        <el-switch
            v-model="isDark"
            inline-prompt
            :active-icon="Moon"
            :inactive-icon="Sunny"
            @change="toggleTheme"
            style="--el-switch-on-color: #4c4d4f; --el-switch-off-color: #e4e7ed"
        />
      </div>
      <MiniUser class="mini-user"></MiniUser>
    </el-col>
  </el-row>
</template>

<style scoped>
.topbar-wrapper {
  position: sticky;
  top: 0;
  z-index: 999;
  height: 7vh;
  width: 100%;
  transition: transform 0.3s ease-in-out; /*平移动画效果 */

  background-color: var(--book-topbar-bg);
}

/* 当 isVisible 为 false 时激活这个 class */
.is-hidden {
  transform: translateY(-100%); /* 向上移动自身高度的距离，实现隐藏 */
}

.logo {

}
.el-menu--horizontal.el-menu {
  border-bottom: 0;
}
.navigate-bar {

}
.navigate-menu {
  height: 100%;
  /* 让鼠标悬浮时的文字颜色与激活时的链接色保持一致 */
  --el-menu-hover-text-color: var(--book-link-color);
}
.function-bar {
  display: flex;
  flex-direction: row-reverse;
  gap: 20px;
}

.theme-switch-wrapper {
  display: flex;
  align-items: center;
}

.mini-user {

}
</style>