<script setup>
import { ref } from 'vue'
import {
  Odometer,
  User,
  Reading,
  ChatDotSquare,
  Setting,
  Fold,
  Expand,
  Files,          // 板块图标
  Document,       // 帖子图标
  ChatLineRound,  // 评论图标
  Warning         // 举报图标
} from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'

const isCollapse = ref(false)
const route = useRoute()

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<template>
  <div class="admin-layout">
    <div class="sidebar-container" :class="{ 'is-collapsed': isCollapse }">
      <el-menu
          :default-active="route.path"
          class="admin-menu"
          :collapse="isCollapse"
          router
      >
        <el-menu-item index="/admin">
          <el-icon><Odometer /></el-icon>
          <template #title>首页</template>
        </el-menu-item>

        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>

        <el-menu-item index="/admin/books">
          <el-icon><Reading /></el-icon>
          <template #title>图书管理</template>
        </el-menu-item>

        <el-sub-menu index="/admin/forum">
          <template #title>
            <el-icon><ChatDotSquare /></el-icon>
            <span>论坛管理</span>
          </template>

          <el-menu-item index="/admin/forum/boards">
            <el-icon><Files /></el-icon>
            <template #title>板块管理</template>
          </el-menu-item>

          <el-menu-item index="/admin/forum/posts">
            <el-icon><Document /></el-icon>
            <template #title>帖子管理</template>
          </el-menu-item>

          <el-menu-item index="/admin/forum/comments">
            <el-icon><ChatLineRound /></el-icon>
            <template #title>评论管理</template>
          </el-menu-item>

          <el-menu-item index="/admin/forum/reports">
            <el-icon><Warning /></el-icon>
            <template #title>举报处理</template>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/admin/system">
          <el-icon><Setting /></el-icon>
          <template #title>系统操作</template>
        </el-menu-item>
      </el-menu>

      <div class="collapse-btn" @click="toggleCollapse">
        <el-icon size="20">
          <Expand v-if="isCollapse" />
          <Fold v-else />
        </el-icon>
      </div>
    </div>

    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  height: 93vh;
  width: 100%;
  background-color: var(--book-bg-color);
}

.sidebar-container {
  display: flex;
  flex-direction: column;
  background-color: var(--book-topbar-bg);
  border-right: 1px solid var(--book-border-color);
  transition: width 0.3s ease-in-out;
  width: 200px;
}

.sidebar-container.is-collapsed {
  width: 64px;
}

.admin-menu {
  flex: 1;
  border-right: none;
  background-color: transparent;
}

/* 穿透修改 Element Plus Menu 的变量 */
:deep(.el-menu) {
  --el-menu-text-color: var(--book-text-color);
  --el-menu-hover-text-color: var(--book-link-color);
  --el-menu-bg-color: transparent;
  --el-menu-hover-bg-color: transparent;
  --el-menu-active-color: var(--book-link-color);
}

/* 覆盖菜单项悬浮时的文字颜色 */
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  color: var(--book-link-color) !important;
}

/* 子菜单背景色调整 (防止展开时与父级混淆) */
:deep(.el-menu .el-menu--inline) {
  background-color: var(--book-bg-color);
}

.collapse-btn {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-top: 1px solid var(--book-border-color);
  color: var(--book-text-color);
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: var(--book-link-color);
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  color: var(--book-text-color);
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