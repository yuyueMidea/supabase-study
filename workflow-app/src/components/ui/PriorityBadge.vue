<template>
  <span class="badge" :class="styles[priority]">{{ labels[priority] }}</span>
</template>

<script setup lang="ts">
import type { WorkflowInstance } from '@/types'

defineProps<{ priority: WorkflowInstance['priority'] }>()

const styles = {
  low:    'priority-low',
  normal: 'priority-normal',
  high:   'priority-high',
  urgent: 'priority-urgent'
}
const labels = {
  low: '低', normal: '普通', high: '紧急', urgent: '非常紧急'
}
</script>
