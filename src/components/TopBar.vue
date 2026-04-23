<script setup>
import { House, Reading, Comment, Sunny, Moon } from '@element-plus/icons-vue'
import { ref, onMounted, onUnmounted, computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import MiniUser from "@/components/MiniUser.vue"
import GlobalSearch from "@/components/GlobalSearch.vue" // 引入全局搜索组件
import { useUserStore } from "@/stores/user" // 引入 userStore


const route = useRoute() // 获取当前路由信息
const router = useRouter()
const userStore = useUserStore() // 实例化
const isVisible = ref(true)
const isDark = ref(localStorage.getItem('theme') === 'dark')
let lastScrollTop = 0

function handleJmpAdmin() {
  router.push('/admin')
}

// 修复 Bug：利用 computed 动态计算当前激活的菜单项
const defaultIdx = computed(() => {
  if (route.path.startsWith('/book')) {
    return '2' // 只要路径以 /book 开头，高亮“图书百科”
  } else if (route.path.startsWith('/forum')) {
    return '3' // 高亮“图书交流论坛”
  }
  return '1' // 默认高亮“首页”
})

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

  if (Math.abs(currentScrollTop - lastScrollTop) < 10) return

  if (currentScrollTop > lastScrollTop && currentScrollTop > 150) {
    isVisible.value = false

    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur()
    }
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
  handleJmpPage(key)
}

function handleJmpPage(key) {
  if (key === '1') {
    router.push({ name: 'index'})
  }
  else if (key === '2') {
    router.push({ name: 'bookHome'})
  }
  else if (key === '3') {
    router.push({ name: 'forumHome'})
  }
}
</script>

<template>
  <el-row :class="['topbar-wrapper', { 'is-hidden': !isVisible }]">

    <el-col :span="2" class="logo">这是一个logo</el-col>

    <el-col :span="8" class="navigate-bar">
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

    <el-col :span="14" class="function-bar">
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

      <el-button
          v-if="userStore.isAdmin"
          type="primary"
          plain
          size="small"
          @click="handleJmpAdmin"
      >
        进入管理端
      </el-button>

      <MiniUser class="mini-user"></MiniUser>

      <GlobalSearch class="global-search"></GlobalSearch>
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
  transition: transform 0.3s ease-in-out;
  background-color: var(--book-topbar-bg);
}

.is-hidden {
  transform: translateY(-100%);
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--book-text-color);
  font-weight: bold;
}

.el-menu--horizontal.el-menu {
  border-bottom: 0;
}

.navigate-menu {
  height: 100%;
  --el-menu-hover-text-color: var(--book-link-color);
}

.function-bar {
  display: flex;
  flex-direction: row-reverse;
  align-items: center; /* 确保搜索框、头像、开关在同一水平线上居中 */
  gap: 20px;
  padding-right: 20px; /* 右侧留出一定边距，不贴边 */
}

.theme-switch-wrapper {
  display: flex;
  align-items: center;
}
</style>