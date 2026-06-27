<template>
  <div class="card p-4">
    <div class="flex items-start justify-between mb-2">
      <span class="text-2xl">{{ icon }}</span>
      <span class="text-2xl font-bold" :class="`text-${color}-600`">{{ value }}</span>
    </div>
    <p class="text-sm text-slate-500 font-medium">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  label: string
  value: number
  color: string
}>()
</script>
