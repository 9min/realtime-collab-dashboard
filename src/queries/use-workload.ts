'use client'

import { useQuery } from '@tanstack/react-query'

import { useSupabase } from '@/components/providers/supabase-provider'
import { getWorkload } from '@/services/workload-service'
export const workloadKeys = {
  detail: (projectId: string) => ['workload', projectId] as const,
}

export function useWorkload(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: workloadKeys.detail(projectId),
    queryFn: async () => {
      const result = await getWorkload(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}
