<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'
import { useToastStore } from '@/stores/toast'
import type { WorkflowDefinition, WorkflowStep } from '@/types'

const router = useRouter()
const route = useRoute()
const workflowStore = useWorkflowStore()
const toast = useToastStore()

const isNew = computed(() => route.name === 'workflow-new')
const saving = ref(false)

// Form state
const form = reactive<Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at' | 'created_by'>>({
  name: '',
  description: '',
  category: '人事',
  icon: '📋',
  color: '#6270f3',
  is_active: true,
  steps: [
    { id: 'submit', name: '提交申请', type: 'start', assignee_role: 'self', allow_comment: true, required_comment: false },
    { id: 'approve', name: '审批', type: 'approval', assignee_role: 'manager', allow_comment: true, required_comment: false },
    { id: 'done', name: '完成', type: 'end', assignee_role: 'self', allow_comment: false, required_comment: false }
  ]
})

const categories = ['人事', '财务', '行政', '技术', '市场', '其他']
const icons = ['📋', '🏖️', '💰', '📦', '🚀', '📝', '🎯', '🔧', '📊', '✈️', '🏥', '🎓']
const colors = ['#6270f3', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

const assigneeRoles = [
  { value: 'self', label: '申请人自己' },
  { value: 'manager', label: '直属主管' },
  { value: 'hr', label: 'HR人事' },
  { value: 'admin', label: '管理员' },
]

const stepTypes = [
  { value: 'start', label: '开始节点' },
  { value: 'approval', label: '审批节点' },
  { value: 'review', label: '审核节点' },
  { value: 'notification', label: '通知节点' },
  { value: 'end', label: '结束节点' },
]

// Editing specific step
const editingStepIdx = ref<number | null>(null)
const editingStep = ref<WorkflowStep | null>(null)

function openStepEditor(idx: number) {
  editingStepIdx.value = idx
  editingStep.value = { ...form.steps[idx] }
}

function saveStep() {
  if (editingStepIdx.value !== null && editingStep.value) {
    form.steps[editingStepIdx.value] = { ...editingStep.value }
    editingStepIdx.value = null
    editingStep.value = null
  }
}

function addStep() {
  const newStep: WorkflowStep = {
    id: `step_${Date.now()}`,
    name: '新步骤',
    type: 'approval',
    assignee_role: 'manager',
    allow_comment: true,
    required_comment: false
  }
  // Insert before the last "end" step
  const endIdx = form.steps.findIndex(s => s.type === 'end')
  if (endIdx > -1) {
    form.steps.splice(endIdx, 0, newStep)
  } else {
    form.steps.push(newStep)
  }
}

function removeStep(idx: number) {
  if (form.steps.length <= 2) {
    toast.warning('至少保留2个步骤')
    return
  }
  form.steps.splice(idx, 1)
}

function moveStep(idx: number, dir: -1 | 1) {
  const target = idx + dir
  if (target < 0 || target >= form.steps.length) return
  const tmp = form.steps[idx]
  form.steps[idx] = form.steps[target]
  form.steps[target] = tmp
}

async function save() {
  if (!form.name.trim()) { toast.error('请填写模板名称'); return }
  if (form.steps.length < 2) { toast.error('至少需要2个步骤'); return }

  saving.value = true
  try {
    if (isNew.value) {
      const { error } = await workflowStore.createDefinition(form)
      if (error) throw error
      toast.success('模板创建成功')
    } else {
      const { error } = await workflowStore.updateDefinition(route.params.id as string, form)
      if (error) throw error
      toast.success('模板更新成功')
    }
    router.push('/workflows')
  } catch (e: any) {
    toast.error('保存失败', e?.message)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await workflowStore.fetchDefinitions()
  if (!isNew.value) {
    const def = workflowStore.definitions.find(d => d.id === route.params.id)
    if (def) {
      Object.assign(form, {
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        color: def.color,
        is_active: def.is_active,
        steps: JSON.parse(JSON.stringify(def.steps))
      })
    }
  }
})

const stepTypeColors: Record<string, string> = {
  start: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  approval: 'bg-brand-100 text-brand-700 border-brand-200',
  review: 'bg-amber-100 text-amber-700 border-amber-200',
  notification: 'bg-sky-100 text-sky-700 border-sky-200',
  end: 'bg-slate-100 text-slate-600 border-slate-200'
}

const stepTypeIcons: Record<string, string> = {
  start: '▶️', approval: '✅', review: '🔍', notification: '🔔', end: '🏁'
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="router.back()" class="btn-ghost btn-sm">← 返回</button>
      <h2 class="text-lg font-bold text-slate-800">
        {{ isNew ? '新建工作流模板' : '编辑工作流模板' }}
      </h2>
    </div>

    <div class="grid lg:grid-cols-5 gap-6">
      <!-- Left: form fields -->
      <div class="lg:col-span-2 space-y-5">
        <div class="card p-5 space-y-4">
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide">基本信息</h3>

          <div>
            <label class="label">模板名称 <span class="text-red-500">*</span></label>
            <input v-model="form.name" class="input" placeholder="如：请假申请" />
          </div>

          <div>
            <label class="label">描述</label>
            <textarea v-model="form.description" rows="3" class="input resize-none"
              placeholder="简要说明该流程的用途和适用场景" />
          </div>

          <div>
            <label class="label">分类</label>
            <select v-model="form.category" class="input">
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <div>
            <label class="label">图标</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="ic in icons" :key="ic"
                @click="form.icon = ic"
                class="w-9 h-9 rounded-lg text-xl flex items-center justify-center border-2 transition-all hover:scale-110"
                :class="form.icon === ic ? 'border-brand-500 bg-brand-50' : 'border-transparent bg-slate-100 hover:bg-slate-200'"
              >{{ ic }}</button>
            </div>
          </div>

          <div>
            <label class="label">主题色</label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="c in colors" :key="c"
                @click="form.color = c"
                class="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                :style="`background-color: ${c}`"
                :class="form.color === c ? 'border-slate-800 scale-110' : 'border-white'"
              />
            </div>
          </div>

          <div class="flex items-center gap-3">
            <label class="label mb-0">启用状态</label>
            <button
              @click="form.is_active = !form.is_active"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="form.is_active ? 'bg-brand-600' : 'bg-slate-300'"
            >
              <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                :class="form.is_active ? 'translate-x-6' : 'translate-x-1'" />
            </button>
            <span class="text-sm text-slate-500">{{ form.is_active ? '已启用' : '已禁用' }}</span>
          </div>
        </div>
      </div>

      <!-- Right: steps builder -->
      <div class="lg:col-span-3 space-y-4">
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide">审批步骤</h3>
            <button @click="addStep" class="btn-secondary btn-sm">＋ 添加步骤</button>
          </div>

          <!-- Step list -->
          <div class="space-y-2">
            <div
              v-for="(step, idx) in form.steps"
              :key="step.id"
              class="flex items-center gap-3 p-3 rounded-xl border transition-all"
              :class="[stepTypeColors[step.type], editingStepIdx === idx ? 'ring-2 ring-brand-400' : 'hover:shadow-sm']"
            >
              <span class="text-lg flex-shrink-0">{{ stepTypeIcons[step.type] }}</span>

              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate">{{ step.name }}</p>
                <p class="text-xs text-slate-500">
                  {{ stepTypes.find(t => t.value === step.type)?.label }} ·
                  {{ assigneeRoles.find(r => r.value === step.assignee_role)?.label }}
                </p>
              </div>

              <div class="flex items-center gap-1 flex-shrink-0">
                <button @click="moveStep(idx, -1)" :disabled="idx === 0"
                  class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs">↑</button>
                <button @click="moveStep(idx, 1)" :disabled="idx === form.steps.length - 1"
                  class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs">↓</button>
                <button @click="openStepEditor(idx)"
                  class="w-6 h-6 flex items-center justify-center text-brand-400 hover:text-brand-700 text-xs">✏️</button>
                <button @click="removeStep(idx)" :disabled="step.type === 'start' || step.type === 'end'"
                  class="w-6 h-6 flex items-center justify-center text-red-300 hover:text-red-600 disabled:opacity-20 text-xs">✕</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step editor panel -->
        <div v-if="editingStep" class="card p-5 border-brand-200 bg-brand-50/30">
          <h3 class="text-sm font-semibold text-brand-700 mb-4">✏️ 编辑步骤</h3>
          <div class="space-y-3">
            <div>
              <label class="label">步骤名称</label>
              <input v-model="editingStep.name" class="input" placeholder="审批步骤名称" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">步骤类型</label>
                <select v-model="editingStep.type" class="input">
                  <option v-for="t in stepTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
              </div>
              <div>
                <label class="label">处理人</label>
                <select v-model="editingStep.assignee_role" class="input">
                  <option v-for="r in assigneeRoles" :key="r.value" :value="r.value">{{ r.label }}</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">超时小时数（0=不限）</label>
                <input v-model.number="editingStep.timeout_hours" type="number" min="0" class="input" placeholder="48" />
              </div>
              <div>
                <label class="label">超时操作</label>
                <select v-model="editingStep.timeout_action" class="input">
                  <option value="">不操作</option>
                  <option value="approve">自动通过</option>
                  <option value="reject">自动驳回</option>
                </select>
              </div>
            </div>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="editingStep.allow_comment" class="rounded" />
                <span class="text-sm text-slate-700">允许填写意见</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="editingStep.required_comment" class="rounded" />
                <span class="text-sm text-slate-700">必须填写意见</span>
              </label>
            </div>
            <div class="flex gap-2">
              <button @click="saveStep" class="btn-primary btn-sm">保存步骤</button>
              <button @click="editingStepIdx = null; editingStep = null" class="btn-secondary btn-sm">取消</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Save bar -->
    <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
      <button @click="router.back()" class="btn-secondary">取消</button>
      <button @click="save" :disabled="saving" class="btn-primary">
        {{ saving ? '保存中...' : (isNew ? '创建模板' : '保存修改') }}
      </button>
    </div>
  </div>
</template>
