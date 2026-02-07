import type { SupabaseClient } from '@supabase/supabase-js'

import type { ServiceResult } from '@/types/common'
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
