// ─── Auth ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'admin' | 'manager' | 'employee'
  department?: string
  created_at: string
}

// ─── Workflow Definition ─────────────────────────────────────────────────────

export type StepAssigneeRole = 'self' | 'manager' | 'hr' | 'admin' | 'specific_user'
export type StepType = 'start' | 'approval' | 'review' | 'notification' | 'end'

export interface WorkflowStep {
  id: string
  name: string
  type: StepType
  assignee_role: StepAssigneeRole
  assignee_id?: string          // if role = specific_user
  allow_comment: boolean
  required_comment: boolean
  timeout_hours?: number        // auto-approve/reject after N hours
  timeout_action?: 'approve' | 'reject'
  next_on_approve?: string      // step id to go next
  next_on_reject?: string       // step id to go on reject (or null = end)
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  steps: WorkflowStep[]
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Workflow Instance ───────────────────────────────────────────────────────

export type InstanceStatus = 'pending' | 'running' | 'approved' | 'rejected' | 'cancelled'

export interface WorkflowInstance {
  id: string
  definition_id: string
  title: string
  current_step: string
  status: InstanceStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  payload: Record<string, any>
  assignee_id: string | null
  created_by: string
  due_date?: string
  created_at: string
  updated_at: string
  // Joined
  workflow_definitions?: WorkflowDefinition
  assignee?: UserProfile
  creator?: UserProfile
}

// ─── Workflow Log ────────────────────────────────────────────────────────────

export type LogAction = 'submit' | 'approve' | 'reject' | 'cancel' | 'reassign' | 'comment' | 'timeout'

export interface WorkflowLog {
  id: string
  instance_id: string
  from_step: string | null
  to_step: string | null
  action: LogAction
  operator_id: string
  comment: string | null
  created_at: string
  operator?: UserProfile
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  user_id: string
  instance_id: string
  type: 'task_assigned' | 'task_approved' | 'task_rejected' | 'task_cancelled' | 'comment_added'
  title: string
  message: string
  is_read: boolean
  created_at: string
  instance?: WorkflowInstance
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_pending: number
  total_running: number
  total_approved: number
  total_rejected: number
  my_tasks: number
  completed_today: number
}

// ─── UI ──────────────────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}
