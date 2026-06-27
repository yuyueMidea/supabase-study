import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import type { Notification } from '@/types'
import { MOCK_NOTIFICATIONS } from '@/lib/mockData'

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

export const useNotificationStore = defineStore('notification', () => {
  const authStore = useAuthStore()
  const notifications = ref<Notification[]>([])
  const channel = ref<any>(null)

  const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length)

  async function fetchNotifications() {
    if (IS_DEMO) {
      notifications.value = [...MOCK_NOTIFICATIONS]
      return
    }

    const { data } = await supabase
      .from('notifications')
      .select('*, instance:workflow_instances(id,title,status)')
      .eq('user_id', authStore.user!.id)
      .order('created_at', { ascending: false })
      .limit(50)

    notifications.value = data ?? []
  }

  async function markRead(id: string) {
    const idx = notifications.value.findIndex(n => n.id === id)
    if (idx > -1) notifications.value[idx].is_read = true

    if (!IS_DEMO) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    }
  }

  async function markAllRead() {
    notifications.value.forEach(n => { n.is_read = true })

    if (!IS_DEMO) {
      await supabase.from('notifications')
        .update({ is_read: true })
        .eq('user_id', authStore.user!.id)
        .eq('is_read', false)
    }
  }

  function addLocal(notif: Notification) {
    notifications.value.unshift(notif)
  }

  function subscribeRealtime() {
    if (IS_DEMO || !authStore.user) return

    channel.value = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${authStore.user.id}`
      }, (payload) => {
        notifications.value.unshift(payload.new as Notification)
      })
      .subscribe()
  }

  function unsubscribeRealtime() {
    if (channel.value) {
      supabase.removeChannel(channel.value)
      channel.value = null
    }
  }

  return {
    notifications, unreadCount,
    fetchNotifications, markRead, markAllRead, addLocal,
    subscribeRealtime, unsubscribeRealtime
  }
})
