<template>
  <div class="p-6 max-w-5xl mx-auto space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-lg font-bold text-slate-800">流程模板</h2>
        <p class="text-sm text-slate-400">管理工作流定义与审批步骤</p>
      </div>
      <button @click="$router.push('/definitions/new/edit')" class="btn-primary">
        ＋ 新建模板
      </button>
    </div>

    <!-- Category filter -->
    <div class="flex gap-2 flex-wrap">
      <button v-for="cat in categories" :key="cat"
        @click="activeCategory = cat"
        class="btn btn-sm"
        :class="activeCategory === cat ? 'btn-primary' : 'btn-secondary'">
        {{ cat }}
      </button>
    </div>

    <!-- Definition grid -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="def in filteredDefs" :key="def.id"
        class="card p-5 hover:shadow-md transition-all group">
        <!-- Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              :style="`background: ${def.color}18`">
              {{ def.icon }}
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 group-hover:text-brand-700 transition-colors">
                {{ def.name }}
              </h3>
              <span class="text-xs text-slate-400">{{ def.category }}</span>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full" :class="def.is_active ? 'bg-emerald-400' : 'bg-slate-300'" />
            <span class="text-xs text-slate-400">{{ def.is_active ? '启用' : '停用' }}</span>
          </div>
        </div>

        <p class="text-sm text-slate-500 mb-4 line-clamp-2">{{ def.description }}</p>

        <!-- Steps preview -->
        <div class="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
          <div v-for="(step, idx) in def.steps" :key="step.id" class="flex items-center gap-1 flex-shrink-0">
            <span class="text-xs px-2 py-0.5 rounded-full"
              :class="step.type === 'start' ? 'bg-blue-50 text-blue-600' :
                      step.type === 'end'   ? 'bg-emerald-50 text-emerald-600' :
                      step.type === 'approval' ? 'bg-brand-50 text-brand-600' : 'bg-amber-50 text-amber-600'">
              {{ step.name }}
            </span>
            <span v-if="idx < def.steps.length - 1" class="text-slate-300 text-xs">→</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button @click="$router.push(`/submit/${def.id}`)" class="btn-primary btn-sm flex-1 justify-center">
            发起申请
          </button>
          <button @click="$router.push(`/definitions/${def.id}/edit`)" class="btn-secondary btn-sm">
            编辑
          </button>
          <button @click="toggleActive(def)" class="btn-ghost btn-sm" :title="def.is_active ? '停用' : '启用'">
            {{ def.is_active ? '⏸' : '▶' }}
          </button>
        </div>
      </div>
    </div>

    <EmptyState v-if="!filteredDefs.length"
      icon="⚙️" title="没有匹配的模板"
      description="点击右上角「新建模板」创建第一个工作流">
      <button @click="$router.push('/definitions/new/edit')" class="btn-primary mt-4">
        ＋ 新建模板
      </button>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'
import { useToastStore } from '@/stores/toast'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { WorkflowDefinition } from '@/types'

const workflowStore = useWorkflowStore()
const toast = useToastStore()
const activeCategory = ref('全部')

const categories = computed(() => {
  const cats = new Set(workflowStore.definitions.map(d => d.category))
  return ['全部', ...cats]
})

const filteredDefs = computed(() => {
  if (activeCategory.value === '全部') return workflowStore.definitions
  return workflowStore.definitions.filter(d => d.category === activeCategory.value)
})

async function toggleActive(def: WorkflowDefinition) {
  const { error } = await workflowStore.updateDefinition(def.id, { is_active: !def.is_active })
  if (error) toast.error('操作失败')
  else toast.success(def.is_active ? '已停用' : '已启用')
}
</script>
