'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  getTaskLabels,
  addTaskLabel,
  addTaskLabels,
  removeTaskLabel,
} from '@/services/label-service'
import type { InsertTables, UpdateTables, Tables } from '@/types/database'

type Label = Tables<'labels'>
type TaskLabel = Tables<'task_labels'>

export const labelKeys = {
  list: (projectId: string) => ['labels', projectId] as const,
  taskLabels: (projectId: string) => ['task-labels', projectId] as const,
}

export function useLabels(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: labelKeys.list(projectId),
    queryFn: async () => {
      const result = await getLabels(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useCreateLabel(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: InsertTables<'labels'>) => {
      const result = await createLabel(supabase, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.list(projectId) })
      toast.success('라벨이 생성되었습니다')
    },
    onError: () => {
      toast.error('라벨 생성에 실패했습니다')
    },
  })
}

export function useUpdateLabel(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ labelId, input }: { labelId: string; input: UpdateTables<'labels'> }) => {
      const result = await updateLabel(supabase, labelId, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async ({ labelId, input }) => {
      await queryClient.cancelQueries({ queryKey: labelKeys.list(projectId) })
      const previous = queryClient.getQueryData<Label[]>(labelKeys.list(projectId))

      if (previous) {
        queryClient.setQueryData<Label[]>(labelKeys.list(projectId), (old) =>
          old?.map((l) => (l.id === labelId ? { ...l, ...input } : l)),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(labelKeys.list(projectId), context.previous)
      }
      toast.error('라벨 수정에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.list(projectId) })
    },
  })
}

export function useDeleteLabel(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (labelId: string) => {
      const result = await deleteLabel(supabase, labelId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async (labelId) => {
      await queryClient.cancelQueries({ queryKey: labelKeys.list(projectId) })
      const previous = queryClient.getQueryData<Label[]>(labelKeys.list(projectId))

      if (previous) {
        queryClient.setQueryData<Label[]>(labelKeys.list(projectId), (old) =>
          old?.filter((l) => l.id !== labelId),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(labelKeys.list(projectId), context.previous)
      }
      toast.error('라벨 삭제에 실패했습니다')
    },
    onSuccess: () => {
      toast.success('라벨이 삭제되었습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.list(projectId) })
      queryClient.invalidateQueries({ queryKey: labelKeys.taskLabels(projectId) })
    },
  })
}

export function useTaskLabels(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: labelKeys.taskLabels(projectId),
    queryFn: async () => {
      const result = await getTaskLabels(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useAddTaskLabel(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, labelId }: { taskId: string; labelId: string }) => {
      const result = await addTaskLabel(supabase, taskId, labelId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async ({ taskId, labelId }) => {
      await queryClient.cancelQueries({ queryKey: labelKeys.taskLabels(projectId) })
      const previous = queryClient.getQueryData<TaskLabel[]>(labelKeys.taskLabels(projectId))

      if (previous) {
        queryClient.setQueryData<TaskLabel[]>(labelKeys.taskLabels(projectId), (old) => [
          ...(old ?? []),
          { task_id: taskId, label_id: labelId },
        ])
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(labelKeys.taskLabels(projectId), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.taskLabels(projectId) })
    },
  })
}

export function useAddTaskLabels(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, labelIds }: { taskId: string; labelIds: string[] }) => {
      const result = await addTaskLabels(supabase, taskId, labelIds)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.taskLabels(projectId) })
    },
  })
}

export function useRemoveTaskLabel(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, labelId }: { taskId: string; labelId: string }) => {
      const result = await removeTaskLabel(supabase, taskId, labelId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async ({ taskId, labelId }) => {
      await queryClient.cancelQueries({ queryKey: labelKeys.taskLabels(projectId) })
      const previous = queryClient.getQueryData<TaskLabel[]>(labelKeys.taskLabels(projectId))

      if (previous) {
        queryClient.setQueryData<TaskLabel[]>(labelKeys.taskLabels(projectId), (old) =>
          old?.filter((tl) => !(tl.task_id === taskId && tl.label_id === labelId)),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(labelKeys.taskLabels(projectId), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.taskLabels(projectId) })
    },
  })
}
