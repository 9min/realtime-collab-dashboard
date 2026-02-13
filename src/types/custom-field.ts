export const CUSTOM_FIELD_TYPE = {
  TEXT: 'text',
  NUMBER: 'number',
  SELECT: 'select',
  DATE: 'date',
  CHECKBOX: 'checkbox',
} as const

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPE)[keyof typeof CUSTOM_FIELD_TYPE]

export interface CustomFieldDefinition {
  id: string
  project_id: string
  name: string
  field_type: CustomFieldType
  options: string[] | null
  is_required: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface TaskCustomFieldValue {
  id: string
  task_id: string
  field_id: string
  value: string | null
  created_at: string
  updated_at: string
}

export interface CreateCustomFieldInput {
  project_id: string
  name: string
  field_type: CustomFieldType
  options?: string[]
  is_required?: boolean
}

export interface UpdateCustomFieldInput {
  name?: string
  options?: string[] | null
  is_required?: boolean
  position?: number
}
