import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { Database, Tables } from '@/types/database'
import type { SavedFilterPreset } from '@/stores/kanban-filter-store'

type Client = SupabaseClient<Database>
type FilterPresetRow = Tables<'kanban_filter_presets'>

// 필터 프리셋 조회 (프로젝트 + 유저 조합, unique)
export async function getKanbanFilterPreset(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<SavedFilterPreset | null>> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }
  }

  const { data, error } = await supabase
    .from('kanban_filter_presets')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .returns<FilterPresetRow[]>()
    .maybeSingle()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  if (!data) {
    return { data: null, error: null }
  }

  return { data: data.filters as unknown as SavedFilterPreset, error: null }
}

// 필터 프리셋 저장 (upsert: project_id + user_id unique)
export async function saveKanbanFilterPreset(
  supabase: Client,
  projectId: string,
  filters: SavedFilterPreset,
): Promise<ServiceResult<FilterPresetRow>> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }
  }

  const { data, error } = await supabase
    .from('kanban_filter_presets')
    .upsert(
      {
        project_id: projectId,
        user_id: user.id,
        filters: JSON.parse(JSON.stringify(filters)),
      },
      { onConflict: 'project_id,user_id' },
    )
    .select('*')
    .returns<FilterPresetRow[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '필터 프리셋 저장 실패' },
    }
  }

  return { data, error: null }
}
