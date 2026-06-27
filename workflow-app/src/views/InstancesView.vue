<template>
  <div class="p-6 max-w-5xl mx-auto space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-lg font-bold text-slate-800">全部流程</h2>
        <p class="text-sm text-slate-400">查看所有工作流申请记录</p>
      </div>
      <button @click="$router.push('/workflows')" class="btn-secondary">
        ＋ 发起申请
      </button>
    </div>

    <!-- Search & Filters -->
    <div class="card p-4 space-y-3">
      <div class="flex gap-3 flex-wrap">
        <input
          v-model="search"
          class="input flex-1 min-w-[200px]"
          placeholder="🔍 搜索标题、发起人..."
        />
        <select v-model="statusFilter" class="input w-36">
          <option value="">全部状态</option>
          <option value="pending">待提交</option>
          <option value="running">进行中</option>
          <option value="approved">已通过</option>
          <option value="rejected">已驳回</option>
          <option value="cancelled">已取消</option>
        </select>
        <select v-model="priorityFilter" class="input w-36">
          <option value="">全部优先级</option>
          <option value="urgent">非常紧急</option>
          <option value="high">紧急</option>
          <option value="normal">普通</option>
          <option value="low">低</option>
        </select>
        <select v-model="definitionFilter" class="input w-40">
          <option value="">全部流程</option>
          <option v-for="d in workflowStore.definitions" :key="d.id" :value="d.id">
            {{ d.icon }} {{ d.name }}
          </option>
        </select>
      </div>

      <!-- View toggle + scope -->
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex gap-1">
          <button v-for="s in scopes" :key="s.value"
            @click="scope = s.value"
            class="btn btn-sm"
            :class="scope === s.value ? 'btn-primary' : 'btn-ghost'">
            {{ s.label }}
          </button>
        </div>
        <span class="text-xs text-slate-400 ml-auto">共 {{ filtered.length }} 条</span>
      </div>
    </div>

    <!-- List -->
    <TransitionGroup name="fade" tag="div" class="space-y-3">
      <InstanceCard v-for="inst in paginated" :key="inst.id" :instance="inst" />
    </TransitionGroup>

    <EmptyState v-if="!filtered.length"
      icon="📭" title="没有匹配的流程" description="尝试修改筛选条件" />

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-2">
      <button :disabled="page <= 1" @click="page--" class="btn-secondary btn-sm">上一页</button>
      <span class="text-sm text-slate-500">{{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="page++" class="btn-secondary btn-sm">下一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useWorkflowStore } from '@/stores/workflow'
import InstanceCard from '@/components/workflow/InstanceCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const authStore = useAuthStore()
const workflowStore = useWorkflowStore()

const search = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const definitionFilter = ref('')
const scope = ref('all')
const page = ref(1)
const PAGE_SIZE = 10

const scopes = [
  { label: '全部', value: 'all' },
  { label: '我发起的', value: 'mine' },
  { label: '我处理的', value: 'assigned' }
]

const filtered = computed(() => {
  let list = workflowStore.instances

  if (scope.value === 'mine') list = list.filter(i => i.created_by === authStore.user?.id)
  if (scope.value === 'assigned') list = list.filter(i => i.assignee_id === authStore.user?.id)
  if (statusFilter.value) list = list.filter(i => i.status === statusFilter.value)
  if (priorityFilter.value) list = list.filter(i => i.priority === priorityFilter.value)
  if (definitionFilter.value) list = list.filter(i => i.definition_id === definitionFilter.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.creator?.full_name?.toLowerCase().includes(q) ||
      i.workflow_definitions?.name?.toLowerCase().includes(q)
    )
  }

  return list
})

const totalPages = computed(() => Math.ceil(filtered.value.length / PAGE_SIZE))
const paginated = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
</script>
