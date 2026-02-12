'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useSupabase } from '@/components/providers/supabase-provider'
import { getKanbanFilterPreset, saveKanbanFilterPreset } from '@/services/kanban-filter-service'
import type { SavedFilterPreset } from '@/stores/kanban-filter-store'

export const kanbanFilterPresetKeys = {
  preset: (projectId: string) => ['kanban-filter-preset', projectId] as const,
}

// 필터 프리셋 조회
export function useKanbanFilterPreset(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: kanbanFilterPresetKeys.preset(projectId),
    queryFn: async () => {
      const result = await getKanbanFilterPreset(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!projectId,
  })
}

// 필터 프리셋 저장 (upsert)
export function useSaveKanbanFilterPreset(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (filters: SavedFilterPreset) =>
      saveKanbanFilterPreset(supabase, projectId, filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanFilterPresetKeys.preset(projectId) })
    },
  })
}
