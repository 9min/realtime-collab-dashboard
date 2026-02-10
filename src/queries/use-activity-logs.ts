'use client'

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'

import { useSupabase } from '@/components/providers/supabase-provider'
import { getActivityLogs, getActivityLogsPaginated } from '@/services/activity-service'

export const activityKeys = {
  list: (projectId: string) => ['activity-logs', projectId] as const,
  infinite: (projectId: string) => ['activity-logs', projectId, 'infinite'] as const,
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

export function useInfiniteActivityLogs(projectId: string, options?: { limit?: number }) {
  const supabase = useSupabase()

  return useInfiniteQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: activityKeys.infinite(projectId),
    queryFn: async ({ pageParam }) => {
      const result = await getActivityLogsPaginated(supabase, projectId, {
        cursor: pageParam ?? null,
        limit: options?.limit,
      })
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!projectId,
  })
}
