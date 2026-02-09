'use client'

import { useQuery } from '@tanstack/react-query'

import { useSupabase } from '@/components/providers/supabase-provider'
import { getActivityLogs } from '@/services/activity-service'

export const activityKeys = {
  list: (projectId: string) => ['activity-logs', projectId] as const,
}

export function useActivityLogs(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: activityKeys.list(projectId),
    queryFn: async () => {
      const result = await getActivityLogs(supabase, projectId, { limit: 100 })
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!projectId,
  })
}
