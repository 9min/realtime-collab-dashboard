'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getSubtasks,
  getProjectSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask,
} from '@/services/subtask-service'
import type { InsertTables, UpdateTables, Tables } from '@/types/database'

type Subtask = Tables<'subtasks'>

export const subtaskKeys = {
  list: (taskId: string) => ['subtasks', taskId] as const,
  byProject: (projectId: string) => ['subtasks', 'project', projectId] as const,
}

export function useSubtasks(taskId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: subtaskKeys.list(taskId),
    queryFn: async () => {
      const result = await getSubtasks(supabase, taskId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useProjectSubtasks(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: subtaskKeys.byProject(projectId),
    queryFn: async () => {
      const result = await getProjectSubtasks(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useCreateSubtask(taskId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: InsertTables<'subtasks'>) => {
      const result = await createSubtask(supabase, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subtaskKeys.list(taskId) })
    },
    onError: () => {
      toast.error('서브태스크 생성에 실패했습니다')
    },
  })
}

export function useUpdateSubtask(taskId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      subtaskId,
      input,
    }: {
      subtaskId: string
      input: UpdateTables<'subtasks'>
    }) => {
      const result = await updateSubtask(supabase, subtaskId, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async ({ subtaskId, input }) => {
      await queryClient.cancelQueries({ queryKey: subtaskKeys.list(taskId) })
      const previous = queryClient.getQueryData<Subtask[]>(subtaskKeys.list(taskId))

      if (previous) {
        queryClient.setQueryData<Subtask[]>(subtaskKeys.list(taskId), (old) =>
          old?.map((s) => (s.id === subtaskId ? { ...s, ...input } : s)),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(subtaskKeys.list(taskId), context.previous)
      }
      toast.error('서브태스크 수정에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: subtaskKeys.list(taskId) })
    },
  })
}

export function useDeleteSubtask(taskId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (subtaskId: string) => {
      const result = await deleteSubtask(supabase, subtaskId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async (subtaskId) => {
      await queryClient.cancelQueries({ queryKey: subtaskKeys.list(taskId) })
      const previous = queryClient.getQueryData<Subtask[]>(subtaskKeys.list(taskId))

      if (previous) {
        queryClient.setQueryData<Subtask[]>(subtaskKeys.list(taskId), (old) =>
          old?.filter((s) => s.id !== subtaskId),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(subtaskKeys.list(taskId), context.previous)
      }
      toast.error('서브태스크 삭제에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: subtaskKeys.list(taskId) })
    },
  })
}
