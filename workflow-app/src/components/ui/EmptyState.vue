<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <span class="text-5xl mb-4">{{ icon }}</span>
    <h3 class="text-base font-semibold text-slate-700 mb-1">{{ title }}</h3>
    <p v-if="description" class="text-sm text-slate-400 max-w-xs">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  description?: string
}>()
</script>
