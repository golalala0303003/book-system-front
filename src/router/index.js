import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import HelloTest from "@/views/HelloTest.vue";
import Login from "@/views/Login.vue";
import UserProfile from "@/views/user/UserProfile.vue";
import ForumLayout from "@/views/forum/ForumLayout.vue";
import {ElMessage} from "element-plus";
import {useUserStore} from "@/stores/user.js";
import EditProfile from "@/views/user/EditProfile.vue";
import BookWikiDetail from "@/views/book/BookWikiDetail.vue";
import BookWikiHome from "@/views/book/BookWikiHome.vue";
import BookWikiPage from "@/views/book/BookWikiPage.vue";
import PostDetail from "@/views/forum/PostDetail.vue";
import ForumBoard from "@/views/forum/ForumBoard.vue";
import PostPublish from "@/views/forum/PostPublish.vue";
import ForumHome from "@/views/forum/ForumHome.vue";
import ForumPage from "@/views/forum/ForumPage.vue";
import WelComePage from "@/views/WelComePage.vue";
import PostEdit from "@/views/forum/PostEdit.vue";


const routes = [
    {
        path: '/',
        name: 'home',
        component: Home, // 主布局 (包含全局 TopBar)
        children: [
            {
                path: '',
                name: 'index',
                component: WelComePage,
                meta: { requiresAuth: false },
            },
            {
                path: 'profile/:id',
                name: 'profile',
                component: UserProfile,
                meta: { requiresAuth: true },
            },
            {
                path: 'profile/edit',
                name: 'profileEdit',
                component: EditProfile,
                meta: { requiresAuth: true },
            },
            {
                path: 'book/home',
                name: 'bookHome',
                component: BookWikiHome,
                meta: { requiresAuth: false },
            },
            {
                path: 'book/page',
                name: 'wikiPage',
                component: BookWikiPage,
                meta: { requiresAuth: false },
            },
            {
                path: 'book/detail/:id',
                name: 'bookDetail',
                component: BookWikiDetail,
                meta: { requiresAuth: false },
            },
            // --- 论坛交流模块 (新增嵌套路由) ---
            {
                path: 'forum',
                component: ForumLayout, // 论坛的专属父布局 (包含侧边导航栏 SideNavigateBar)
                children: [
                    {
                        path: '', // /forum -> 默认加载论坛总聚合页
                        name: 'forumHome',
                        component: ForumHome,
                        meta: { requiresAuth: false },
                    },
                    {
                        path: 'board/:id', // /forum/board/123 -> 特定板块页
                        name: 'forumBoard',
                        component: ForumBoard,
                        meta: { requiresAuth: false },
                    },
                    {
                        path: 'post/:id', // /forum/post/456 -> 帖子详情页
                        name: 'postDetail',
                        component: PostDetail,
                        meta: { requiresAuth: false }, // 游客可看帖
                    },
                    {
                        path: 'publish', // /forum/publish -> 发布/编辑帖子页
                        name: 'postPublish',
                        component: PostPublish,
                        meta: { requiresAuth: true }, // 发帖必须登录
                    },
                    {
                        path: 'page',
                        name: 'forumPage',
                        component: ForumPage,
                        meta: { requiresAuth: false },
                    },
                    {
                        path: 'editPost/:id', // /forum/editPost/:id
                        name: 'editPost',
                        component: PostEdit,
                        meta: { requiresAuth: true },
                    }
                ]
            },
            {
                path: 'admin',
                component: () => import('@/views/admin/AdminLayout.vue'), // 管理端专属父布局 (带侧边栏)
                meta: { requiresAuth: true, requiresAdmin: true }, // 需要登录且需要管理员权限
                children: [
                    {
                        path: '', // 默认进入仪表盘
                        name: 'adminDashboard',
                        component: () => import('@/views/admin/Dashboard.vue'),
                        meta: { requiresAuth: true, requiresAdmin: true },

                    },
                    {
                        path: 'users',
                        name: 'adminUsers',
                        component: () => import('@/views/admin/AdminUser.vue'),
                        meta: { requiresAuth: true, requiresAdmin: true },
                    },
                    {
                        path: 'books',
                        name: 'adminBooks',
                        component: () => import('@/views/admin/AminBooks.vue'),
                        meta: { requiresAuth: true, requiresAdmin: true }
                    },
                    {
                        path: 'forum/boards',
                        name: 'adminForumBoards',
                        component: () => import('@/views/admin/AdminForumBoards.vue'),
                        meta: { requiresAuth: true, requiresAdmin: true },
                    },
                    {
                        path: 'forum/posts',
                        name: 'adminForumPosts',
                        component: () => import('@/views/admin/AdminForumPosts.vue'),
                        meta: { requiresAuth: true, requiresAdmin: true },
                    },
                    {
                        path: 'forum/comments',
                        name: 'adminForumComments',
                        component: () => import('@/views/admin/AdminForumComments.vue'),
                        meta: { requiresAuth: true, requiresAdmin: true },
                    },
                    {
                        path: 'forum/reports',
                        name: 'adminForumReports',
                        component: () => import('@/views/admin/AdminForumReports.vue'),
                        meta: { requiresAuth: true, requiresAdmin: true },
                    },
                    {
                        path: 'system',
                        name: 'adminSystem',
                        component: () => import('@/views/admin/AdminSystem.vue'),
                        meta: { requiresAuth: true, requiresAdmin: true },
                    }
                ]
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

router.beforeEach((to, from, next) => {
    const userStore = useUserStore()
    const token = userStore.token
    const isAdmin = userStore.isAdmin // 获取管理员状态

    // 1. 判断是否需要登录
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!token) {
            ElMessage.error('你还没有登录，请先登录')
            next({ name: 'login' })
            return // 阻断执行
        }

        // 2. 登录状态下，判断是否需要管理员权限
        if (to.matched.some(record => record.meta.requiresAdmin)) {
            if (!isAdmin) {
                ElMessage.error('权限不足，拒绝访问')
                next({ path: '/' }) // 踢回首页或其他安全页面
                return // 阻断执行
            }
        }

        // 权限校验全部通过
        next()
    } else {
        // 不需要登录的页面直接放行
        next()
    }
})

export default router