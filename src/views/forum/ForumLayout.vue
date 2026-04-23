<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SideNavigateBar from '@/components/forum/SideNavigateBar.vue'

const route = useRoute()
const isSidebarCollapsed = ref(false)

watch(
    () => route.name,
    (newName) => {
      // 详情页自动收起，以留出最大阅读空间
      if (newName === 'postDetail') {
        isSidebarCollapsed.value = true
      } else {
        isSidebarCollapsed.value = false
      }
    },
    { immediate: true }
)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<template>
  <div class="forum-layout-container">

    <SideNavigateBar
        :is-collapsed="isSidebarCollapsed"
        @toggle="toggleSidebar"
    />

    <div class="forum-main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </div>

  </div>
</template>

<style scoped>
.forum-layout-container {
  display: flex;
  width: 100%;
  box-sizing: border-box;
  /* 【核心修改】：上 20px，右 20px，下 20px，左 0。
     将左侧 padding 设为 0，让侧边栏死死贴住屏幕左边缘！ */
  padding: 20px 20px 20px 0;
  gap: 24px;
  min-height: calc(100vh - 7vh); /* 你的 topbar 高度是 7vh */
  position: relative;
}

.forum-main-content {
  flex: 1;
  min-width: 0;
  transition: all 0.3s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>