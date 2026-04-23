import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
    // 定义状态 (State)
    const token = ref('')
    const userInfo = ref({
        id: null,
        username: '',
        avatar: null,
        role: '' // 【新增】用户角色字段
    })

    // 定义计算属性 (Getters)
    const isLogin = computed(() => !!token.value)

    const isAdmin = computed(() => userInfo.value.role === 'admin')

    // 定义修改状态的方法 (Actions)
    function setLoginData(newToken, info) {
        token.value = newToken
        userInfo.value = info
    }

    function logout() {
        token.value = ''
        userInfo.value = { id: null, username: '', avatar: null, role: '' } // 【新增】清空role
    }

    return { token, userInfo, isLogin, isAdmin, setLoginData, logout }
}, {
    // 开启持久化
    persist: true
})