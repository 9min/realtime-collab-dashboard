import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
import type { WidgetLayoutItem } from '@/types/dashboard'
import type { Database, Tables } from '@/types/database'

type Client = SupabaseClient<Database>
type DashboardLayout = Tables<'dashboard_layouts'>

// 레이아웃 조회 (프로젝트 + 유저 조합, unique)
export async function getDashboardLayout(
  supabase: Client,
  projectId: string,
): Promise<ServiceResult<WidgetLayoutItem[] | null>> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }
  }

  const { data, error } = await supabase
    .from('dashboard_layouts')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .returns<DashboardLayout[]>()
    .maybeSingle()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  // 레이아웃이 없으면 null 반환 (기본 레이아웃 사용)
  if (!data) {
    return { data: null, error: null }
  }

  return { data: data.layout as unknown as WidgetLayoutItem[], error: null }
}

// 레이아웃 저장 (upsert: project_id + user_id unique)
export async function saveDashboardLayout(
  supabase: Client,
  projectId: string,
  layout: WidgetLayoutItem[],
): Promise<ServiceResult<DashboardLayout>> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }
  }

  const { data, error } = await supabase
    .from('dashboard_layouts')
    .upsert(
      {
        project_id: projectId,
        user_id: user.id,
        layout: JSON.parse(JSON.stringify(layout)),
      },
      { onConflict: 'project_id,user_id' },
    )
    .select('*')
    .returns<DashboardLayout[]>()
    .single()

  if (error || !data) {
    return {
      data: null,
      error: { code: error?.code ?? 'UNKNOWN', message: error?.message ?? '레이아웃 저장 실패' },
    }
  }

  return { data, error: null }
}
