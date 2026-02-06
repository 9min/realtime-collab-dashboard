import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database, Tables, InsertTables, UpdateTables } from '@/types/database'

type Client = SupabaseClient<Database>
type KanbanColumn = Tables<'kanban_columns'>

// 프로젝트의 칸반 컬럼 목록 조회
export async function getColumns(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<KanbanColumn[]>> {
  const { data, error } = await supabase
    .from('kanban_columns')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })
    .returns<KanbanColumn[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data, error: null }
}

// 컬럼 생성
export async function createColumn(
  supabase: Client,
  input: InsertTables<'kanban_columns'>,
): Promise<ServiceResult<KanbanColumn>> {
  const { data, error } = await supabase
    .from('kanban_columns')
    .insert(input)
    .select('*')
    .returns<KanbanColumn[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '컬럼 생성 실패' },
    }
  }

  return { data, error: null }
}

// 컬럼 수정
export async function updateColumn(
  supabase: Client,
  columnId: string,
  input: UpdateTables<'kanban_columns'>,
): Promise<ServiceResult<KanbanColumn>> {
  const { data, error } = await supabase
    .from('kanban_columns')
    .update(input)
    .eq('id', columnId)
    .select('*')
    .returns<KanbanColumn[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '컬럼 수정 실패' },
    }
  }

  return { data, error: null }
}

// 컬럼 삭제
export async function deleteColumn(
  supabase: Client,
  columnId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('kanban_columns')
    .delete()
    .eq('id', columnId)

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data: null, error: null }
}

// 컬럼 순서 일괄 업데이트 (DnD 후)
export async function reorderColumns(
  supabase: Client,
  projectId: string,
  orderedIds: string[],
): Promise<ServiceResult<KanbanColumn[]>> {
  // 각 컬럼의 position을 순서대로 업데이트
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('kanban_columns')
      .update({ position: index })
      .eq('id', id)
      .eq('project_id', projectId),
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) {
    return { data: null, error: { code: failed.error.code, message: failed.error.message } }
  }

  // 업데이트 후 전체 목록 재조회
  return getColumns(supabase, projectId)
}
