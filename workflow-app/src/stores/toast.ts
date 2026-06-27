import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToastMessage } from '@/types'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastMessage[]>([])

  function add(toast: Omit<ToastMessage, 'id'>) {
    const id = `toast-${Date.now()}-${Math.random()}`
    toasts.value.push({ ...toast, id })
    setTimeout(() => remove(id), toast.duration ?? 4000)
  }

  function remove(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const success = (title: string, message?: string) => add({ type: 'success', title, message })
  const error = (title: string, message?: string) => add({ type: 'error', title, message })
  const info = (title: string, message?: string) => add({ type: 'info', title, message })
  const warning = (title: string, message?: string) => add({ type: 'warning', title, message })

  return { toasts, add, remove, success, error, info, warning }
})
