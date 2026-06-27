<template>
  <RouterLink :to="to"
    class="flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors relative group"
    :class="isActive
      ? 'bg-brand-50 text-brand-700'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
  >
    <span class="text-base w-5 text-center flex-shrink-0">{{ icon }}</span>

    <Transition name="fade">
      <span v-if="!collapsed" class="flex-1 truncate">{{ label }}</span>
    </Transition>

    <Transition name="fade">
      <span v-if="!collapsed && badge"
        class="ml-auto text-xs font-bold bg-brand-600 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
        {{ badge }}
      </span>
    </Transition>

    <!-- Collapsed badge -->
    <span v-if="collapsed && badge"
      class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
      {{ Math.min(badge, 9) }}
    </span>

    <!-- Tooltip when collapsed -->
    <div v-if="collapsed"
      class="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap
             opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
      {{ label }}
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps<{
  to: string
  icon: string
  label: string
  badge?: number
  collapsed?: boolean
}>()

const route = useRoute()
const isActive = computed(() =>
  props.to === '/' ? route.path === '/' : route.path.startsWith(props.to)
)
</script>
