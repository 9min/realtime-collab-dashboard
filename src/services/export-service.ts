import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, Tables } from '@/types/database'

type Client = SupabaseClient<Database>

interface ExportRow {
  title: string
  description: string
  priority: string
  assignee: string
  column: string
  dueDate: string
  subtasks: string
  labels: string
  createdAt: string
  updatedAt: string
}

const CSV_HEADERS = [
  '제목',
  '설명',
  '우선순위',
  '담당자',
  '상태(컬럼)',
  '마감일',
  '서브태스크',
  '라벨',
  '생성일',
  '수정일',
] as const

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function rowToCsv(row: ExportRow): string {
  return [
    row.title,
    row.description,
    row.priority,
    row.assignee,
    row.column,
    row.dueDate,
    row.subtasks,
    row.labels,
    row.createdAt,
    row.updatedAt,
  ]
    .map(escapeCsvField)
    .join(',')
}

async function fetchExportData(supabase: Client, projectId: string) {
  const [
    tasksResult,
    columnsResult,
    membersResult,
    subtasksResult,
    labelsResult,
    taskLabelsResult,
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('project_id', projectId).order('position'),
    supabase.from('kanban_columns').select('*').eq('project_id', projectId),
    supabase
      .from('project_members')
      .select('user_id, profiles(full_name, email)')
      .eq('project_id', projectId),
    supabase.from('subtasks').select('*').eq('project_id', projectId).order('position'),
    supabase.from('labels').select('*').eq('project_id', projectId),
    supabase
      .from('task_labels')
      .select('task_id, label_id, labels!inner(project_id)')
      .eq('labels.project_id', projectId),
  ])

  const tasks = (tasksResult.data ?? []) as Tables<'tasks'>[]
  const columns = (columnsResult.data ?? []) as Tables<'kanban_columns'>[]
  const members = (membersResult.data ?? []) as Array<{
    user_id: string
    profiles: { full_name: string | null; email: string }
  }>
  const subtasks = (subtasksResult.data ?? []) as Tables<'subtasks'>[]
  const labels = (labelsResult.data ?? []) as Tables<'labels'>[]
  const taskLabels = (taskLabelsResult.data ?? []) as Array<{ task_id: string; label_id: string }>

  // 룩업 맵
  const columnMap = new Map(columns.map((c) => [c.id, c.title]))
  const memberMap = new Map(
    members.map((m) => [m.user_id, m.profiles.full_name ?? m.profiles.email]),
  )
  const labelMap = new Map(labels.map((l) => [l.id, l.name]))

  // task별 서브태스크 집계
  const subtaskCountMap = new Map<string, { completed: number; total: number }>()
  for (const st of subtasks) {
    const entry = subtaskCountMap.get(st.task_id) ?? { completed: 0, total: 0 }
    entry.total++
    if (st.completed) entry.completed++
    subtaskCountMap.set(st.task_id, entry)
  }

  // task별 라벨
  const taskLabelMap = new Map<string, string[]>()
  for (const tl of taskLabels) {
    const name = labelMap.get(tl.label_id)
    if (!name) continue
    const list = taskLabelMap.get(tl.task_id) ?? []
    list.push(name)
    taskLabelMap.set(tl.task_id, list)
  }

  // ExportRow로 변환
  const rows: ExportRow[] = tasks.map((task) => {
    const st = subtaskCountMap.get(task.id)
    const tl = taskLabelMap.get(task.id)
    return {
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      assignee: task.assignee_id ? (memberMap.get(task.assignee_id) ?? '') : '',
      column: columnMap.get(task.column_id) ?? '',
      dueDate: task.due_date ?? '',
      subtasks: st ? `${st.completed}/${st.total}` : '',
      labels: tl ? tl.join(', ') : '',
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    }
  })

  return rows
}

export async function exportAsCsv(supabase: Client, projectId: string): Promise<string> {
  const rows = await fetchExportData(supabase, projectId)
  const header = CSV_HEADERS.join(',')
  const body = rows.map(rowToCsv).join('\n')
  return `${header}\n${body}`
}

export async function exportAsJson(supabase: Client, projectId: string): Promise<string> {
  const rows = await fetchExportData(supabase, projectId)
  return JSON.stringify(rows, null, 2)
}

export { escapeCsvField }
