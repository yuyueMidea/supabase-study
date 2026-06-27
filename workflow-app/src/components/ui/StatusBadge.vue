<template>
  <span class="badge" :class="styles[status]">
    <span class="w-1.5 h-1.5 rounded-full" :class="dotColor[status]" />
    {{ labels[status] }}
  </span>
</template>

<script setup lang="ts">
import type { InstanceStatus } from '@/types'

defineProps<{ status: InstanceStatus }>()

const styles: Record<InstanceStatus, string> = {
  pending:   'status-pending',
  running:   'status-running',
  approved:  'status-approved',
  rejected:  'status-rejected',
  cancelled: 'status-cancelled'
}
const dotColor: Record<InstanceStatus, string> = {
  pending:   'bg-slate-400',
  running:   'bg-blue-500 animate-pulse-dot',
  approved:  'bg-emerald-500',
  rejected:  'bg-red-500',
  cancelled: 'bg-slate-400'
}
const labels: Record<InstanceStatus, string> = {
  pending:   '待提交',
  running:   '进行中',
  approved:  '已通过',
  rejected:  '已驳回',
  cancelled: '已取消'
}
</script>
