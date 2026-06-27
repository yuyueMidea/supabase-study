<template>
  <div @click="$router.push(`/instances/${instance.id}`)"
    class="card p-4 cursor-pointer hover:border-brand-200 hover:shadow-md transition-all duration-150 group">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3 mb-3">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-xl flex-shrink-0">
          {{ instance.workflow_definitions?.icon ?? '📋' }}
        </span>
        <div class="min-w-0">
          <p class="font-semibold text-slate-800 text-sm truncate group-hover:text-brand-700 transition-colors">
            {{ instance.title }}
          </p>
          <p class="text-xs text-slate-400 truncate">{{ instance.workflow_definitions?.name }}</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <PriorityBadge :priority="instance.priority" />
        <StatusBadge :status="instance.status" />
      </div>
    </div>

    <!-- Stepper preview -->
    <div v-if="instance.workflow_definitions?.steps" class="mb-3">
      <WorkflowStepper
        :steps="instance.workflow_definitions.steps"
        :current-step="instance.current_step"
        :status="instance.status"
      />
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between text-xs text-slate-400">
      <div class="flex items-center gap-3">
        <span>发起人：{{ instance.creator?.full_name ?? '—' }}</span>
        <span v-if="instance.assignee_id">
          待审批：<span class="text-slate-600 font-medium">{{ instance.assignee?.full_name ?? '—' }}</span>
        </span>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="instance.due_date" :class="isOverdue ? 'text-red-500 font-medium' : ''">
          {{ isOverdue ? '⚠️ ' : '' }}截止 {{ formatDate(instance.due_date) }}
        </span>
        <span>{{ formatRelative(instance.updated_at) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDistanceToNow, format, isPast } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { WorkflowInstance } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import PriorityBadge from '@/components/ui/PriorityBadge.vue'
import WorkflowStepper from './WorkflowStepper.vue'

const props = defineProps<{ instance: WorkflowInstance }>()

const isOverdue = computed(() =>
  props.instance.due_date && isPast(new Date(props.instance.due_date)) &&
  props.instance.status === 'running'
)

function formatDate(d: string) {
  return format(new Date(d), 'MM/dd')
}
function formatRelative(d: string) {
  return formatDistanceToNow(new Date(d), { addSuffix: true, locale: zhCN })
}
</script>
