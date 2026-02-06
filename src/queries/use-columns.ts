'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { getColumns, createColumn, updateColumn, deleteColumn, reorderColumns } from '@/services/column-service'
import type { InsertTables, UpdateTables } from '@/types/database'

const COLUMNS_KEY = (projectId: string) => ['columns', projectId] as const

export function useColumns(projectId: string) {
  return useQuery({
    queryKey: COLUMNS_KEY(projectId),
    queryFn: async () => {
      const result = await getColumns(projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useCreateColumn(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Omit<InsertTables<'kanban_columns'>, 'project_id'>) =>
      createColumn({ ...input, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLUMNS_KEY(projectId) })
    },
  })
}

export function useUpdateColumn(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ columnId, input }: { columnId: string; input: UpdateTables<'kanban_columns'> }) =>
      updateColumn(columnId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLUMNS_KEY(projectId) })
    },
  })
}

export function useDeleteColumn(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (columnId: string) => deleteColumn(columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLUMNS_KEY(projectId) })
    },
  })
}

export function useReorderColumns(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderColumns(projectId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLUMNS_KEY(projectId) })
    },
  })
}
