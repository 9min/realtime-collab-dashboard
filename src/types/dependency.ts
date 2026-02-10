export interface TaskDependency {
  id: string
  project_id: string
  blocking_task_id: string
  blocked_task_id: string
  created_by: string | null
  created_at: string
}

export interface CreateDependencyInput {
  project_id: string
  blocking_task_id: string
  blocked_task_id: string
  created_by: string
}
