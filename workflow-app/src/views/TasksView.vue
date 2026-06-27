<template>
  <div class="p-6 max-w-4xl mx-auto space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-bold text-slate-800">我的待办</h2>
        <p class="text-sm text-slate-400">分配给您、需要处理的流程</p>
      </div>
      <span class="badge bg-brand-50 text-brand-700 text-sm px-3 py-1">
        {{ workflowStore.myTasks.length }} 项待办
      </span>
    </div>

    <!-- Priority filter -->
    <div class="flex gap-2 flex-wrap">
      <button v-for="f in filters" :key="f.value"
        @click="activeFilter = f.value"
        class="btn btn-sm transition-all"
        :class="activeFilter === f.value ? 'btn-primary' : 'btn-secondary'">
        {{ f.label }}
        <span v-if="f.count !== undefined" class="ml-1 opacity-70">({{ f.count }})</span>
      </button>
    </div>

    <!-- Task list -->
    <TransitionGroup name="slide-up" tag="div" class="space-y-3">
      <InstanceCard
        v-for="inst in filteredTasks"
        :key="inst.id"
        :instance="inst"
      />
    </TransitionGroup>

    <EmptyState v-if="!filteredTasks.length"
      icon="🎉"
      title="没有待办任务"
      description="当前没有需要您处理的流程，休息一下吧！"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'
import InstanceCard from '@/components/workflow/InstanceCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const workflowStore = useWorkflowStore()
const activeFilter = ref('all')

const filters = computed(() => [
  { label: '全部', value: 'all', count: workflowStore.myTasks.length },
  { label: '⚡ 非常紧急', value: 'urgent', count: workflowStore.myTasks.filter(t => t.priority === 'urgent').length },
  { label: '🔴 紧急', value: 'high', count: workflowStore.myTasks.filter(t => t.priority === 'high').length },
  { label: '🔵 普通', value: 'normal', count: workflowStore.myTasks.filter(t => t.priority === 'normal').length },
])

const filteredTasks = computed(() => {
  if (activeFilter.value === 'all') return workflowStore.myTasks
  return workflowStore.myTasks.filter(t => t.priority === activeFilter.value)
})
</script>
