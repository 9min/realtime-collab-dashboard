'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getTaskTemplates,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  createTaskFromTemplate,
} from '@/services/task-template-service'
import { taskKeys } from '@/queries/use-tasks'
import { QUERY_CONFIG } from '@/lib/constants'
import type {
  CreateTaskTemplateInput,
  UpdateTaskTemplateInput,
  TaskTemplate,
} from '@/types/task-template'

export const templateKeys = {
  list: (projectId: string) => ['task-templates', projectId] as const,
}

export function useTaskTemplates(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: templateKeys.list(projectId),
    queryFn: async () => {
      const result = await getTaskTemplates(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    refetchInterval: QUERY_CONFIG.REALTIME_POLL_INTERVAL,
  })
}

export function useCreateTaskTemplate(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTaskTemplateInput & { created_by: string }) => {
      const result = await createTaskTemplate(supabase, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list(projectId) })
      toast.success('템플릿이 생성되었습니다')
    },
    onError: () => {
      toast.error('템플릿 생성에 실패했습니다')
    },
  })
}

export function useUpdateTaskTemplate(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      templateId,
      input,
    }: {
      templateId: string
      input: UpdateTaskTemplateInput
    }) => {
      const result = await updateTaskTemplate(supabase, templateId, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async ({ templateId, input }) => {
      await queryClient.cancelQueries({ queryKey: templateKeys.list(projectId) })
      const previous = queryClient.getQueryData<TaskTemplate[]>(templateKeys.list(projectId))

      if (previous) {
        queryClient.setQueryData<TaskTemplate[]>(templateKeys.list(projectId), (old) =>
          old?.map((t) => (t.id === templateId ? { ...t, ...input } : t)),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(templateKeys.list(projectId), context.previous)
      }
      toast.error('템플릿 수정에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list(projectId) })
    },
  })
}

export function useDeleteTaskTemplate(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateId: string) => {
      const result = await deleteTaskTemplate(supabase, templateId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async (templateId) => {
      await queryClient.cancelQueries({ queryKey: templateKeys.list(projectId) })
      const previous = queryClient.getQueryData<TaskTemplate[]>(templateKeys.list(projectId))

      if (previous) {
        queryClient.setQueryData<TaskTemplate[]>(templateKeys.list(projectId), (old) =>
          old?.filter((t) => t.id !== templateId),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(templateKeys.list(projectId), context.previous)
      }
      toast.error('템플릿 삭제에 실패했습니다')
    },
    onSuccess: () => {
      toast.success('템플릿이 삭제되었습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.list(projectId) })
    },
  })
}

export function useCreateTaskFromTemplate(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      templateId,
      columnId,
      userId,
    }: {
      templateId: string
      columnId: string
      userId: string
    }) => {
      const result = await createTaskFromTemplate(supabase, templateId, columnId, userId, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
      queryClient.invalidateQueries({ queryKey: templateKeys.list(projectId) })
      toast.success('템플릿에서 태스크가 생성되었습니다')
    },
    onError: () => {
      toast.error('템플릿에서 태스크 생성에 실패했습니다')
    },
  })
}
