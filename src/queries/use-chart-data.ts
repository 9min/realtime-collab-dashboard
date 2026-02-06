'use client'

import { useQuery } from '@tanstack/react-query'

import { useSupabase } from '@/components/providers/supabase-provider'
import { QUERY_CONFIG } from '@/lib/constants'
import { getTaskStatusData, getWeeklyProgressData, getBurndownData } from '@/services/chart-service'

export const chartKeys = {
  taskStatus: (projectId: string) => ['chart', 'task-status', projectId] as const,
  weeklyProgress: (projectId: string) => ['chart', 'weekly-progress', projectId] as const,
  burndown: (projectId: string) => ['chart', 'burndown', projectId] as const,
}

export function useTaskStatusChart(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: chartKeys.taskStatus(projectId),
    queryFn: async () => {
      const result = await getTaskStatusData(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    staleTime: QUERY_CONFIG.STALE_TIME,
    enabled: !!projectId,
  })
}

export function useWeeklyProgressChart(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: chartKeys.weeklyProgress(projectId),
    queryFn: async () => {
      const result = await getWeeklyProgressData(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    staleTime: QUERY_CONFIG.STALE_TIME,
    enabled: !!projectId,
  })
}

export function useBurndownChart(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: chartKeys.burndown(projectId),
    queryFn: async () => {
      const result = await getBurndownData(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    staleTime: QUERY_CONFIG.STALE_TIME,
    enabled: !!projectId,
  })
}
