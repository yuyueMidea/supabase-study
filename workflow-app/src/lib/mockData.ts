import type { WorkflowDefinition, WorkflowInstance, WorkflowLog, UserProfile, Notification } from '@/types'

export const MOCK_USER: UserProfile = {
  id: 'user-1',
  email: 'admin@company.com',
  full_name: '张三',
  role: 'admin',
  department: '产品部',
  created_at: new Date().toISOString()
}

export const MOCK_USERS: UserProfile[] = [
  MOCK_USER,
  { id: 'user-2', email: 'manager@company.com', full_name: '李四', role: 'manager', department: '研发部', created_at: new Date().toISOString() },
  { id: 'user-3', email: 'hr@company.com', full_name: '王五', role: 'employee', department: '人事部', created_at: new Date().toISOString() },
  { id: 'user-4', email: 'emp@company.com', full_name: '赵六', role: 'employee', department: '市场部', created_at: new Date().toISOString() }
]

export const MOCK_DEFINITIONS: WorkflowDefinition[] = [
  {
    id: 'def-1',
    name: '请假申请',
    description: '员工请假审批流程，需主管确认后HR备案',
    category: '人事',
    icon: '🏖️',
    color: '#6270f3',
    is_active: true,
    created_by: 'user-1',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
    steps: [
      { id: 'submit', name: '提交申请', type: 'start', assignee_role: 'self', allow_comment: true, required_comment: false },
      { id: 'manager_review', name: '主管审批', type: 'approval', assignee_role: 'manager', allow_comment: true, required_comment: true, timeout_hours: 48, timeout_action: 'approve' },
      { id: 'hr_confirm', name: 'HR备案', type: 'review', assignee_role: 'hr', allow_comment: true, required_comment: false },
      { id: 'done', name: '完成', type: 'end', assignee_role: 'self', allow_comment: false, required_comment: false }
    ]
  },
  {
    id: 'def-2',
    name: '报销申请',
    description: '费用报销审批，超过5000元需财务总监复核',
    category: '财务',
    icon: '💰',
    color: '#10b981',
    is_active: true,
    created_by: 'user-1',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    updated_at: new Date().toISOString(),
    steps: [
      { id: 'submit', name: '提交申请', type: 'start', assignee_role: 'self', allow_comment: true, required_comment: false },
      { id: 'manager_approve', name: '主管审批', type: 'approval', assignee_role: 'manager', allow_comment: true, required_comment: false },
      { id: 'finance_review', name: '财务审核', type: 'approval', assignee_role: 'admin', allow_comment: true, required_comment: true },
      { id: 'done', name: '打款完成', type: 'end', assignee_role: 'self', allow_comment: false, required_comment: false }
    ]
  },
  {
    id: 'def-3',
    name: '采购申请',
    description: '物资采购审批流程',
    category: '行政',
    icon: '📦',
    color: '#f59e0b',
    is_active: true,
    created_by: 'user-1',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
    steps: [
      { id: 'submit', name: '提交申请', type: 'start', assignee_role: 'self', allow_comment: true, required_comment: false },
      { id: 'dept_approve', name: '部门负责人审批', type: 'approval', assignee_role: 'manager', allow_comment: true, required_comment: false },
      { id: 'admin_review', name: '行政审核', type: 'review', assignee_role: 'admin', allow_comment: true, required_comment: false },
      { id: 'done', name: '采购完成', type: 'end', assignee_role: 'self', allow_comment: false, required_comment: false }
    ]
  }
]

const now = Date.now()

