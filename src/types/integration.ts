export const INTEGRATION_TYPE = {
  SLACK: 'slack',
  GITHUB: 'github',
} as const

export type IntegrationType = (typeof INTEGRATION_TYPE)[keyof typeof INTEGRATION_TYPE]

export const INTEGRATION_EVENT = {
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_DELETED: 'task_deleted',
} as const

export type IntegrationEvent = (typeof INTEGRATION_EVENT)[keyof typeof INTEGRATION_EVENT]

export interface SlackConfig {
  webhookUrl: string
  channel?: string
  events: IntegrationEvent[]
}

export interface GitHubConfig {
  owner: string
  repo: string
  token: string
  events: IntegrationEvent[]
}

export interface ProjectIntegration {
  id: string
  project_id: string
  type: IntegrationType
  config: SlackConfig | GitHubConfig
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WebhookPayload {
  projectId: string
  eventType: IntegrationEvent
  data: {
    taskTitle?: string
    taskId?: string
    userName?: string
    columnName?: string
    [key: string]: unknown
  }
}
