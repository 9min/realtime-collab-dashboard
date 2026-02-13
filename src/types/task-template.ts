import type { Database } from './database'

type TaskPriorityEnum = Database['public']['Enums']['task_priority']

export interface SubtaskTemplate {
  title: string
  position: number
}

export interface TaskTemplate {
  id: string
  project_id: string
  created_by: string
  name: string
  description_template: string | null
  priority: TaskPriorityEnum
  subtasks_template: SubtaskTemplate[]
  labels_template: string[]
  is_personal: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface CreateTaskTemplateInput {
  project_id: string
  name: string
  description_template?: string
  priority?: TaskPriorityEnum
  subtasks_template?: SubtaskTemplate[]
  labels_template?: string[]
  is_personal?: boolean
}

export interface UpdateTaskTemplateInput {
  name?: string
  description_template?: string | null
  priority?: TaskPriorityEnum
  subtasks_template?: SubtaskTemplate[]
  labels_template?: string[]
  is_personal?: boolean
  position?: number
}
