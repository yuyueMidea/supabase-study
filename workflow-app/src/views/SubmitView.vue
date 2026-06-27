<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <div>
      <button @click="$router.back()" class="btn-ghost btn-sm mb-3">← 返回</button>
      <div v-if="def" class="flex items-center gap-3">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
          :style="`background: ${def.color}18`">
          {{ def.icon }}
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-800">{{ def.name }}</h2>
          <p class="text-sm text-slate-400">{{ def.description }}</p>
        </div>
      </div>
    </div>

    <!-- Process preview -->
    <div v-if="def" class="card p-4">
      <p class="text-xs text-slate-400 mb-3">审批流程</p>
      <WorkflowStepper :steps="def.steps" :current-step="def.steps[0]?.id" status="pending" />
    </div>

    <!-- Form -->
    <div v-if="def" class="card p-6 space-y-4">
      <h3 class="font-semibold text-slate-700">填写申请信息</h3>

      <!-- Common fields -->
      <div>
        <label class="label">申请标题 <span class="text-red-500">*</span></label>
        <input v-model="form.title" class="input" :placeholder="`${def.name} - 简要说明`" required />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label">优先级</label>
          <select v-model="form.priority" class="input">
            <option value="low">低</option>
            <option value="normal">普通</option>
            <option value="high">紧急</option>
            <option value="urgent">非常紧急</option>
          </select>
        </div>
        <div>
          <label class="label">截止日期（可选）</label>
          <input v-model="form.due_date" type="date" class="input" :min="today" />
        </div>
      </div>

      <!-- Dynamic fields based on template category -->
      <div class="border-t border-slate-100 pt-4 space-y-4">
        <p class="text-sm text-slate-500 font-medium">业务详情</p>

        <!-- Leave request fields -->
        <template v-if="def.category === '人事'">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">假期类型</label>
              <select v-model="payload.leave_type" class="input">
                <option>年假</option><option>病假</option><option>事假</option>
                <option>婚假</option><option>产假</option><option>陪产假</option>
              </select>
            </div>
            <div>
              <label class="label">天数</label>
              <input v-model.number="payload.days" type="number" min="0.5" step="0.5" class="input" placeholder="0.5" />
            </div>
            <div>
              <label class="label">开始日期</label>
              <input v-model="payload.start_date" type="date" class="input" :min="today" />
            </div>
            <div>
              <label class="label">结束日期</label>
              <input v-model="payload.end_date" type="date" class="input" :min="payload.start_date" />
            </div>
          </div>
          <div>
            <label class="label">请假原因</label>
            <textarea v-model="payload.reason" rows="3" class="input resize-none" placeholder="请简要说明请假原因..." />
          </div>
        </template>

        <!-- Expense reimbursement fields -->
        <template v-else-if="def.category === '财务'">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">报销金额（元）</label>
              <input v-model.number="payload.amount" type="number" min="0" step="0.01" class="input" placeholder="0.00" />
            </div>
            <div>
              <label class="label">票据数量</label>
              <input v-model.number="payload.receipt_count" type="number" min="1" class="input" placeholder="1" />
            </div>
          </div>
          <div>
            <label class="label">费用说明</label>
            <textarea v-model="payload.description" rows="3" class="input resize-none" placeholder="请详细描述费用用途..." />
          </div>
        </template>

        <!-- Procurement fields -->
        <template v-else-if="def.category === '行政'">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">物品名称</label>
              <input v-model="payload.item" class="input" placeholder="如：笔记本电脑" />
            </div>
            <div>
              <label class="label">数量</label>
              <input v-model.number="payload.quantity" type="number" min="1" class="input" placeholder="1" />
            </div>
            <div>
              <label class="label">单价（元）</label>
              <input v-model.number="payload.unit_price" type="number" min="0" step="0.01" class="input" placeholder="0.00" @input="calcTotal" />
            </div>
            <div>
              <label class="label">预计总价（元）</label>
              <input :value="payload.total" class="input bg-slate-50" readonly />
            </div>
          </div>
        </template>

        <!-- Generic -->
        <template v-else>
          <div>
            <label class="label">申请说明</label>
            <textarea v-model="payload.description" rows="4" class="input resize-none" placeholder="请详细描述您的申请..." />
          </div>
        </template>
      </div>
    </div>

    <!-- Submit -->
    <div class="flex justify-end gap-3">
      <button @click="$router.back()" class="btn-secondary">取消</button>
      <button @click="handleSubmit" class="btn-primary btn-lg" :disabled="submitting || !form.title">
        {{ submitting ? '提交中...' : '📤 提交申请' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { useWorkflowStore } from '@/stores/workflow'
import { useToastStore } from '@/stores/toast'
import WorkflowStepper from '@/components/workflow/WorkflowStepper.vue'

const route = useRoute()
const router = useRouter()
const workflowStore = useWorkflowStore()
const toast = useToastStore()

const submitting = ref(false)
const today = format(new Date(), 'yyyy-MM-dd')

const def = computed(() =>
  workflowStore.definitions.find(d => d.id === route.params.definitionId)
)

const form = reactive({
  title: '',
  priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  due_date: ''
})

const payload = reactive<Record<string, any>>({
  leave_type: '年假',
  days: 1,
  start_date: today,
  end_date: today,
  reason: '',
  amount: 0,
  receipt_count: 1,
  description: '',
  item: '',
  quantity: 1,
  unit_price: 0,
  total: 0
})

function calcTotal() {
  payload.total = (payload.quantity ?? 1) * (payload.unit_price ?? 0)
}

async function handleSubmit() {
  if (!form.title.trim()) { toast.warning('请填写申请标题'); return }
  if (!def.value) { toast.error('流程模板不存在'); return }

  submitting.value = true

  // Build clean payload based on category
  let cleanPayload: Record<string, any> = {}
  const cat = def.value.category
  if (cat === '人事') {
    cleanPayload = { leave_type: payload.leave_type, days: payload.days, start_date: payload.start_date, end_date: payload.end_date, reason: payload.reason }
  } else if (cat === '财务') {
    cleanPayload = { amount: payload.amount, description: payload.description, receipt_count: payload.receipt_count }
  } else if (cat === '行政') {
    cleanPayload = { item: payload.item, quantity: payload.quantity, unit_price: payload.unit_price, total: payload.quantity * payload.unit_price }
  } else {
    cleanPayload = { description: payload.description }
  }

  const { error } = await workflowStore.submitInstance(
    def.value.id, form.title, cleanPayload, form.priority, form.due_date || undefined
  )
  submitting.value = false

  if (error) { toast.error('提交失败', String(error)); return }
  toast.success('申请已提交', '已进入审批流程，请等待审批结果')
  router.push('/instances')
}
</script>
