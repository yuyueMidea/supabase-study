<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'
import { useAuthStore } from '@/stores/auth'
import InstanceCard from '@/components/workflow/InstanceCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { InstanceStatus } from '@/types'

const workflowStore = useWorkflowStore()
const authStore = useAuthStore()

const activeStatus = ref<InstanceStatus | 'all'>('all')

const statusFilters: { label: string; value: InstanceStatus | 'all'; icon: string }[] = [
  { label: '全部', value: 'all', icon: '📋' },
  { label: '进行中', value: 'running', icon: '🔄' },
  { label: '待处理', value: 'pending', icon: '⏳' },
  { label: '已通过', value: 'approved', icon: '✅' },
  { label: '已驳回', value: 'rejected', icon: '❌' },
  { label: '已取消', value: 'cancelled', icon: '🚫' },
]

const mySubmissions = computed(() => workflowStore.mySubmissions)

const filteredSubmissions = computed(() => {
  if (activeStatus.value === 'all') return mySubmissions.value
  return mySubmissions.value.filter(i => i.status === activeStatus.value)
})

const countFor = (status: InstanceStatus | 'all') =>
  status === 'all'
    ? mySubmissions.value.length
    : mySubmissions.value.filter(i => i.status === status).length

onMounted(() => {
  workflowStore.fetchInstances({ created_by: authStore.user?.id })
})
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-lg font-bold text-slate-800">我的申请</h2>
        <p class="text-sm text-slate-400">您发起的所有流程记录</p>
      </div>
      <RouterLink to="/workflows" class="btn-primary">
        ＋ 发起新申请
      </RouterLink>
    </div>

    <!-- Status tabs -->
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="f in statusFilters"
        :key="f.value"
        @click="activeStatus = f.value"
        class="btn btn-sm transition-all"
        :class="activeStatus === f.value ? 'btn-primary' : 'btn-secondary'"
      >
        {{ f.icon }} {{ f.label }}
        <span class="ml-1 opacity-60">({{ countFor(f.value) }})</span>
      </button>
    </div>

    <!-- List -->
    <TransitionGroup name="fade" tag="div" class="space-y-3">
      <InstanceCard
        v-for="inst in filteredSubmissions"
        :key="inst.id"
        :instance="inst"
      />
    </TransitionGroup>

    <EmptyState
      v-if="!filteredSubmissions.length"
      icon="📄"
      title="暂无申请记录"
      :description="activeStatus === 'all' ? '您还没有发起过任何申请，点击右上角开始吧！' : `暂无「${statusFilters.find(f=>f.value===activeStatus)?.label}」的申请`"
    />
  </div>
</template>
