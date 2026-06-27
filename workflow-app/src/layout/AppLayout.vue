<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { useWorkflowStore } from '@/stores/workflow'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notifStore = useNotificationStore()
const workflowStore = useWorkflowStore()

const sidebarOpen = ref(false)

const nav = [
  { name: '仪表盘', to: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', exact: true },
  { name: '我的任务', to: '/tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', badge: true },
  { name: '我的申请', to: '/submissions', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: '工作流', to: '/workflows', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
]

const isActive = (item: typeof nav[0]) =>
  item.exact ? route.path === item.to : route.path.startsWith(item.to)

async function signOut() {
  await authStore.signOut()
  router.push('/login')
}

onMounted(async () => {
  await notifStore.fetchNotifications()
  await workflowStore.fetchDefinitions()
  await workflowStore.fetchInstances()
  notifStore.subscribeRealtime()
  workflowStore.subscribeRealtime()
})

onUnmounted(() => {
  notifStore.unsubscribeRealtime()
  workflowStore.unsubscribeRealtime()
})
</script>

<template>
  <div class="flex h-screen bg-slate-50 overflow-hidden">
    <div v-if="sidebarOpen" class="fixed inset-0 bg-black/30 z-20 lg:hidden" @click="sidebarOpen = false" />

    <aside :class="['fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-white border-r border-slate-100 shadow-sm transition-transform duration-200 lg:relative lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full']">
      <div class="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
        <div class="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <span class="text-white font-bold text-sm">⚡</span>
        </div>
        <span class="font-semibold text-slate-900 text-lg tracking-tight">FlowDesk</span>
        <span v-if="authStore.isDemo" class="ml-auto text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">演示</span>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <RouterLink
          v-for="item in nav" :key="item.to" :to="item.to"
          @click="sidebarOpen = false"
          :class="['flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', isActive(item) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900']"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
          {{ item.name }}
          <span v-if="item.badge && workflowStore.myTasks.length > 0" class="ml-auto bg-brand-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">{{ workflowStore.myTasks.length }}</span>
        </RouterLink>
      </nav>

      <div class="px-3 py-3 border-t border-slate-100 space-y-0.5">
        <RouterLink to="/notifications" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          通知
          <span v-if="notifStore.unreadCount > 0" class="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">{{ notifStore.unreadCount > 9 ? '9+' : notifStore.unreadCount }}</span>
        </RouterLink>
        <RouterLink to="/settings" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          设置
        </RouterLink>

        <div class="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span class="text-brand-700 font-semibold text-sm">{{ authStore.user?.full_name?.[0] ?? '?' }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900 truncate">{{ authStore.user?.full_name }}</p>
            <p class="text-xs text-slate-500 truncate">{{ authStore.user?.email }}</p>
          </div>
          <button @click="signOut" class="text-slate-400 hover:text-slate-600 transition-colors" title="退出">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header class="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <button @click="sidebarOpen = true" class="text-slate-600">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span class="font-semibold text-slate-900">FlowDesk</span>
      </header>
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
