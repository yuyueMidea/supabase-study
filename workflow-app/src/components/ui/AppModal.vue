<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('update:modelValue', false)"
      >
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
        <div
          class="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden animate-fade-in"
          :class="sizeClasses[size ?? 'md']"
        >
          <div v-if="title" class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 class="text-lg font-semibold text-slate-800">{{ title }}</h2>
            <button @click="$emit('update:modelValue', false)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              ✕
            </button>
          </div>
          <div :class="bodyPadding !== false ? 'p-6' : ''">
            <slot />
          </div>
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  bodyPadding?: boolean
}>(), { size: 'md', bodyPadding: true })

defineEmits<{ 'update:modelValue': [boolean] }>()

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl'
}
</script>
