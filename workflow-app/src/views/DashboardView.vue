<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <!-- Welcome bar -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-800">
          {{ greeting }}，{{ authStore.user?.full_name }} 👋
        </h2>
        <p class="text-sm text-slate-400 mt-0.5">{{ today }}</p>
      </div>
      <button @click="showSubmitModal = true" class="btn-primary">
        <span>＋</span> 发起申请
      </button>
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard icon="⏳" label="待处理"   :value="stats.total_pending"  color="slate"   />
      <StatCard icon="🔄" label="进行中"   :value="stats.total_running"  color="blue"    />
      <StatCard icon="✅" label="已通过"   :value="stats.total_approved" color="emerald" />
      <StatCard icon="❌" label="已驳回"   :value="stats.total_rejected" color="red"     />
      <StatCard icon="📥" label="我的待办" :value="stats.my_tasks"       color="brand"   />
      <StatCard icon="🎯" label="今日完成" :value="stats.completed_today" color="violet" />
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- My tasks -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-slate-700">我的待办</h3>
          <RouterLink to="/tasks" class="text-xs text-brand-600 hover:underline">查看全部 →</RouterLink>
        </div>
        <div v-if="workflowStore.myTasks.length" class="space-y-3">
          <InstanceCard
            v-for="inst in workflowStore.myTasks.slice(0, 4)"
            :key="inst.id"
            :instance="inst"
          />
        </div>
        <EmptyState v-else icon="🎉" title="暂无待办任务" description="当前没有需要您处理的流程" />
      </div>

      <!-- Right panel -->
      <div class="space-y-4">
        <!-- Quick start -->
        <div>
          <h3 class="font-semibold text-slate-700 mb-3">快速发起</h3>
          <div class="space-y-2">
            <button v-for="def in workflowStore.definitions.slice(0, 4)" :key="def.id"
              @click="router.push(`/submit/${def.id}`)"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50 transition-all text-left group">
              <span class="text-2xl">{{ def.icon }}</span>
              <div class="min-w-0">
                <p class="text-sm font-medium text-slate-700 group-hover:text-brand-700 transition-colors">{{ def.name }}</p>
                <p class="text-xs text-slate-400 truncate">{{ def.category }}</p>
              </div>
              <span class="ml-auto text-slate-300 group-hover:text-brand-400 transition-colors">→</span>
            </button>
          </div>
        </div>

        <!-- Recent activity -->
        <div>
          <h3 class="font-semibold text-slate-700 mb-3">最近动态</h3>
          <div class="space-y-3">
            <div v-for="notif in notifStore.notifications.slice(0, 4)" :key="notif.id"
              @click="router.push('/notifications')"
              class="flex gap-3 cursor-pointer group">
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                :class="notifTypeStyle[notif.type]">
                {{ notifTypeIcon[notif.type] }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium text-slate-700 group-hover:text-brand-700 transition-colors line-clamp-2">
                  {{ notif.message }}
                </p>
                <p class="text-xs text-slate-400 mt-0.5">{{ formatRelative(notif.created_at) }}</p>
              </div>
              <div v-if="!notif.is_read" class="w-2 h-2 rounded-full bg-brand-500 mt-1 flex-shrink-0" />
            </div>
            <EmptyState v-if="!notifStore.notifications.length" icon="📭" title="暂无通知" />
          </div>
        </div>
      </div>
    </div>

    <!-- Recent instances -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-slate-700">近期流程</h3>
        <RouterLink to="/instances" class="text-xs text-brand-600 hover:underline">全部 →</RouterLink>
      </div>
      <div class="grid md:grid-cols-2 gap-3">
        <InstanceCard
          v-for="inst in workflowStore.instances.slice(0, 6)"
          :key="inst.id"
          :instance="inst"
        />
      </div>
    </div>

    <!-- Submit modal -->
    <AppModal v-model="showSubmitModal" title="选择流程模板" size="md">
      <div class="space-y-2">
        <button v-for="def in workflowStore.definitions" :key="def.id"
          @click="router.push(`/submit/${def.id}`); showSubmitModal = false"
          class="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all text-left group">
          <span class="text-3xl">{{ def.icon }}</span>
          <div>
            <p class="font-medium text-slate-800 group-hover:text-brand-700">{{ def.name }}</p>
            <p class="text-sm text-slate-400">{{ def.description }}</p>
          </div>
        </button>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useAuthStore } from '@/stores/auth'
import { useWorkflowStore } from '@/stores/workflow'
import { useNotificationStore } from '@/stores/notifications'
import StatCard from '@/components/ui/StatCard.vue'
import InstanceCard from '@/components/workflow/InstanceCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AppModal from '@/components/ui/AppModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const workflowStore = useWorkflowStore()
const notifStore = useNotificationStore()

const showSubmitModal = ref(false)
const stats = computed(() => workflowStore.stats)

const hour = new Date().getHours()
const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'
const today = format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })

function formatRelative(d: string) {
  return formatDistanceToNow(new Date(d), { addSuffix: true, locale: zhCN })
}

const notifTypeIcon: Record<string, string> = {
  task_assigned: '📥', task_approved: '✅', task_rejected: '❌',
  task_cancelled: '🚫', comment_added: '💬'
}
const notifTypeStyle: Record<string, string> = {
  task_assigned: 'bg-blue-50 text-blue-600',
  task_approved: 'bg-emerald-50 text-emerald-600',
  task_rejected: 'bg-red-50 text-red-600',
  task_cancelled: 'bg-slate-100 text-slate-500',
  comment_added: 'bg-brand-50 text-brand-600'
}
</script>
