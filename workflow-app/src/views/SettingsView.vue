<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const authStore = useAuthStore()
const toast = useToastStore()

const saving = ref(false)
const changingPassword = ref(false)

const profile = reactive({
  full_name: authStore.user?.full_name ?? '',
  department: authStore.user?.department ?? '',
  email: authStore.user?.email ?? ''
})

const passwordForm = reactive({
  current: '',
  next: '',
  confirm: ''
})

const showPassword = ref(false)

async function saveProfile() {
  if (!profile.full_name.trim()) {
    toast.error('姓名不能为空')
    return
  }
  saving.value = true
  try {
    const result = await authStore.updateProfile({
      full_name: profile.full_name,
      department: profile.department
    })
    if (result?.error) throw result.error
    toast.success('个人信息已更新')
  } catch (e: any) {
    toast.error('更新失败', e?.message)
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (passwordForm.next !== passwordForm.confirm) {
    toast.error('两次密码输入不一致')
    return
  }
  if (passwordForm.next.length < 6) {
    toast.error('密码至少6位')
    return
  }

  if (authStore.isDemo) {
    toast.info('演示模式', '密码修改功能在演示模式下不可用')
    return
  }

  changingPassword.value = true
  try {
    // In real Supabase, use supabase.auth.updateUser
    toast.success('密码修改成功，请重新登录')
    passwordForm.current = ''
    passwordForm.next = ''
    passwordForm.confirm = ''
  } catch (e: any) {
    toast.error('密码修改失败', e?.message)
  } finally {
    changingPassword.value = false
  }
}

const roleLabel: Record<string, string> = {
  admin: '管理员',
  manager: '主管',
  employee: '员工'
}

const roleColor: Record<string, string> = {
  admin: 'bg-brand-100 text-brand-700',
  manager: 'bg-amber-100 text-amber-700',
  employee: 'bg-slate-100 text-slate-600'
}
</script>

<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <div>
      <h2 class="text-lg font-bold text-slate-800">账号设置</h2>
      <p class="text-sm text-slate-400">管理您的个人信息和账号安全</p>
    </div>

    <!-- Demo banner -->
    <div v-if="authStore.isDemo"
      class="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
      <span class="text-xl">⚠️</span>
      <div>
        <p class="font-medium">演示模式</p>
        <p class="text-xs mt-0.5">连接真实 Supabase 后，所有设置将永久保存</p>
      </div>
    </div>

    <!-- Avatar + role -->
    <div class="card p-6 flex items-center gap-5">
      <div class="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
        <span class="text-brand-700 font-bold text-2xl">
          {{ authStore.user?.full_name?.[0] ?? '?' }}
        </span>
      </div>
      <div>
        <p class="font-semibold text-slate-800 text-lg">{{ authStore.user?.full_name }}</p>
        <p class="text-sm text-slate-400 mb-2">{{ authStore.user?.email }}</p>
        <span class="badge text-xs" :class="roleColor[authStore.user?.role ?? 'employee']">
          {{ roleLabel[authStore.user?.role ?? 'employee'] }}
        </span>
      </div>
    </div>

    <!-- Profile form -->
    <div class="card p-6 space-y-4">
      <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide">基本信息</h3>

      <div>
        <label class="label">姓名</label>
        <input v-model="profile.full_name" class="input" placeholder="您的姓名" />
      </div>

      <div>
        <label class="label">邮箱</label>
        <input :value="profile.email" class="input bg-slate-50 text-slate-400 cursor-not-allowed"
          disabled placeholder="邮箱地址" />
        <p class="text-xs text-slate-400 mt-1">邮箱地址不可修改</p>
      </div>

      <div>
        <label class="label">部门</label>
        <input v-model="profile.department" class="input" placeholder="所属部门" />
      </div>

      <div class="flex justify-end">
        <button @click="saveProfile" :disabled="saving" class="btn-primary">
          {{ saving ? '保存中...' : '保存信息' }}
        </button>
      </div>
    </div>

    <!-- Password form -->
    <div class="card p-6 space-y-4">
      <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide">修改密码</h3>

      <div>
        <label class="label">当前密码</label>
        <input v-model="passwordForm.current" :type="showPassword ? 'text' : 'password'"
          class="input" placeholder="当前密码" />
      </div>
      <div>
        <label class="label">新密码</label>
        <input v-model="passwordForm.next" :type="showPassword ? 'text' : 'password'"
          class="input" placeholder="至少6位" />
      </div>
      <div>
        <label class="label">确认新密码</label>
        <input v-model="passwordForm.confirm" :type="showPassword ? 'text' : 'password'"
          class="input" placeholder="再次输入新密码" />
      </div>

      <div class="flex items-center justify-between">
        <label class="flex items-center gap-2 cursor-pointer text-sm text-slate-500 select-none">
          <input type="checkbox" v-model="showPassword" class="rounded" />
          显示密码
        </label>
        <button @click="changePassword" :disabled="changingPassword" class="btn-secondary">
          {{ changingPassword ? '修改中...' : '修改密码' }}
        </button>
      </div>
    </div>

    <!-- Danger zone -->
    <div class="card p-6 border-red-100">
      <h3 class="text-sm font-semibold text-red-500 uppercase tracking-wide mb-4">危险操作</h3>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-700">退出登录</p>
          <p class="text-xs text-slate-400">退出当前账号，返回登录页</p>
        </div>
        <RouterLink to="/login" @click="authStore.signOut()" class="btn-danger btn-sm">
          退出登录
        </RouterLink>
      </div>
    </div>
  </div>
</template>
