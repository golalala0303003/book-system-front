<script setup>
import {useRouter} from 'vue-router'
import TopBar from "@/components/TopBar.vue";
const router = useRouter()
</script>

<template>
  <div class="layout">
    <TopBar class="topbar">this place suppose to be a top bar</TopBar>
    <div class="body">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped>
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 7vh;
  width: 100%;
}

.body {
  flex: 1;
  background: #5e5e5e;
}
</style>