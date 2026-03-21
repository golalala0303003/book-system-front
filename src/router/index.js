import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import HelloTest from "@/views/HelloTest.vue";
import Login from "@/views/Login.vue";
import UserProfile from "@/views/UserProfile.vue";
import Forum from "@/views/Forum.vue";
import {ElMessage} from "element-plus";
import {useUserStore} from "@/stores/user.js";


const routes = [
    {
        path: '/',
        name: 'home',
        component: Home, // 包含 TopBar 的主布局
        children: [
            {
                path: '', // 默认子路由，路径就是 '/'
                name: 'hello',
                component: HelloTest,
                meta: { requiresAuth: false },
            },
            {
                path: 'forum',
                name: 'forum',
                component: Forum,
                meta: { requiresAuth: true },
            },
            {
                path: 'profile/:id',
                name: 'profile',
                component: UserProfile,
                meta: { requiresAuth: true },
            }
        ]
    },
    {
        // 登录页，独立的满屏页面，不需要 TopBar
        path: '/login',
        name: 'login',
        component: Login
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const userStore = useUserStore()
    const token = userStore.token
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (token) {
            next()
        } else {
            ElMessage.error('你还没有登录，请先登录')
            next({ name: 'login' })
        }
    } else {
        next()
    }
})

export default router