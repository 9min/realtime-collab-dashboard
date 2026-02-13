'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from '@/services/column-service'
import { QUERY_CONFIG } from '@/lib/constants'
import type { InsertTables, UpdateTables } from '@/types/database'

export const columnKeys = {
  list: (projectId: string) => ['columns', projectId] as const,
}

export function useColumns(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: columnKeys.list(projectId),
    queryFn: async () => {
      const result = await getColumns(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    refetchInterval: QUERY_CONFIG.REALTIME_POLL_INTERVAL,
  })
}

export function useCreateColumn(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Omit<InsertTables<'kanban_columns'>, 'project_id'>) =>
      createColumn(supabase, { ...input, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(projectId) })
    },
  })
}

export function useUpdateColumn(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      columnId,
      input,
    }: {
      columnId: string
      input: UpdateTables<'kanban_columns'>
    }) => updateColumn(supabase, columnId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(projectId) })
    },
  })
}

export function useDeleteColumn(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (columnId: string) => deleteColumn(supabase, columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(projectId) })
    },
  })
}

export function useReorderColumns(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderColumns(supabase, projectId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: columnKeys.list(projectId) })
    },
  })
}
