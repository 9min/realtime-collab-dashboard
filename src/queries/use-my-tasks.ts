'use client'

import { useQuery } from '@tanstack/react-query'

import { useSupabase } from '@/components/providers/supabase-provider'
import { getMyTasks } from '@/services/my-tasks-service'
import { QUERY_CONFIG } from '@/lib/constants'

export const myTaskKeys = {
  list: (userId: string) => ['my-tasks', userId] as const,
}

export function useMyTasks(userId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: myTaskKeys.list(userId ?? ''),
    queryFn: async () => {
      if (!userId) return []
      const result = await getMyTasks(supabase, userId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!userId,
    staleTime: QUERY_CONFIG.STALE_TIME,
  })
}
