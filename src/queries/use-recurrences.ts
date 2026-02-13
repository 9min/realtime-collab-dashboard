'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getRecurrence,
  getProjectRecurrenceTaskIds,
  createRecurrence,
  updateRecurrence,
  deleteRecurrence,
} from '@/services/recurrence-service'
import { QUERY_CONFIG } from '@/lib/constants'
import type { CreateRecurrenceInput, UpdateRecurrenceInput } from '@/types/recurrence'

export const recurrenceKeys = {
  detail: (taskId: string) => ['recurrence', taskId] as const,
  project: (projectId: string) => ['recurrence-tasks', projectId] as const,
}

export function useRecurrence(taskId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: recurrenceKeys.detail(taskId ?? ''),
    queryFn: async () => {
      if (!taskId) return null
      const result = await getRecurrence(supabase, taskId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!taskId,
    staleTime: QUERY_CONFIG.STALE_TIME,
  })
}

export function useProjectRecurrences(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: recurrenceKeys.project(projectId),
    queryFn: async () => {
      const result = await getProjectRecurrenceTaskIds(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return new Set(result.data)
    },
    staleTime: QUERY_CONFIG.STALE_TIME,
  })
}

export function useCreateRecurrence() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRecurrenceInput) => {
      const result = await createRecurrence(supabase, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.detail(data.task_id) })
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.project(data.project_id) })
      toast.success('반복 설정이 추가되었습니다')
    },
    onError: () => {
      toast.error('반복 설정 추가에 실패했습니다')
    },
  })
}

export function useUpdateRecurrence(taskId: string, projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      recurrenceId,
      input,
    }: {
      recurrenceId: string
      input: UpdateRecurrenceInput
    }) => {
      const result = await updateRecurrence(supabase, recurrenceId, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.project(projectId) })
      toast.success('반복 설정이 수정되었습니다')
    },
    onError: () => {
      toast.error('반복 설정 수정에 실패했습니다')
    },
  })
}

export function useDeleteRecurrence(taskId: string, projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recurrenceId: string) => {
      const result = await deleteRecurrence(supabase, recurrenceId)
      if (result.error) throw new Error(result.error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.project(projectId) })
      toast.success('반복 설정이 삭제되었습니다')
    },
    onError: () => {
      toast.error('반복 설정 삭제에 실패했습니다')
    },
  })
}
