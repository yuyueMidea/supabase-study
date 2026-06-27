<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
        <div v-for="toast in toastStore.toasts" :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border animate-slide-in"
          :class="typeStyles[toast.type]"
        >
          <span class="text-lg flex-shrink-0 mt-0.5">{{ typeIcons[toast.type] }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm">{{ toast.title }}</p>
            <p v-if="toast.message" class="text-sm opacity-80 mt-0.5">{{ toast.message }}</p>
          </div>
          <button @click="toastStore.remove(toast.id)" class="opacity-50 hover:opacity-100 flex-shrink-0 transition-opacity">
            <span class="text-sm">✕</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()

const typeStyles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  error:   'bg-red-50 border-red-200 text-red-900',
  info:    'bg-blue-50 border-blue-200 text-blue-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900'
}

const typeIcons = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
  warning: '⚠️'
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.25s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from   { opacity: 0; transform: translateX(100%); }
.toast-leave-to     { opacity: 0; transform: translateX(100%); }
.toast-move         { transition: transform 0.2s ease; }
</style>
