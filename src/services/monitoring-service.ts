import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import type { MonitoringStats } from '@/types/monitoring'

type Client = SupabaseClient<Database>

const DEFAULT_STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024 // 1 GB

export async function getMonitoringStats(supabase: Client): Promise<MonitoringStats> {
  const [usersResult, projectsResult, tasksResult, storageResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('tasks').select('id', { count: 'exact', head: true }),
    supabase.from('task_attachments').select('file_size'),
  ])

  const storageUsedBytes = (storageResult.data ?? []).reduce(
    (sum, row) => sum + (row.file_size ?? 0),
    0,
  )

  const storageLimitBytes = Number(process.env.STORAGE_LIMIT_BYTES) || DEFAULT_STORAGE_LIMIT_BYTES

  return {
    totalUsers: usersResult.count ?? 0,
    totalProjects: projectsResult.count ?? 0,
    totalTasks: tasksResult.count ?? 0,
    storageUsedBytes,
    storageLimitBytes,
  }
}
