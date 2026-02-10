import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult, CursorPaginatedResult } from '@/types/common'
import type { Database } from '@/types/database'
import type { ActivityLogWithUser } from '@/types/activity'

type Client = SupabaseClient<Database>

interface GetActivityLogsOptions {
  limit?: number
  offset?: number
}

const DEFAULT_LIMIT = 30

export async function getActivityLogs(
  supabase: Client,
  projectId: string,
  options: GetActivityLogsOptions = {},
): Promise<ServiceResult<ActivityLogWithUser[]>> {
  const { limit = DEFAULT_LIMIT, offset = 0 } = options

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, profiles(*)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
    .returns<ActivityLogWithUser[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  return { data, error: null }
}

// 커서 기반 페이지네이션 활동로그 조회
export async function getActivityLogsPaginated(
  supabase: Client,
  projectId: string,
  options: { cursor?: string | null; limit?: number } = {},
): Promise<ServiceResult<CursorPaginatedResult<ActivityLogWithUser>>> {
  const limit = options.limit ?? DEFAULT_LIMIT

  let query = supabase
    .from('activity_logs')
    .select('*, profiles(*)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (options.cursor) {
    query = query.lt('created_at', options.cursor)
  }

  const { data, error } = await query.returns<ActivityLogWithUser[]>()

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } }
  }

  const hasMore = (data?.length ?? 0) > limit
  const items = hasMore ? data!.slice(0, limit) : (data ?? [])
  const nextCursor = hasMore ? items[items.length - 1].created_at : null

  return {
    data: { data: items, nextCursor, hasMore },
    error: null,
  }
}
