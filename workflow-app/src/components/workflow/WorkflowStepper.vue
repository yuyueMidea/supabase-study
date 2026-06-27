<template>
  <div class="flex items-start">
    <div v-for="(step, idx) in steps" :key="step.id" class="flex items-start flex-1">
      <!-- Step dot + line -->
      <div class="flex flex-col items-center flex-shrink-0">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all"
          :class="stepStyle(step, idx)"
        >
          <span v-if="getStepStatus(step, idx) === 'done'">✓</span>
          <span v-else-if="getStepStatus(step, idx) === 'active'" class="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span v-else class="text-xs text-slate-400">{{ idx + 1 }}</span>
        </div>
        <span class="text-xs text-center mt-1 max-w-[70px] leading-tight"
          :class="getStepStatus(step, idx) === 'active' ? 'text-brand-700 font-semibold' :
                  getStepStatus(step, idx) === 'done'   ? 'text-emerald-600' : 'text-slate-400'">
          {{ step.name }}
        </span>
      </div>

      <!-- Connector line -->
      <div v-if="idx < steps.length - 1" class="flex-1 h-0.5 mt-4 mx-1 transition-colors"
        :class="getStepStatus(step, idx) === 'done' ? 'bg-emerald-400' : 'bg-slate-200'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkflowStep } from '@/types'

const props = defineProps<{
  steps: WorkflowStep[]
  currentStep: string
  status: string
}>()

function getStepStatus(step: WorkflowStep, idx: number) {
  const currentIdx = props.steps.findIndex(s => s.id === props.currentStep)
  if (props.status === 'approved') return 'done'
  if (props.status === 'rejected') {
    return idx < currentIdx ? 'done' : idx === currentIdx ? 'rejected' : 'pending'
  }
  if (idx < currentIdx) return 'done'
  if (idx === currentIdx) return 'active'
  return 'pending'
}

function stepStyle(step: WorkflowStep, idx: number) {
  const s = getStepStatus(step, idx)
  if (s === 'done')     return 'bg-emerald-500 border-emerald-500 text-white'
  if (s === 'active')   return 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-200'
  if (s === 'rejected') return 'bg-red-500 border-red-500 text-white'
  return 'bg-white border-slate-200 text-slate-300'
}
</script>
