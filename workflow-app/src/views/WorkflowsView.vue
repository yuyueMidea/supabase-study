<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'
import { useAuthStore } from '@/stores/auth'
import EmptyState from '@/components/ui/EmptyState.vue'

const router = useRouter()
const workflowStore = useWorkflowStore()
const authStore = useAuthStore()

const search = ref('')
const activeCategory = ref('全部')

const categories = computed(() => {
  const cats = new Set(workflowStore.definitions.map(d => d.category))
  return ['全部', ...cats]
})

const filtered = computed(() => {
  let list = workflowStore.definitions
  if (activeCategory.value !== '全部') {
    list = list.filter(d => d.category === activeCategory.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    )
  }
  return list
})

const stepTypeLabel: Record<string, string> = {
  start: '开始', approval: '审批', review: '审核',
  notification: '通知', end: '结束'
}

onMounted(() => workflowStore.fetchDefinitions())
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-lg font-bold text-slate-800">工作流模板</h2>
        <p class="text-sm text-slate-400">选择模板，发起申请流程</p>
      </div>
      <RouterLink v-if="authStore.isAdmin" to="/workflows/new" class="btn-primary">
        ＋ 新建模板
      </RouterLink>
    </div>

    <!-- Search + category filter -->
    <div class="flex flex-col sm:flex-row gap-3">
      <input
        v-model="search"
        type="text"
        placeholder="搜索流程模板..."
        class="input max-w-xs"
      />
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="activeCategory = cat"
          class="btn btn-sm"
          :class="activeCategory === cat ? 'btn-primary' : 'btn-secondary'"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Grid of workflow cards -->
    <div v-if="filtered.length" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="def in filtered"
        :key="def.id"
        class="card p-5 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
        @click="router.push(`/submit/${def.id}`)"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            :style="`background-color: ${def.color}18`">
            {{ def.icon }}
          </div>
          <span class="badge bg-slate-100 text-slate-500 text-xs">{{ def.category }}</span>
        </div>

        <!-- Name + desc -->
        <h3 class="font-semibold text-slate-800 group-hover:text-brand-700 transition-colors mb-1">
          {{ def.name }}
        </h3>
        <p class="text-sm text-slate-400 line-clamp-2 flex-1">{{ def.description }}</p>

        <!-- Steps preview -->
        <div class="mt-4 flex items-center gap-1 flex-wrap">
          <template v-for="(step, idx) in def.steps" :key="step.id">
            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {{ step.name }}
            </span>
            <span v-if="idx < def.steps.length - 1" class="text-slate-300 text-xs">→</span>
          </template>
        </div>

        <!-- CTA -->
        <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-400">{{ def.steps.length }} 个步骤</span>
          <span class="btn-primary btn btn-sm opacity-0 group-hover:opacity-100 transition-opacity">
            发起申请 →
          </span>
        </div>
      </div>
    </div>

    <EmptyState
      v-else
      icon="🔍"
      title="没有找到匹配的模板"
      description="尝试修改搜索关键词或切换分类"
    />
  </div>
</template>
