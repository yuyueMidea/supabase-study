<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <h2 class="text-lg font-bold text-slate-800">个人中心</h2>

    <!-- Avatar + basic -->
    <div class="card p-6">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-20 h-20 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-3xl font-bold">
          {{ authStore.user?.full_name?.charAt(0) }}
        </div>
        <div>
          <h3 class="text-xl font-bold text-slate-800">{{ authStore.user?.full_name }}</h3>
          <p class="text-slate-400 text-sm">{{ authStore.user?.email }}</p>
          <span class="badge mt-1" :class="roleStyle[authStore.user?.role ?? 'employee']">
            {{ roleLabel[authStore.user?.role ?? 'employee'] }}
          </span>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="label">姓名</label>
          <input v-model="form.full_name" class="input" />
        </div>
        <div>
          <label class="label">部门</label>
          <input v-model="form.department" class="input" placeholder="如：产品部" />
        </div>
        <div class="flex justify-end">
          <button @click="handleSave" class="btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存信息' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="card p-6">
      <h3 class="font-semibold text-slate-700 mb-4">我的数据</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <p class="text-2xl font-bold text-brand-600">{{ workflowStore.mySubmissions.length }}</p>
          <p class="text-xs text-slate-400 mt-1">发起的申请</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-emerald-600">{{ approvedCount }}</p>
          <p class="text-xs text-slate-400 mt-1">已通过</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-red-500">{{ rejectedCount }}</p>
          <p class="text-xs text-slate-400 mt-1">被驳回</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-blue-600">{{ workflowStore.myTasks.length }}</p>
          <p class="text-xs text-slate-400 mt-1">待我审批</p>
        </div>
      </div>
    </div>

    <!-- Demo info -->
    <div v-if="authStore.isDemo" class="card p-6 border-amber-200 bg-amber-50">
      <h3 class="font-semibold text-amber-800 mb-2">🎭 演示模式说明</h3>
      <p class="text-sm text-amber-700">当前运行在演示模式，数据仅存储在内存中，刷新页面后重置。</p>
      <p class="text-sm text-amber-700 mt-2">要连接真实数据库，请在 <code class="bg-amber-100 px-1 rounded">.env.local</code> 中配置 Supabase 环境变量。</p>
    </div>

    <!-- Sign out -->
    <div class="flex justify-end">
      <button @click="handleSignOut" class="btn-danger">退出登录</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWorkflowStore } from '@/stores/workflow'
import { useNotificationStore } from '@/stores/notification'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const authStore = useAuthStore()
const workflowStore = useWorkflowStore()
const notifStore = useNotificationStore()
const toast = useToastStore()

const saving = ref(false)
const form = reactive({ full_name: '', department: '' })

const approvedCount = computed(() => workflowStore.mySubmissions.filter(i => i.status === 'approved').length)
const rejectedCount = computed(() => workflowStore.mySubmissions.filter(i => i.status === 'rejected').length)

const roleLabel: Record<string, string> = { admin: '管理员', manager: '主管', employee: '员工' }
const roleStyle: Record<string, string> = {
  admin:    'bg-brand-50 text-brand-700 border border-brand-200',
  manager:  'bg-amber-50 text-amber-700 border border-amber-200',
  employee: 'bg-slate-100 text-slate-600'
}

onMounted(() => {
  form.full_name = authStore.user?.full_name ?? ''
  form.department = authStore.user?.department ?? ''
})

async function handleSave() {
  saving.value = true
  const { error } = await authStore.updateProfile(form) ?? {}
  saving.value = false
  if (error) toast.error('保存失败')
  else toast.success('信息已更新')
}

async function handleSignOut() {
  workflowStore.unsubscribeRealtime()
  notifStore.unsubscribeRealtime()
  await authStore.signOut()
  router.push('/login')
}
</script>
