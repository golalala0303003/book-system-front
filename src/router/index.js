import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import HelloTest from "@/views/HelloTest.vue";
import Login from "@/views/Login.vue";

const routes = [
    {
        path: '/',
        name: 'home',
        component: Home,
        children: [
            {
                path: '',
                name: 'hello',
                component: HelloTest
            }
        ]
    },
    {
        path: '/login',
        name: 'login',
        component: Login
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router