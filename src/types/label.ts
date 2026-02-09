import type { Tables } from './database'

export type Label = Tables<'labels'>
export type TaskLabel = Tables<'task_labels'>

export interface LabelWithAssignment extends Label {
  assigned: boolean
}
