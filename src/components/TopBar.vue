<script setup>
import {House, Reading, Comment} from '@element-plus/icons-vue'
import {ref} from "vue"
import {useRouter} from "vue-router"
import MiniUser from "@/components/MiniUser.vue";
const router = useRouter()
const defaultIdx = ref('1')

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

function testQuitLogin  () {
  localStorage.removeItem('token')
  window.location.reload();
  //localStorage.clear()
}
</script>

<template>
  <el-row>

    <el-col :span="2" class="logo">这是一个logo</el-col>
    <el-col :span="10" class="navigate-bar">
      <el-menu
          @select="handleSelect"
          :default-active="defaultIdx"
          mode="horizontal"
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
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
      <div class="test-quit">
        <button @click="testQuitLogin">测试退出登录用</button>
      </div>

      <div class="mini-message">这里是消息组件</div>
      <MiniUser class="mini-user"></MiniUser>
    </el-col>
  </el-row>
</template>

<style scoped>
.logo {
  background-color: #545c64;
}
.el-menu--horizontal.el-menu {
  border-bottom:0;
}
.navigate-bar {

}
.navigate-menu {
  height: 100%;
}
.function-bar {
  background-color: #545c64;
  display: flex;
  flex-direction: row-reverse;
}
.mini-user {

}
.mini-message {

}


.test-login {
  background-color: #00ff10;
}
.test-quit {
  background-color: #ff0000;
}
</style>
