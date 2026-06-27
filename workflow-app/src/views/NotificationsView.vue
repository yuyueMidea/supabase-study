<template>
  <div class="p-6 max-w-2xl mx-auto space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-bold text-slate-800">消息通知</h2>
        <p class="text-sm text-slate-400">{{ notifStore.unreadCount }} 条未读</p>
      </div>
      <button v-if="notifStore.unreadCount > 0" @click="notifStore.markAllRead()" class="btn-ghost btn-sm text-brand-600">
        全部标为已读
      </button>
    </div>

    <div v-if="notifStore.notifications.length" class="space-y-2">
      <div v-for="notif in notifStore.notifications" :key="notif.id"
        @click="handleClick(notif)"
        class="card p-4 cursor-pointer transition-all hover:shadow-md"
        :class="!notif.is_read ? 'border-brand-200 bg-brand-50/30' : ''">
        <div class="flex gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
            :class="typeStyle[notif.type]">
            {{ typeIcon[notif.type] }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <p class="font-semibold text-sm text-slate-800">{{ notif.title }}</p>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span v-if="!notif.is_read" class="w-2 h-2 rounded-full bg-brand-500" />
                <span class="text-xs text-slate-400">{{ formatRelative(notif.created_at) }}</span>
              </div>
            </div>
            <p class="text-sm text-slate-500 mt-0.5">{{ notif.message }}</p>
          </div>
        </div>
      </div>
    </div>

    <EmptyState v-else icon="📭" title="暂无通知" description="审批动态和系统消息将在这里显示" />
  </div>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Notification } from '@/types'

const router = useRouter()
const notifStore = useNotificationStore()

function formatRelative(d: string) {
  return formatDistanceToNow(new Date(d), { addSuffix: true, locale: zhCN })
}

const typeIcon: Record<string, string> = {
  task_assigned: '📥', task_approved: '✅', task_rejected: '❌', task_cancelled: '🚫', comment_added: '💬'
}
const typeStyle: Record<string, string> = {
  task_assigned: 'bg-blue-50 text-blue-600',
  task_approved: 'bg-emerald-50 text-emerald-600',
  task_rejected: 'bg-red-50 text-red-600',
  task_cancelled: 'bg-slate-100 text-slate-500',
  comment_added: 'bg-brand-50 text-brand-600'
}

async function handleClick(notif: Notification) {
  await notifStore.markRead(notif.id)
  if (notif.instance_id) {
    router.push(`/instances/${notif.instance_id}`)
  }
}
</script>