export const MOCK_INSTANCES: WorkflowInstance[] = [
  {
    id: 'inst-1',
    definition_id: 'def-1',
    title: '年假申请 - 5天',
    current_step: 'manager_review',
    status: 'running',
    priority: 'normal',
    payload: { leave_type: '年假', days: 5, reason: '家庭旅行', start_date: '2024-08-01', end_date: '2024-08-05' },
    assignee_id: 'user-2',
    created_by: 'user-1',
    due_date: new Date(now + 86400000 * 2).toISOString(),
    created_at: new Date(now - 86400000).toISOString(),
    updated_at: new Date(now - 3600000).toISOString(),
    workflow_definitions: MOCK_DEFINITIONS[0],
    assignee: MOCK_USERS[1],
    creator: MOCK_USER
  },
  {
    id: 'inst-2',
    definition_id: 'def-2',
    title: '差旅报销 - ¥3,200',
    current_step: 'manager_approve',
    status: 'running',
    priority: 'high',
    payload: { amount: 3200, description: '上海出差交通住宿', receipt_count: 5 },
    assignee_id: 'user-1',
    created_by: 'user-4',
    created_at: new Date(now - 86400000 * 2).toISOString(),
    updated_at: new Date(now - 7200000).toISOString(),
    workflow_definitions: MOCK_DEFINITIONS[1],
    assignee: MOCK_USER,
    creator: MOCK_USERS[3]
  },
  {
    id: 'inst-3',
    definition_id: 'def-1',
    title: '病假申请 - 2天',
    current_step: 'done',
    status: 'approved',
    priority: 'urgent',
    payload: { leave_type: '病假', days: 2, reason: '发烧感冒', start_date: '2024-07-20', end_date: '2024-07-21' },
    assignee_id: null,
    created_by: 'user-3',
    created_at: new Date(now - 86400000 * 5).toISOString(),
    updated_at: new Date(now - 86400000 * 3).toISOString(),
    workflow_definitions: MOCK_DEFINITIONS[0],
    assignee: undefined,
    creator: MOCK_USERS[2]
  },
  {
    id: 'inst-4',
    definition_id: 'def-3',
    title: '办公椅采购 × 10',
    current_step: 'dept_approve',
    status: 'pending',
    priority: 'low',
    payload: { item: '人体工学椅', quantity: 10, unit_price: 1200, total: 12000 },
    assignee_id: 'user-2',
    created_by: 'user-1',
    created_at: new Date(now - 3600000 * 3).toISOString(),
    updated_at: new Date(now - 3600000).toISOString(),
    workflow_definitions: MOCK_DEFINITIONS[2],
    assignee: MOCK_USERS[1],
    creator: MOCK_USER
  },
  {
    id: 'inst-5',
    definition_id: 'def-2',
    title: '团队建设费用 - ¥8,500',
    current_step: 'submit',
    status: 'rejected',
    priority: 'normal',
    payload: { amount: 8500, description: '季度团建活动费用', receipt_count: 3 },
    assignee_id: null,
    created_by: 'user-2',
    created_at: new Date(now - 86400000 * 7).toISOString(),
    updated_at: new Date(now - 86400000 * 6).toISOString(),
    workflow_definitions: MOCK_DEFINITIONS[1],
    assignee: undefined,
    creator: MOCK_USERS[1]
  }
]

export const MOCK_LOGS: Record<string, WorkflowLog[]> = {
  'inst-1': [
    { id: 'log-1', instance_id: 'inst-1', from_step: null, to_step: 'submit', action: 'submit', operator_id: 'user-1', comment: '申请年假5天，家庭旅行', created_at: new Date(now - 86400000).toISOString(), operator: MOCK_USER },
    { id: 'log-2', instance_id: 'inst-1', from_step: 'submit', to_step: 'manager_review', action: 'approve', operator_id: 'user-1', comment: null, created_at: new Date(now - 3600000 * 20).toISOString(), operator: MOCK_USER }
  ],
  'inst-2': [
    { id: 'log-3', instance_id: 'inst-2', from_step: null, to_step: 'submit', action: 'submit', operator_id: 'user-4', comment: '上海出差三天，包含高铁票和酒店', created_at: new Date(now - 86400000 * 2).toISOString(), operator: MOCK_USERS[3] }
  ],
  'inst-3': [
    { id: 'log-4', instance_id: 'inst-3', from_step: null, to_step: 'submit', action: 'submit', operator_id: 'user-3', comment: '发烧38.5度，需要休息', created_at: new Date(now - 86400000 * 5).toISOString(), operator: MOCK_USERS[2] },
    { id: 'log-5', instance_id: 'inst-3', from_step: 'submit', to_step: 'manager_review', action: 'approve', operator_id: 'user-2', comment: '好的，注意休息', created_at: new Date(now - 86400000 * 4).toISOString(), operator: MOCK_USERS[1] },
    { id: 'log-6', instance_id: 'inst-3', from_step: 'manager_review', to_step: 'done', action: 'approve', operator_id: 'user-3', comment: '已备案', created_at: new Date(now - 86400000 * 3).toISOString(), operator: MOCK_USERS[2] }
  ],
  'inst-5': [
    { id: 'log-7', instance_id: 'inst-5', from_step: null, to_step: 'submit', action: 'submit', operator_id: 'user-2', comment: '季度团建，预算8500元', created_at: new Date(now - 86400000 * 7).toISOString(), operator: MOCK_USERS[1] },
    { id: 'log-8', instance_id: 'inst-5', from_step: 'submit', to_step: null, action: 'reject', operator_id: 'user-1', comment: '超出本季度预算上限，请重新申请', created_at: new Date(now - 86400000 * 6).toISOString(), operator: MOCK_USER }
  ]
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'user-1',
    instance_id: 'inst-2',
    type: 'task_assigned',
    title: '新任务待审批',
    message: '赵六 提交了报销申请「差旅报销 - ¥3,200」，等待您的审批',
    is_read: false,
    created_at: new Date(now - 7200000).toISOString()
  },
  {
    id: 'notif-2',
    user_id: 'user-1',
    instance_id: 'inst-3',
    type: 'task_approved',
    title: '申请已通过',
    message: '您发起的「年假申请 - 5天」已全部审批通过',
    is_read: false,
    created_at: new Date(now - 86400000 * 3).toISOString()
  },
  {
    id: 'notif-3',
    user_id: 'user-1',
    instance_id: 'inst-5',
    type: 'task_rejected',
    title: '申请被驳回',
    message: '「团队建设费用 - ¥8,500」被驳回：超出本季度预算上限',
    is_read: true,
    created_at: new Date(now - 86400000 * 6).toISOString()
  }
]
