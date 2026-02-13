'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getTaskAssignees,
  getProjectTaskAssignees,
  addTaskAssignee,
  removeTaskAssignee,
  updateTaskAssigneeRole,
} from '@/services/task-assignee-service'
import type { TaskAssigneeRole } from '@/types/task-assignee'

export const taskAssigneeKeys = {
  list: (taskId: string) => ['task-assignees', taskId] as const,
  project: (projectId: string) => ['task-assignees', 'project', projectId] as const,
}

export function useTaskAssignees(taskId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: taskAssigneeKeys.list(taskId),
    queryFn: async () => {
      const result = await getTaskAssignees(supabase, taskId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!taskId,
  })
}

export function useProjectTaskAssignees(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: taskAssigneeKeys.project(projectId),
    queryFn: async () => {
      const result = await getProjectTaskAssignees(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!projectId,
  })
}

export function useAddTaskAssignee(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      userId,
      role,
    }: {
      taskId: string
      userId: string
      role?: TaskAssigneeRole
    }) => {
      const result = await addTaskAssignee(supabase, taskId, userId, role)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: taskAssigneeKeys.list(vars.taskId) })
      queryClient.invalidateQueries({ queryKey: taskAssigneeKeys.project(projectId) })
      const roleLabel = vars.role === 'watcher' ? '워처' : '담당자'
      toast.success(`${roleLabel}가 추가되었습니다`)
    },
    onError: () => {
      toast.error('담당자 추가에 실패했습니다')
    },
  })
}

export function useRemoveTaskAssignee(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const result = await removeTaskAssignee(supabase, taskId, userId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: taskAssigneeKeys.list(vars.taskId) })
      queryClient.invalidateQueries({ queryKey: taskAssigneeKeys.project(projectId) })
      toast.success('담당자가 제거되었습니다')
    },
    onError: () => {
      toast.error('담당자 제거에 실패했습니다')
    },
  })
}

export function useUpdateTaskAssigneeRole(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      userId,
      role,
    }: {
      taskId: string
      userId: string
      role: TaskAssigneeRole
    }) => {
      const result = await updateTaskAssigneeRole(supabase, taskId, userId, role)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: taskAssigneeKeys.list(vars.taskId) })
      queryClient.invalidateQueries({ queryKey: taskAssigneeKeys.project(projectId) })
      toast.success('역할이 변경되었습니다')
    },
    onError: () => {
      toast.error('역할 변경에 실패했습니다')
    },
  })
}
