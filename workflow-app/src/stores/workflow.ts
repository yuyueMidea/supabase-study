import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import type { WorkflowDefinition, WorkflowInstance, WorkflowLog, InstanceStatus } from '@/types'
import {
  MOCK_DEFINITIONS, MOCK_INSTANCES, MOCK_LOGS, MOCK_USERS
} from '@/lib/mockData'

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

export const useWorkflowStore = defineStore('workflow', () => {
  const authStore = useAuthStore()

  // ─── State ──────────────────────────────────────────────────────────────────
  const definitions = ref<WorkflowDefinition[]>([])
  const instances = ref<WorkflowInstance[]>([])
  const logs = ref<Record<string, WorkflowLog[]>>({})
  const loading = ref(false)
  const realtimeChannel = ref<any>(null)

  // ─── Computed ────────────────────────────────────────────────────────────────
  const myTasks = computed(() =>
    instances.value.filter(i =>
      i.assignee_id === authStore.user?.id &&
      (i.status === 'running' || i.status === 'pending')
    )
  )

  const mySubmissions = computed(() =>
    instances.value.filter(i => i.created_by === authStore.user?.id)
  )

  const stats = computed(() => ({
    total_pending: instances.value.filter(i => i.status === 'pending').length,
    total_running: instances.value.filter(i => i.status === 'running').length,
    total_approved: instances.value.filter(i => i.status === 'approved').length,
    total_rejected: instances.value.filter(i => i.status === 'rejected').length,
    my_tasks: myTasks.value.length,
    completed_today: instances.value.filter(i => {
      const d = new Date(i.updated_at)
      const today = new Date()
      return (i.status === 'approved' || i.status === 'rejected') &&
        d.toDateString() === today.toDateString()
    }).length
  }))

  // ─── Demo helpers ────────────────────────────────────────────────────────────
  function _demoResolveAssignee(instance: WorkflowInstance, nextStepDef: any) {
    if (!nextStepDef || nextStepDef.type === 'end') return null
    if (nextStepDef.assignee_role === 'manager') return MOCK_USERS[1].id
    if (nextStepDef.assignee_role === 'hr') return MOCK_USERS[2].id
    if (nextStepDef.assignee_role === 'admin') return authStore.user?.id ?? MOCK_USERS[0].id
    if (nextStepDef.assignee_role === 'self') return instance.created_by
    return null
  }

  // ─── Definitions ─────────────────────────────────────────────────────────────
  async function fetchDefinitions() {
    if (IS_DEMO) {
      definitions.value = [...MOCK_DEFINITIONS]
      return
    }

    const { data } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    definitions.value = data ?? []
  }

  async function createDefinition(def: Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at' | 'created_by'>) {
    if (IS_DEMO) {
      const newDef: WorkflowDefinition = {
        ...def,
        id: `def-${Date.now()}`,
        created_by: authStore.user!.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      definitions.value.unshift(newDef)
      return { data: newDef, error: null }
    }

    const { data, error } = await supabase
      .from('workflow_definitions')
      .insert({ ...def, created_by: authStore.user!.id })
      .select()
      .single()

    if (data) definitions.value.unshift(data)
    return { data, error }
  }

  async function updateDefinition(id: string, updates: Partial<WorkflowDefinition>) {
    if (IS_DEMO) {
      const idx = definitions.value.findIndex(d => d.id === id)
      if (idx > -1) definitions.value[idx] = { ...definitions.value[idx], ...updates }
      return { error: null }
    }

    const { error } = await supabase
      .from('workflow_definitions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      const idx = definitions.value.findIndex(d => d.id === id)
      if (idx > -1) definitions.value[idx] = { ...definitions.value[idx], ...updates }
    }
    return { error }
  }

  // ─── Instances ───────────────────────────────────────────────────────────────
  async function fetchInstances(filters?: { status?: InstanceStatus; assignee_id?: string; created_by?: string }) {
    loading.value = true
    try {
      if (IS_DEMO) {
        let result = [...MOCK_INSTANCES]
        if (filters?.status) result = result.filter(i => i.status === filters.status)
        if (filters?.assignee_id) result = result.filter(i => i.assignee_id === filters.assignee_id)
        if (filters?.created_by) result = result.filter(i => i.created_by === filters.created_by)
        instances.value = result
        return
      }

      let query = supabase
        .from('workflow_instances')
        .select(`*, workflow_definitions(*), assignee:user_profiles!assignee_id(*), creator:user_profiles!created_by(*)`)
        .order('created_at', { ascending: false })

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.assignee_id) query = query.eq('assignee_id', filters.assignee_id)
      if (filters?.created_by) query = query.eq('created_by', filters.created_by)

      const { data } = await query
      instances.value = data ?? []
    } finally {
      loading.value = false
    }
  }

  async function fetchInstance(id: string): Promise<WorkflowInstance | null> {
    if (IS_DEMO) {
      return MOCK_INSTANCES.find(i => i.id === id) ?? null
    }

    const { data } = await supabase
      .from('workflow_instances')
      .select(`*, workflow_definitions(*), assignee:user_profiles!assignee_id(*), creator:user_profiles!created_by(*)`)
      .eq('id', id)
      .single()

    return data
  }

  async function submitInstance(
    definitionId: string,
    title: string,
    payload: Record<string, any>,
    priority: WorkflowInstance['priority'] = 'normal',
    dueDate?: string
  ) {
    const def = definitions.value.find(d => d.id === definitionId)
    if (!def) return { error: new Error('Definition not found') }

    const firstStep = def.steps[0]
    const secondStep = def.steps[1]

    if (IS_DEMO) {
      const newInst: WorkflowInstance = {
        id: `inst-${Date.now()}`,
        definition_id: definitionId,
        title,
        current_step: secondStep?.id ?? firstStep.id,
        status: 'running',
        priority,
        payload,
        assignee_id: _demoResolveAssignee({ created_by: authStore.user!.id } as any, secondStep),
        created_by: authStore.user!.id,
        due_date: dueDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        workflow_definitions: def,
        creator: authStore.user!
      }
      instances.value.unshift(newInst)
      return { data: newInst, error: null }
    }

    const { data, error } = await supabase.functions.invoke('workflow-transition', {
      body: {
        action: 'submit',
        definition_id: definitionId,
        title,
        payload,
        priority,
        due_date: dueDate
      }
    })

    if (!error && data?.instance) {
      instances.value.unshift(data.instance)
    }

    return { data, error }
  }

  async function transition(instanceId: string, action: 'approve' | 'reject' | 'cancel', comment?: string) {
    const inst = instances.value.find(i => i.id === instanceId)
    if (!inst) return { error: new Error('Instance not found') }

    if (IS_DEMO) {
      const def = inst.workflow_definitions!
      const steps = def.steps
      const currentIdx = steps.findIndex(s => s.id === inst.current_step)

      let newStep = inst.current_step
      let newStatus: InstanceStatus = inst.status
      let newAssignee: string | null = inst.assignee_id

      if (action === 'approve') {
        if (currentIdx < steps.length - 1) {
          const next = steps[currentIdx + 1]
          newStep = next.id
          newStatus = next.type === 'end' ? 'approved' : 'running'
          newAssignee = _demoResolveAssignee(inst, next)
        } else {
          newStatus = 'approved'
          newAssignee = null
        }
      } else if (action === 'reject') {
        newStatus = 'rejected'
        newAssignee = null
      } else if (action === 'cancel') {
        newStatus = 'cancelled'
        newAssignee = null
      }

      // Add log
      const newLog: WorkflowLog = {
        id: `log-${Date.now()}`,
        instance_id: instanceId,
        from_step: inst.current_step,
        to_step: newStep !== inst.current_step ? newStep : null,
        action,
        operator_id: authStore.user!.id,
        comment: comment ?? null,
        created_at: new Date().toISOString(),
        operator: authStore.user!
      }

      if (!logs.value[instanceId]) logs.value[instanceId] = []
      logs.value[instanceId].push(newLog)

      // Update instance
      const idx = instances.value.findIndex(i => i.id === instanceId)
      if (idx > -1) {
        instances.value[idx] = {
          ...instances.value[idx],
          current_step: newStep,
          status: newStatus,
          assignee_id: newAssignee,
          updated_at: new Date().toISOString()
        }
      }

      return { error: null }
    }

    const { error } = await supabase.functions.invoke('workflow-transition', {
      body: { instanceId, action, comment }
    })

    if (!error) {
      await fetchInstances()
    }

    return { error }
  }

  async function reassign(instanceId: string, newAssigneeId: string, comment?: string) {
    if (IS_DEMO) {
      const idx = instances.value.findIndex(i => i.id === instanceId)
      if (idx > -1) {
        const newAssignee = MOCK_USERS.find(u => u.id === newAssigneeId)
        instances.value[idx] = {
          ...instances.value[idx],
          assignee_id: newAssigneeId,
          assignee: newAssignee,
          updated_at: new Date().toISOString()
        }
      }
      return { error: null }
    }

    const { error } = await supabase.functions.invoke('workflow-transition', {
      body: { instanceId, action: 'reassign', new_assignee_id: newAssigneeId, comment }
    })

    if (!error) await fetchInstances()
    return { error }
  }

  // ─── Logs ────────────────────────────────────────────────────────────────────
  async function fetchLogs(instanceId: string) {
    if (IS_DEMO) {
      logs.value[instanceId] = MOCK_LOGS[instanceId] ?? []
      return
    }

    const { data } = await supabase
      .from('workflow_logs')
      .select(`*, operator:user_profiles!operator_id(*)`)
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: true })

    logs.value[instanceId] = data ?? []
  }

  // ─── Realtime ────────────────────────────────────────────────────────────────
  function subscribeRealtime() {
    if (IS_DEMO || !authStore.user) return

    realtimeChannel.value = supabase
      .channel('workflow-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workflow_instances'
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const inst = await fetchInstance(payload.new.id)
          if (inst) instances.value.unshift(inst)
        } else if (payload.eventType === 'UPDATE') {
          const idx = instances.value.findIndex(i => i.id === payload.new.id)
          if (idx > -1) {
            const inst = await fetchInstance(payload.new.id)
            if (inst) instances.value[idx] = inst
          }
        } else if (payload.eventType === 'DELETE') {
          instances.value = instances.value.filter(i => i.id !== payload.old.id)
        }
      })
      .subscribe()
  }

  function unsubscribeRealtime() {
    if (realtimeChannel.value) {
      supabase.removeChannel(realtimeChannel.value)
      realtimeChannel.value = null
    }
  }

  return {
    definitions, instances, logs, loading, stats, myTasks, mySubmissions,
    fetchDefinitions, createDefinition, updateDefinition,
    fetchInstances, fetchInstance, submitInstance, transition, reassign,
    fetchLogs, subscribeRealtime, unsubscribeRealtime
  }
})
