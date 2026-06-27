import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'
import { MOCK_USER, MOCK_USERS } from '@/lib/mockData'

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const loading = ref(false)
  const isDemo = ref(IS_DEMO)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function init() {
    if (IS_DEMO) {
      user.value = MOCK_USER
      return
    }

    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
    } finally {
      loading.value = false
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        user.value = null
      }
    })
  }

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) user.value = data
  }

  async function signIn(email: string, password: string) {
    if (IS_DEMO) {
      // Demo: find matching mock user or default
      const found = MOCK_USERS.find(u => u.email === email) || MOCK_USER
      user.value = found
      return { error: null }
    }

    loading.value = true
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    } finally {
      loading.value = false
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    if (IS_DEMO) {
      user.value = { ...MOCK_USER, email, full_name: fullName }
      return { error: null }
    }

    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      })

      if (!error && data.user) {
        await supabase.from('user_profiles').insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: 'employee'
        })
      }

      return { error }
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    if (IS_DEMO) {
      user.value = null
      return
    }
    await supabase.auth.signOut()
    user.value = null
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    if (!user.value) return

    if (IS_DEMO) {
      user.value = { ...user.value, ...updates }
      return { error: null }
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.value.id)

    if (!error) user.value = { ...user.value, ...updates }
    return { error }
  }

  return { user, loading, isDemo, isAuthenticated, isAdmin, init, signIn, signUp, signOut, updateProfile }
})
