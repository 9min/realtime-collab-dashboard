'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useSupabase } from '@/components/providers/supabase-provider'
import { getTasksByProject, createTask, updateTask, deleteTask, moveTask } from '@/services/task-service'
import type { InsertTables, UpdateTables } from '@/types/database'
import type { MoveTaskPayload } from '@/types/kanban'

export const taskKeys = {
  list: (projectId: string) => ['tasks', projectId] as const,
}

export function useTasks(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: taskKeys.list(projectId),
    queryFn: async () => {
      const result = await getTasksByProject(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useCreateTask(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: InsertTables<'tasks'>) => createTask(supabase, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })
}

export function useUpdateTask(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTables<'tasks'> }) =>
      updateTask(supabase, taskId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })
}

export function useDeleteTask(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(supabase, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })
}

export function useMoveTask(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: MoveTaskPayload) => moveTask(supabase, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })
}
