'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getTimeEntriesByTask,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getTaskTimeSummary,
  getWeeklyTimeReport,
} from '@/services/time-entry-service'
import { taskKeys } from '@/queries/use-tasks'
import type { CreateTimeEntryInput, UpdateTimeEntryInput } from '@/types/time-tracking'

export const timeEntryKeys = {
  byTask: (taskId: string) => ['time-entries', 'task', taskId] as const,
  byProject: (projectId: string) => ['time-entries', 'project', projectId] as const,
  taskSummary: (taskId: string) => ['time-entries', 'summary', taskId] as const,
  weeklyReport: (projectId: string, weekStart: string) =>
    ['time-entries', 'weekly', projectId, weekStart] as const,
}

export function useTimeEntriesByTask(taskId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: timeEntryKeys.byTask(taskId),
    queryFn: async () => {
      const result = await getTimeEntriesByTask(supabase, taskId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!taskId,
  })
}

export function useCreateTimeEntry(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTimeEntryInput & { user_id: string }) => {
      const result = await createTimeEntry(supabase, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.byTask(vars.task_id) })
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.byProject(projectId) })
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.taskSummary(vars.task_id) })
      queryClient.invalidateQueries({ queryKey: ['time-entries', 'weekly', projectId] })
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
      toast.success('시간이 기록되었습니다')
    },
    onError: () => {
      toast.error('시간 기록에 실패했습니다')
    },
  })
}

export function useUpdateTimeEntry(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ entryId, input }: { entryId: string; input: UpdateTimeEntryInput }) => {
      const result = await updateTimeEntry(supabase, entryId, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: timeEntryKeys.byTask(data.task_id) })
        queryClient.invalidateQueries({ queryKey: timeEntryKeys.taskSummary(data.task_id) })
      }
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.byProject(projectId) })
      queryClient.invalidateQueries({ queryKey: ['time-entries', 'weekly', projectId] })
      toast.success('시간 기록이 수정되었습니다')
    },
    onError: () => {
      toast.error('시간 기록 수정에 실패했습니다')
    },
  })
}

export function useDeleteTimeEntry(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ entryId, taskId }: { entryId: string; taskId: string }) => {
      const result = await deleteTimeEntry(supabase, entryId)
      if (result.error) throw new Error(result.error.message)
      return { taskId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.byTask(data.taskId) })
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.taskSummary(data.taskId) })
      queryClient.invalidateQueries({ queryKey: timeEntryKeys.byProject(projectId) })
      queryClient.invalidateQueries({ queryKey: ['time-entries', 'weekly', projectId] })
      toast.success('시간 기록이 삭제되었습니다')
    },
    onError: () => {
      toast.error('시간 기록 삭제에 실패했습니다')
    },
  })
}

export function useTaskTimeSummary(taskId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: timeEntryKeys.taskSummary(taskId),
    queryFn: async () => {
      const result = await getTaskTimeSummary(supabase, taskId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!taskId,
  })
}

export function useWeeklyTimeReport(projectId: string, weekStartDate: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: timeEntryKeys.weeklyReport(projectId, weekStartDate),
    queryFn: async () => {
      const result = await getWeeklyTimeReport(supabase, projectId, weekStartDate)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!projectId && !!weekStartDate,
  })
}
