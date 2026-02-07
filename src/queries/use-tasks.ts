'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import { getTasksByProject, createTask, updateTask, deleteTask, moveTask } from '@/services/task-service'
import { chartKeys } from '@/queries/use-chart-data'
import type { InsertTables, UpdateTables } from '@/types/database'
import type { Task, MoveTaskPayload } from '@/types/kanban'

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
    mutationFn: async (input: InsertTables<'tasks'>) => {
      const result = await createTask(supabase, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
      queryClient.invalidateQueries({ queryKey: chartKeys.taskStatus(projectId) })
      toast.success('태스크가 생성되었습니다')
    },
    onError: () => {
      toast.error('태스크 생성에 실패했습니다')
    },
  })
}

export function useUpdateTask(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, input }: { taskId: string; input: UpdateTables<'tasks'> }) => {
      const result = await updateTask(supabase, taskId, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async ({ taskId, input }) => {
      // Optimistic Update: 캐시에서 즉시 반영
      await queryClient.cancelQueries({ queryKey: taskKeys.list(projectId) })
      const previous = queryClient.getQueryData<Task[]>(taskKeys.list(projectId))

      if (previous) {
        queryClient.setQueryData<Task[]>(taskKeys.list(projectId), (old) =>
          old?.map((t) => (t.id === taskId ? { ...t, ...input } : t)),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      // 롤백
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.list(projectId), context.previous)
      }
      toast.error('태스크 수정에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
      queryClient.invalidateQueries({ queryKey: chartKeys.taskStatus(projectId) })
    },
  })
}

export function useDeleteTask(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const result = await deleteTask(supabase, taskId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.list(projectId) })
      const previous = queryClient.getQueryData<Task[]>(taskKeys.list(projectId))

      if (previous) {
        queryClient.setQueryData<Task[]>(taskKeys.list(projectId), (old) =>
          old?.filter((t) => t.id !== taskId),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.list(projectId), context.previous)
      }
      toast.error('태스크 삭제에 실패했습니다')
    },
    onSuccess: () => {
      toast.success('태스크가 삭제되었습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
      queryClient.invalidateQueries({ queryKey: chartKeys.taskStatus(projectId) })
    },
  })
}

export function useMoveTask(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: MoveTaskPayload) => {
      const result = await moveTask(supabase, payload)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async (payload) => {
      // DnD optimistic: 이동한 위치에 즉시 반영
      await queryClient.cancelQueries({ queryKey: taskKeys.list(projectId) })
      const previous = queryClient.getQueryData<Task[]>(taskKeys.list(projectId))

      if (previous) {
        queryClient.setQueryData<Task[]>(taskKeys.list(projectId), (old) =>
          old?.map((t) =>
            t.id === payload.taskId
              ? { ...t, column_id: payload.destinationColumnId, position: payload.newPosition }
              : t,
          ),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.list(projectId), context.previous)
      }
      toast.error('태스크 이동에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
    },
  })
}
