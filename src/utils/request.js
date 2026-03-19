import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'
const request = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 5000
})

// 请求拦截器
request.interceptors.request.use(
    config => {
        const userStore = useUserStore()
        if (userStore.token) {
            config.headers['Authorization'] = `Bearer ${userStore.token}`
        }
        return config
    },
    error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
    response => {
        return response.data
    },
    error => {
        if (error.response) {
            const status = error.response.status
            // 获取你后端 Result.fail() 返回的具体数据
            const errorData = error.response.data

            if (status === 401) {
                const userStore = useUserStore()
                userStore.logout()
                ElMessage.error('登录状态已过期，请重新登录')
                router.push('/login')
            } else {
                ElMessage.error(errorData.message || '请求失败')
            }
        } else {
            ElMessage.error('网络连接异常，请稍后再试')
        }

        return Promise.reject(error)
    }
)

export default request