import type { Tables, InsertTables, UpdateTables } from '@/types/database'
import type { ServiceResult } from '@/types/common'
import { MOCK_COLUMNS } from '@/lib/mock-data'

// TODO: Supabase 연결 후 실제 API로 교체
// 현재는 목 데이터 기반 인메모리 구현

let columns = [...MOCK_COLUMNS]

export async function getColumns(projectId: string): Promise<ServiceResult<Tables<'kanban_columns'>[]>> {
  const filtered = columns
    .filter((c) => c.project_id === projectId)
    .sort((a, b) => a.position - b.position)
  return { data: filtered, error: null }
}

export async function createColumn(
  input: InsertTables<'kanban_columns'>,
): Promise<ServiceResult<Tables<'kanban_columns'>>> {
  const newColumn: Tables<'kanban_columns'> = {
    id: `col-${Date.now()}`,
    project_id: input.project_id,
    title: input.title,
    position: input.position,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  columns.push(newColumn)
  return { data: newColumn, error: null }
}

export async function updateColumn(
  columnId: string,
  input: UpdateTables<'kanban_columns'>,
): Promise<ServiceResult<Tables<'kanban_columns'>>> {
  const index = columns.findIndex((c) => c.id === columnId)
  if (index === -1) {
    return { data: null, error: { code: 'NOT_FOUND', message: '컬럼을 찾을 수 없습니다' } }
  }
  columns[index] = { ...columns[index], ...input, updated_at: new Date().toISOString() }
  return { data: columns[index], error: null }
}

export async function deleteColumn(columnId: string): Promise<ServiceResult<null>> {
  columns = columns.filter((c) => c.id !== columnId)
  return { data: null, error: null }
}

// 컬럼 순서 일괄 업데이트 (DnD 후)
export async function reorderColumns(
  projectId: string,
  orderedIds: string[],
): Promise<ServiceResult<Tables<'kanban_columns'>[]>> {
  orderedIds.forEach((id, index) => {
    const col = columns.find((c) => c.id === id && c.project_id === projectId)
    if (col) {
      col.position = index
      col.updated_at = new Date().toISOString()
    }
  })
  const result = columns
    .filter((c) => c.project_id === projectId)
    .sort((a, b) => a.position - b.position)
  return { data: result, error: null }
}
