<template>
  <div v-if="instance" class="p-6 max-w-4xl mx-auto space-y-6">
    <!-- Back + header -->
    <div>
      <button @click="$router.back()" class="btn-ghost btn-sm mb-3">← 返回</button>
      <div class="flex items-start justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <span class="text-4xl">{{ instance.workflow_definitions?.icon }}</span>
          <div>
            <h2 class="text-xl font-bold text-slate-800">{{ instance.title }}</h2>
            <p class="text-sm text-slate-400">{{ instance.workflow_definitions?.name }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <PriorityBadge :priority="instance.priority" />
          <StatusBadge :status="instance.status" />
        </div>
      </div>
    </div>

    <!-- Progress stepper -->
    <div class="card p-6">
      <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">审批进度</h3>
      <WorkflowStepper
        :steps="instance.workflow_definitions?.steps ?? []"
        :current-step="instance.current_step"
        :status="instance.status"
      />
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Main content -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Business data -->
        <div class="card p-6">
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">申请内容</h3>
          <dl class="space-y-3">
            <div v-for="(val, key) in instance.payload" :key="key"
              class="flex justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
              <dt class="text-sm text-slate-500 capitalize">{{ formatKey(String(key)) }}</dt>
              <dd class="text-sm font-medium text-slate-800 text-right">{{ formatValue(val) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Approval action panel -->
        <div v-if="canAct" class="card p-6 border-brand-200 bg-brand-50/30">
          <h3 class="text-sm font-semibold text-brand-700 uppercase tracking-wide mb-4">
            📥 当前步骤：{{ currentStepDef?.name }}
          </h3>

          <div class="mb-4">
            <label class="label">审批意见
              <span v-if="currentStepDef?.required_comment" class="text-red-500 ml-1">*</span>
            </label>
            <textarea v-model="comment" rows="3" class="input resize-none"
              placeholder="请输入审批意见（可选）" />
          </div>

          <div class="flex gap-3 flex-wrap">
            <button @click="handleApprove" class="btn-primary" :disabled="acting">
              {{ acting ? '处理中...' : '✓ 通过' }}
            </button>
            <button @click="showRejectModal = true" class="btn-danger" :disabled="acting">
              ✕ 驳回
            </button>
            <button @click="showReassignModal = true" class="btn-secondary" :disabled="acting">
              ↪ 转交
            </button>
            <button v-if="canCancel" @click="showCancelModal = true" class="btn-ghost text-slate-500" :disabled="acting">
              取消申请
            </button>
          </div>
        </div>

        <!-- Audit log timeline -->
        <div class="card p-6">
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">审批记录</h3>
          <div v-if="instanceLogs.length" class="space-y-4">
            <div v-for="log in instanceLogs" :key="log.id" class="flex gap-3">
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  :class="logStyle[log.action]">
                  {{ logIcon[log.action] }}
                </div>
                <div class="w-px flex-1 bg-slate-100 mt-1" />
              </div>
              <div class="flex-1 pb-4">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-semibold text-slate-700">{{ log.operator?.full_name }}</span>
                  <span class="badge text-xs" :class="logBadgeStyle[log.action]">{{ logLabel[log.action] }}</span>
                  <span class="text-xs text-slate-400 ml-auto">{{ formatDatetime(log.created_at) }}</span>
                </div>
                <p v-if="log.comment" class="text-sm text-slate-600 mt-1 bg-slate-50 rounded-lg px-3 py-2">
                  {{ log.comment }}
                </p>
                <p v-if="log.to_step" class="text-xs text-slate-400 mt-1">
                  → {{ getStepName(log.to_step) }}
                </p>
              </div>
            </div>
          </div>
          <EmptyState v-else icon="📝" title="暂无审批记录" />
        </div>
      </div>

      <!-- Sidebar info -->
      <div class="space-y-4">
        <div class="card p-4 space-y-3">
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide">流程信息</h3>
          <InfoRow label="发起人" :value="instance.creator?.full_name ?? '—'" />
          <InfoRow label="当前处理人" :value="instance.assignee?.full_name ?? '—'" />
          <InfoRow label="优先级" :value="priorityLabels[instance.priority]" />
          <InfoRow label="发起时间" :value="formatDatetime(instance.created_at)" />
          <InfoRow v-if="instance.due_date" label="截止时间" :value="formatDatetime(instance.due_date)"
            :class="isOverdue ? 'text-red-500' : ''" />
          <InfoRow label="最后更新" :value="formatDatetime(instance.updated_at)" />
        </div>
      </div>
    </div>

    <!-- Reject modal -->
    <AppModal v-model="showRejectModal" title="确认驳回" size="sm">
      <div class="space-y-3">
        <p class="text-sm text-slate-600">驳回后流程将终止，请填写驳回原因：</p>
        <textarea v-model="rejectComment" rows="3" class="input resize-none"
          placeholder="请输入驳回原因（必填）" />
      </div>
      <template #footer>
        <button @click="showRejectModal = false" class="btn-secondary">取消</button>
        <button @click="handleReject" class="btn-danger" :disabled="!rejectComment.trim() || acting">
          确认驳回
        </button>
      </template>
    </AppModal>

    <!-- Reassign modal -->
    <AppModal v-model="showReassignModal" title="转交给" size="sm">
      <div class="space-y-3">
        <select v-model="reassignUserId" class="input">
          <option value="">选择转交对象</option>
          <option v-for="u in availableUsers" :key="u.id" :value="u.id">
            {{ u.full_name }} ({{ u.department ?? u.role }})
          </option>
        </select>
        <textarea v-model="reassignComment" rows="2" class="input resize-none" placeholder="转交原因（可选）" />
      </div>
      <template #footer>
        <button @click="showReassignModal = false" class="btn-secondary">取消</button>
        <button @click="handleReassign" class="btn-primary" :disabled="!reassignUserId || acting">
          确认转交
        </button>
      </template>
    </AppModal>

    <!-- Cancel modal -->
    <AppModal v-model="showCancelModal" title="撤销申请" size="sm">
      <p class="text-sm text-slate-600">确定要撤销这个申请吗？撤销后无法恢复。</p>
      <template #footer>
        <button @click="showCancelModal = false" class="btn-secondary">取消</button>
        <button @click="handleCancel" class="btn-danger" :disabled="acting">确认撤销</button>
      </template>
    </AppModal>
  </div>

  <div v-else-if="loading" class="flex items-center justify-center py-24">
    <div class="text-slate-400 text-sm">加载中...</div>
  </div>
  <div v-else class="p-6 text-center text-slate-400">流程不存在</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format, isPast } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useAuthStore } from '@/stores/auth'
import { useWorkflowStore } from '@/stores/workflow'
import { useToastStore } from '@/stores/toast'
import { MOCK_USERS } from '@/lib/mockData'
import type { WorkflowInstance, LogAction } from '@/types'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import PriorityBadge from '@/components/ui/PriorityBadge.vue'
import WorkflowStepper from '@/components/workflow/WorkflowStepper.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AppModal from '@/components/ui/AppModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const workflowStore = useWorkflowStore()
const toast = useToastStore()

const instance = ref<WorkflowInstance | null>(null)
const loading = ref(true)
const acting = ref(false)
const comment = ref('')
const rejectComment = ref('')
const reassignUserId = ref('')
const reassignComment = ref('')
const showRejectModal = ref(false)
const showReassignModal = ref(false)
const showCancelModal = ref(false)

const availableUsers = MOCK_USERS.filter(u => u.id !== authStore.user?.id)

const instanceLogs = computed(() => workflowStore.logs[String(route.params.id)] ?? [])

const currentStepDef = computed(() => {
  if (!instance.value) return null
  return instance.value.workflow_definitions?.steps.find(s => s.id === instance.value!.current_step)
})

const canAct = computed(() =>
  instance.value?.assignee_id === authStore.user?.id &&
  (instance.value?.status === 'running' || instance.value?.status === 'pending')
)

const canCancel = computed(() =>
  instance.value?.created_by === authStore.user?.id &&
  instance.value?.status !== 'approved' && instance.value?.status !== 'rejected'
)

const isOverdue = computed(() =>
  instance.value?.due_date && isPast(new Date(instance.value.due_date)) && instance.value.status === 'running'
)

const priorityLabels = { low: '低', normal: '普通', high: '紧急', urgent: '非常紧急' }

function getStepName(stepId: string) {
  return instance.value?.workflow_definitions?.steps.find(s => s.id === stepId)?.name ?? stepId
}

function formatKey(key: string) {
  const map: Record<string, string> = {
    leave_type: '假期类型', days: '天数', reason: '原因', start_date: '开始日期', end_date: '结束日期',
    amount: '金额（元）', description: '说明', receipt_count: '票据数量',
    item: '物品名称', quantity: '数量', unit_price: '单价', total: '总价'
  }
  return map[key] ?? key
}

function formatValue(val: any) {
  if (typeof val === 'number' && String(val).includes('.')) return `¥${val.toFixed(2)}`
  return String(val)
}

function formatDatetime(d: string) {
  return format(new Date(d), 'yyyy/MM/dd HH:mm', { locale: zhCN })
}

const logIcon: Record<LogAction, string> = {
  submit: '📤', approve: '✅', reject: '❌', cancel: '🚫', reassign: '↪', comment: '💬', timeout: '⏰'
}
const logLabel: Record<LogAction, string> = {
  submit: '提交', approve: '通过', reject: '驳回', cancel: '撤销', reassign: '转交', comment: '备注', timeout: '超时'
}
const logStyle: Record<LogAction, string> = {
  submit: 'bg-blue-50 text-blue-600', approve: 'bg-emerald-50 text-emerald-600',
  reject: 'bg-red-50 text-red-600', cancel: 'bg-slate-100 text-slate-500',
  reassign: 'bg-amber-50 text-amber-600', comment: 'bg-brand-50 text-brand-600',
  timeout: 'bg-orange-50 text-orange-600'
}
const logBadgeStyle: Record<LogAction, string> = {
  submit: 'bg-blue-50 text-blue-600', approve: 'bg-emerald-50 text-emerald-600',
  reject: 'bg-red-50 text-red-600', cancel: 'bg-slate-100 text-slate-500',
  reassign: 'bg-amber-50 text-amber-600', comment: 'bg-brand-50 text-brand-600',
  timeout: 'bg-orange-50 text-orange-600'
}

async function handleApprove() {
  if (currentStepDef.value?.required_comment && !comment.value.trim()) {
    toast.warning('请填写审批意见')
    return
  }
  acting.value = true
  const { error } = await workflowStore.transition(String(route.params.id), 'approve', comment.value)
  acting.value = false
  if (error) { toast.error('操作失败'); return }
  toast.success('已通过')
  comment.value = ''
  await reload()
}

async function handleReject() {
  acting.value = true
  const { error } = await workflowStore.transition(String(route.params.id), 'reject', rejectComment.value)
  acting.value = false
  showRejectModal.value = false
  if (error) { toast.error('操作失败'); return }
  toast.success('已驳回')
  await reload()
}

async function handleReassign() {
  acting.value = true
  const { error } = await workflowStore.reassign(String(route.params.id), reassignUserId.value, reassignComment.value)
  acting.value = false
  showReassignModal.value = false
  if (error) { toast.error('操作失败'); return }
  toast.success('已转交')
  await reload()
}

async function handleCancel() {
  acting.value = true
  const { error } = await workflowStore.transition(String(route.params.id), 'cancel')
  acting.value = false
  showCancelModal.value = false
  if (error) { toast.error('操作失败'); return }
  toast.success('已撤销申请')
  router.push('/instances')
}

async function reload() {
  instance.value = await workflowStore.fetchInstance(String(route.params.id))
  await workflowStore.fetchLogs(String(route.params.id))
}

onMounted(async () => {
  loading.value = true
  await reload()
  loading.value = false
})
</script>

<script lang="ts">
// Helper inline component
const InfoRow = {
  props: ['label', 'value'],
  template: `<div class="flex justify-between gap-2 text-sm">
    <span class="text-slate-400">{{ label }}</span>
    <span class="font-medium text-slate-700 text-right">{{ value }}</span>
  </div>`
}
export { InfoRow }
</script>
