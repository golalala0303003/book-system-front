<script setup>
import { ref, reactive, computed } from "vue"

const isLogin = ref(true)

const form = reactive({
  username: "",
  password: "",
  confirmPassword: ""
})

function switchMode() {
  isLogin.value = !isLogin.value
}

function submit() {
  if (isLogin.value) {
    console.log("login", form)
  } else {
    console.log("register", form)
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card">

      <div class="card-body">
        <!-- 左 -->
        <div class="left">
          <h2>{{ isLogin ? "登录" : "注册" }}</h2>

          <el-form label-position="top">
            <el-form-item label="用户名">
              <el-input v-model="form.username" />
            </el-form-item>

            <el-form-item label="密码">
              <el-input v-model="form.password" type="password" show-password />
            </el-form-item>

            <el-form-item v-if="!isLogin" label="确认密码">
              <el-input v-model="form.confirmPassword" type="password" show-password />
            </el-form-item>

            <el-button type="primary" class="submit-btn" @click="submit">
              {{ isLogin ? "立即登录" : "立即注册" }}
            </el-button>
          </el-form>
        </div>

        <!-- 右 -->
        <div class="right">
          <h2>{{ isLogin ? "您好！" : "欢迎回来！" }}</h2>

          <p>
            {{
              isLogin
                  ? "如果您还没有账号，请点击下方按钮注册"
                  : "如果您已经有账号，请点击下方按钮登录"
            }}
          </p>

          <el-button type="primary" plain round @click="switchMode">
            {{ isLogin ? "立即注册" : "返回登录" }}
          </el-button>
        </div>
      </div>

    </el-card>
  </div>
</template>

<style scoped>

.login-page{
  height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
  background: linear-gradient(135deg,#a8c0ff,#fbc2eb);
}
.login-card{
  width:820px;
  padding:0;
}
.card-body{
  display:flex;
  height:420px;
}
.left{
  flex:1;
  padding:50px;
}
.right{
  flex:1;
  background:#f5f7fa;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  text-align:center;
  padding:40px;
}

.submit-btn{
  width:100%;
  margin-top:10px;
}


</style>