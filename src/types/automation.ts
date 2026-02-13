export const TRIGGER_TYPE = {
  TASK_MOVED_TO_COLUMN: 'task_moved_to_column',
  TASK_CREATED: 'task_created',
  PRIORITY_CHANGED: 'priority_changed',
  ASSIGNEE_CHANGED: 'assignee_changed',
} as const
export type TriggerType = (typeof TRIGGER_TYPE)[keyof typeof TRIGGER_TYPE]

export const ACTION_TYPE = {
  SET_PRIORITY: 'set_priority',
  MOVE_TO_COLUMN: 'move_to_column',
  SEND_NOTIFICATION: 'send_notification',
} as const
export type ActionType = (typeof ACTION_TYPE)[keyof typeof ACTION_TYPE]

export const TRIGGER_LABELS: Record<string, string> = {
  task_moved_to_column: '태스크가 컬럼으로 이동',
  task_created: '태스크 생성됨',
  priority_changed: '우선순위 변경됨',
  assignee_changed: '담당자 변경됨',
}

export const ACTION_LABELS: Record<string, string> = {
  set_priority: '우선순위 설정',
  move_to_column: '컬럼으로 이동',
  send_notification: '알림 전송',
}

export interface AutomationRule {
  id: string
  project_id: string
  name: string
  trigger_type: string
  trigger_config: Record<string, unknown>
  action_type: string
  action_config: Record<string, unknown>
  is_active: boolean
  execution_count: number
  last_executed_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface AutomationExecution {
  id: string
  rule_id: string
  project_id: string
  trigger_entity_id: string | null
  trigger_data: Record<string, unknown>
  action_result: Record<string, unknown>
  status: string
  error_message: string | null
  executed_at: string
}

export interface CreateAutomationRuleInput {
  project_id: string
  name: string
  trigger_type: string
  trigger_config?: Record<string, unknown>
  action_type: string
  action_config?: Record<string, unknown>
}

export interface UpdateAutomationRuleInput {
  name?: string
  trigger_type?: string
  trigger_config?: Record<string, unknown>
  action_type?: string
  action_config?: Record<string, unknown>
  is_active?: boolean
}
