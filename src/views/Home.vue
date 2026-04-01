<script setup>
import { useRouter } from 'vue-router'
import TopBar from "@/components/TopBar.vue";
const router = useRouter()
</script>

<template>
  <div class="layout">
    <TopBar class="topbar"></TopBar>
    <div class="body">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  background: var(--book-bg-color);
  color: var(--book-text-color);
}

.body {
  flex: 1;
  min-height: 200vh;
}
</style>