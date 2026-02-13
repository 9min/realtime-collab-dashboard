'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useSupabase } from '@/components/providers/supabase-provider'
import { getDashboardLayout, saveDashboardLayout } from '@/services/dashboard-service'
import type { WidgetLayoutItem } from '@/types/dashboard'

export const dashboardLayoutKeys = {
  layout: (projectId: string) => ['dashboard-layout', projectId] as const,
}

// 레이아웃 조회
export function useDashboardLayout(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: dashboardLayoutKeys.layout(projectId),
    queryFn: async () => {
      const result = await getDashboardLayout(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!projectId,
  })
}

// 레이아웃 저장 (upsert)
export function useSaveDashboardLayout(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (layout: WidgetLayoutItem[]) => saveDashboardLayout(supabase, projectId, layout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardLayoutKeys.layout(projectId) })
    },
  })
}
