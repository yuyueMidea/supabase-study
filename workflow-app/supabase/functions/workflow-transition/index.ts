// supabase/functions/workflow-transition/index.ts
// Deploy with: supabase functions deploy workflow-transition

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get calling user
    const authHeader = req.headers.get('Authorization')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    )
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { action } = body

    let result: any

    if (action === 'submit') {
      result = await handleSubmit(supabase, user.id, body)
    } else if (['approve', 'reject', 'cancel'].includes(action)) {
      result = await handleTransition(supabase, user.id, body)
    } else if (action === 'reassign') {
      result = await handleReassign(supabase, user.id, body)
    } else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleSubmit(supabase: any, userId: string, body: any) {
  const { definition_id, title, payload, priority, due_date } = body

  // Load definition
  const { data: def, error: defErr } = await supabase
    .from('workflow_definitions')
    .select('*')
    .eq('id', definition_id)
    .single()

  if (defErr || !def) throw new Error('Definition not found')

  const steps = def.steps as any[]
  const firstStep = steps[0]
  const secondStep = steps[1]

  // Resolve first assignee (skip the 'start' step)
  const assigneeId = await resolveAssignee(supabase, userId, secondStep)

  // Create instance
  const { data: instance, error: instErr } = await supabase
    .from('workflow_instances')
    .insert({
      definition_id,
      title,
      current_step: secondStep?.id ?? firstStep.id,
      status: 'running',
      priority: priority ?? 'normal',
      payload: payload ?? {},
      assignee_id: assigneeId,
      created_by: userId,
      due_date: due_date ?? null
    })
    .select(`*, workflow_definitions(*), assignee:user_profiles!assignee_id(*), creator:user_profiles!created_by(*)`)
    .single()

  if (instErr) throw instErr

  // Write submit log
  await supabase.from('workflow_logs').insert({
    instance_id: instance.id,
    from_step: null,
    to_step: secondStep?.id ?? firstStep.id,
    action: 'submit',
    operator_id: userId,
    comment: null
  })

  // Notify assignee
  if (assigneeId && assigneeId !== userId) {
    await createNotification(supabase, assigneeId, instance.id, 'task_assigned',
      '新任务待审批',
      `您有一个新的审批任务：${title}`
    )
  }

  return { instance }
}

async function handleTransition(supabase: any, userId: string, body: any) {
  const { instanceId, action, comment } = body

  // Load instance + definition
  const { data: instance, error: instErr } = await supabase
    .from('workflow_instances')
    .select('*, workflow_definitions(*)')
    .eq('id', instanceId)
    .single()

  if (instErr || !instance) throw new Error('Instance not found')

  const steps = instance.workflow_definitions.steps as any[]
  const currentIdx = steps.findIndex((s: any) => s.id === instance.current_step)

  let newStep = instance.current_step
  let newStatus = instance.status
  let newAssigneeId: string | null = instance.assignee_id

  if (action === 'approve') {
    if (currentIdx < steps.length - 1) {
      const next = steps[currentIdx + 1]
      newStep = next.id
      newStatus = next.type === 'end' ? 'approved' : 'running'
      newAssigneeId = next.type === 'end' ? null : await resolveAssignee(supabase, instance.created_by, next)
    } else {
      newStatus = 'approved'
      newAssigneeId = null
    }
  } else if (action === 'reject') {
    newStatus = 'rejected'
    newAssigneeId = null
  } else if (action === 'cancel') {
    newStatus = 'cancelled'
    newAssigneeId = null
  }

  // Update instance
  await supabase.from('workflow_instances').update({
    current_step: newStep,
    status: newStatus,
    assignee_id: newAssigneeId
  }).eq('id', instanceId)

  // Write log
  await supabase.from('workflow_logs').insert({
    instance_id: instanceId,
    from_step: instance.current_step,
    to_step: newStep !== instance.current_step ? newStep : null,
    action,
    operator_id: userId,
    comment: comment ?? null
  })

  // Notifications
  if (action === 'approve' && newStatus === 'approved') {
    await createNotification(supabase, instance.created_by, instanceId, 'task_approved',
      '申请已通过', `您的申请「${instance.title}」已全部审批通过`)
  } else if (action === 'approve' && newAssigneeId && newAssigneeId !== userId) {
    await createNotification(supabase, newAssigneeId, instanceId, 'task_assigned',
      '新任务待审批', `有一个审批任务等待您处理：${instance.title}`)
  } else if (action === 'reject') {
    await createNotification(supabase, instance.created_by, instanceId, 'task_rejected',
      '申请被驳回', `您的申请「${instance.title}」被驳回${comment ? '：' + comment : ''}`)
  }

  return { success: true, status: newStatus }
}

async function handleReassign(supabase: any, userId: string, body: any) {
  const { instanceId, new_assignee_id, comment } = body

  const { data: instance } = await supabase
    .from('workflow_instances').select('title, created_by').eq('id', instanceId).single()

  await supabase.from('workflow_instances')
    .update({ assignee_id: new_assignee_id }).eq('id', instanceId)

  await supabase.from('workflow_logs').insert({
    instance_id: instanceId,
    action: 'reassign',
    operator_id: userId,
    comment: comment ?? null
  })

  if (new_assignee_id) {
    await createNotification(supabase, new_assignee_id, instanceId, 'task_assigned',
      '任务已转交给您', `${instance?.title} 已转交给您处理`)
  }

  return { success: true }
}

async function resolveAssignee(supabase: any, creatorId: string, step: any): Promise<string | null> {
  if (!step) return null
  if (step.type === 'end') return null

  if (step.assignee_role === 'self') return creatorId
  if (step.assignee_role === 'specific_user') return step.assignee_id ?? null

  // For manager/hr/admin: find a user with that role
  const roleMap: Record<string, string> = {
    manager: 'manager',
    hr: 'employee',   // simplified: pick first hr-dept employee
    admin: 'admin'
  }

  const { data: users } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('role', roleMap[step.assignee_role] ?? 'employee')
    .neq('id', creatorId)
    .limit(1)

  return users?.[0]?.id ?? null
}

async function createNotification(
  supabase: any,
  userId: string,
  instanceId: string,
  type: string,
  title: string,
  message: string
) {
  await supabase.from('notifications').insert({
    user_id: userId,
    instance_id: instanceId,
    type,
    title,
    message
  })
}
