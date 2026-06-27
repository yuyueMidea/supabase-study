<template>
  <div class="min-h-screen bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 flex items-center justify-center p-4">
    <!-- Background pattern -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
    </div>

    <div class="w-full max-w-md relative">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4 text-3xl">
          ⚡
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight">FlowDesk</h1>
        <p class="text-brand-200 mt-1 text-sm">企业工作流管理平台</p>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <!-- Demo notice -->
        <div class="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <p class="font-semibold mb-0.5">🎭 演示模式</p>
          <p class="text-xs">未配置 Supabase，任意邮箱/密码均可登录体验完整功能。</p>
        </div>

        <!-- Tabs -->
        <div class="flex bg-slate-100 rounded-lg p-1 mb-6">
          <button v-for="tab in ['login','register']" :key="tab"
            @click="activeTab = tab"
            class="flex-1 py-2 rounded-md text-sm font-medium transition-all"
            :class="activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          >
            {{ tab === 'login' ? '登录' : '注册' }}
          </button>
        </div>

        <!-- Login form -->
        <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="label">邮箱</label>
            <input v-model="form.email" type="email" class="input" placeholder="your@email.com" required />
          </div>
          <div>
            <label class="label">密码</label>
            <input v-model="form.password" type="password" class="input" placeholder="••••••••" required />
          </div>

          <!-- Quick login buttons -->
          <div class="pt-1">
            <p class="text-xs text-slate-400 mb-2">快速登录（演示账号）</p>
            <div class="grid grid-cols-2 gap-2">
              <button v-for="demo in demoAccounts" :key="demo.email" type="button"
                @click="quickLogin(demo)"
                class="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-colors">
                <p class="text-xs font-medium text-slate-700">{{ demo.name }}</p>
                <p class="text-xs text-slate-400">{{ demo.role }}</p>
              </button>
            </div>
          </div>

          <button type="submit" class="btn-primary w-full justify-center mt-2" :disabled="authStore.loading">
            <span v-if="authStore.loading">登录中...</span>
            <span v-else>登录</span>
          </button>
        </form>

        <!-- Register form -->
        <form v-else @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="label">姓名</label>
            <input v-model="form.fullName" type="text" class="input" placeholder="您的姓名" required />
          </div>
          <div>
            <label class="label">邮箱</label>
            <input v-model="form.email" type="email" class="input" placeholder="your@email.com" required />
          </div>
          <div>
            <label class="label">密码</label>
            <input v-model="form.password" type="password" class="input" placeholder="至少6位" minlength="6" required />
          </div>
          <button type="submit" class="btn-primary w-full justify-center" :disabled="authStore.loading">
            <span v-if="authStore.loading">注册中...</span>
            <span v-else>创建账号</span>
          </button>
        </form>

        <p v-if="errorMsg" class="mt-4 text-sm text-red-600 text-center">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWorkflowStore } from '@/stores/workflow'
import { useNotificationStore } from '@/stores/notification'

const router = useRouter()
const authStore = useAuthStore()
const workflowStore = useWorkflowStore()
const notifStore = useNotificationStore()

const activeTab = ref('login')
const errorMsg = ref('')
const form = reactive({ email: '', password: '', fullName: '' })

const demoAccounts = [
  { name: '张三 (管理员)', email: 'admin@company.com', role: '管理员', password: 'demo' },
  { name: '李四 (主管)',   email: 'manager@company.com', role: '部门主管', password: 'demo' },
  { name: '王五 (HR)',    email: 'hr@company.com', role: 'HR专员', password: 'demo' },
  { name: '赵六 (员工)',  email: 'emp@company.com', role: '普通员工', password: 'demo' }
]

function quickLogin(demo: typeof demoAccounts[0]) {
  form.email = demo.email
  form.password = demo.password
  handleLogin()
}

async function handleLogin() {
  errorMsg.value = ''
  const { error } = await authStore.signIn(form.email, form.password)
  if (error) {
    errorMsg.value = '邮箱或密码错误'
    return
  }
  await Promise.all([
    workflowStore.fetchDefinitions(),
    workflowStore.fetchInstances(),
    notifStore.fetchNotifications()
  ])
  router.push('/')
}

async function handleRegister() {
  errorMsg.value = ''
  const { error } = await authStore.signUp(form.email, form.password, form.fullName)
  if (error) {
    errorMsg.value = '注册失败：' + (error as any).message
    return
  }
  router.push('/')
}
</script>
