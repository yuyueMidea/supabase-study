<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">
    <div class="flex items-center gap-3">
      <button @click="$router.back()" class="btn-ghost btn-sm">← 返回</button>
      <h2 class="text-lg font-bold text-slate-800">{{ isNew ? '新建模板' : '编辑模板' }}</h2>
    </div>

    <!-- Basic info -->
    <div class="card p-6 space-y-4">
      <h3 class="font-semibold text-slate-700">基本信息</h3>

      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="label">流程名称 <span class="text-red-500">*</span></label>
          <input v-model="form.name" class="input" placeholder="如：请假申请" required />
        </div>
        <div class="col-span-2">
          <label class="label">描述</label>
          <textarea v-model="form.description" rows="2" class="input resize-none"
            placeholder="简要描述此流程的用途..." />
        </div>
        <div>
          <label class="label">分类</label>
          <input v-model="form.category" class="input" placeholder="如：人事、财务、行政" />
        </div>
        <div>
          <label class="label">图标</label>
          <div class="flex gap-2">
            <input v-model="form.icon" class="input flex-1" placeholder="Emoji 图标" />
            <div class="flex gap-1 flex-wrap">
              <button v-for="e in ['📋','🏖️','💰','📦','✈️','🔧','📊','🎯']" :key="e"
                @click="form.icon = e" type="button"
                class="w-9 h-9 rounded-lg border hover:border-brand-400 text-lg flex items-center justify-center"
                :class="form.icon === e ? 'border-brand-400 bg-brand-50' : 'border-slate-200'">
                {{ e }}
              </button>
            </div>
          </div>
        </div>
        <div>
          <label class="label">主题色</label>
          <div class="flex gap-2">
            <input v-model="form.color" type="color" class="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
            <div class="flex gap-1">
              <button v-for="c in colors" :key="c"
                @click="form.color = c" type="button"
                class="w-7 h-7 rounded-full border-2 transition-all"
                :class="form.color === c ? 'border-slate-700 scale-110' : 'border-transparent'"
                :style="`background:${c}`" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Steps editor -->
    <div class="card p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-slate-700">审批步骤</h3>
        <button @click="addStep" class="btn-secondary btn-sm">＋ 添加步骤</button>
      </div>

      <div class="space-y-3">
        <TransitionGroup name="slide-up">
          <div v-for="(step, idx) in form.steps" :key="step.id"
            class="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
            <!-- Step header -->
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                :class="step.type === 'start' ? 'bg-blue-100 text-blue-700' :
                        step.type === 'end' ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700'">
                {{ idx + 1 }}
              </div>
              <div class="flex-1 grid grid-cols-2 gap-2">
                <input v-model="step.name" class="input input-sm text-sm" placeholder="步骤名称" />
                <select v-model="step.type" class="input input-sm text-sm">
                  <option value="start">开始</option>
                  <option value="approval">审批</option>
                  <option value="review">审核</option>
                  <option value="notification">通知</option>
                  <option value="end">结束</option>
                </select>
              </div>
              <button v-if="form.steps.length > 2" @click="removeStep(idx)"
                class="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center">
                ✕
              </button>
            </div>

            <!-- Step config -->
            <div class="grid grid-cols-2 gap-3 pl-9">
              <div>
                <label class="text-xs text-slate-500 mb-1 block">处理人角色</label>
                <select v-model="step.assignee_role" class="input text-sm">
                  <option value="self">发起人本人</option>
                  <option value="manager">直属主管</option>
                  <option value="hr">HR专员</option>
                  <option value="admin">管理员</option>
                  <option value="specific_user">指定人员</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-slate-500 mb-1 block">超时处理（小时）</label>
                <input v-model.number="step.timeout_hours" type="number" class="input text-sm" placeholder="不限" min="1" />
              </div>
              <div class="col-span-2 flex gap-4">
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input v-model="step.allow_comment" type="checkbox" class="rounded" />
                  允许填写意见
                </label>
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input v-model="step.required_comment" type="checkbox" class="rounded" :disabled="!step.allow_comment" />
                  意见为必填
                </label>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Preview -->
      <div class="pt-2 border-t border-slate-100">
        <p class="text-xs text-slate-400 mb-2">步骤预览</p>
        <WorkflowStepper
          :steps="form.steps"
          :current-step="form.steps[1]?.id ?? form.steps[0]?.id"
          status="running"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3">
      <button @click="$router.back()" class="btn-secondary">取消</button>
      <button @click="handleSave" class="btn-primary" :disabled="saving || !form.name">
        {{ saving ? '保存中...' : (isNew ? '创建模板' : '保存更改') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'
import { useToastStore } from '@/stores/toast'
import type { WorkflowStep } from '@/types'
import WorkflowStepper from '@/components/workflow/WorkflowStepper.vue'

const route = useRoute()
const router = useRouter()
const workflowStore = useWorkflowStore()
const toast = useToastStore()

const isNew = route.params.id === 'new'
const saving = ref(false)

const colors = ['#6270f3', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

const form = reactive({
  name: '',
  description: '',
  category: '其他',
  icon: '📋',
  color: '#6270f3',
  is_active: true,
  steps: [
    { id: 'submit', name: '提交申请', type: 'start' as const, assignee_role: 'self' as const, allow_comment: true, required_comment: false },
    { id: 'review', name: '审批', type: 'approval' as const, assignee_role: 'manager' as const, allow_comment: true, required_comment: false },
    { id: 'done', name: '完成', type: 'end' as const, assignee_role: 'self' as const, allow_comment: false, required_comment: false }
  ] as WorkflowStep[]
})

onMounted(() => {
  if (!isNew) {
    const def = workflowStore.definitions.find(d => d.id === route.params.id)
    if (def) {
      Object.assign(form, { ...def, steps: [...def.steps.map(s => ({ ...s }))] })
    }
  }
})

function addStep() {
  const newStep: WorkflowStep = {
    id: `step-${Date.now()}`,
    name: '审批步骤',
    type: 'approval',
    assignee_role: 'manager',
    allow_comment: true,
    required_comment: false
  }
  // Insert before the last 'end' step
  const endIdx = [...form.steps].reverse().findIndex((s: any) => s.type === 'end') 
  const resolvedEndIdx = endIdx === -1 ? -1 : form.steps.length - 1 - endIdx

  if (resolvedEndIdx > -1) form.steps.splice(resolvedEndIdx, 0, newStep)
  else form.steps.push(newStep)
}

function removeStep(idx: number) {
  form.steps.splice(idx, 1)
}

async function handleSave() {
  if (!form.name.trim()) { toast.warning('请填写流程名称'); return }
  saving.value = true

  try {
    if (isNew) {
      const { error } = await workflowStore.createDefinition({ ...form })
      if (error) { toast.error('创建失败'); return }
      toast.success('模板创建成功')
    } else {
      const { error } = await workflowStore.updateDefinition(String(route.params.id), { ...form })
      if (error) { toast.error('保存失败'); return }
      toast.success('模板已更新')
    }
    router.push('/definitions')
  } finally {
    saving.value = false
  }
}
</script>
