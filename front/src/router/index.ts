import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView/HomeView.vue'
import LoginPage from '../views/LoginPage.vue'
import AiSdk from '../views/AiSdk.vue'
import SetKey from '../views/SetKey.vue'
import SteamChunks from '../views/SteamChunks.vue'
import AgentMessage from '../views/AgentMessage.vue'

type RouteRecordRaw = typeof RouteRecordRaw;

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'home',
        component: HomeView
    },
    {
        path: '/login',
        name: 'login',
        component: LoginPage
    },
    {
        path: '/sdk',
        name: 'sdk',
        component: AiSdk
    },
    {
        path: '/set',
        name: 'set',
        component: SetKey
    },
    {
        path: '/stream',
        name: 'stream',
        component: SteamChunks
    },
    {
        path: '/agent',
        name: 'agent',
        component: AgentMessage
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

export default router
