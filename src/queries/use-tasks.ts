'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksByProject, createTask, updateTask, deleteTask, moveTask } from '@/services/task-service'
import type { InsertTables, UpdateTables } from '@/types/database'
import type { MoveTaskPayload } from '@/types/kanban'

const TASKS_KEY = (projectId: string) => ['tasks', projectId] as const

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: TASKS_KEY(projectId),
    queryFn: async () => {
      const result = await getTasksByProject(projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: InsertTables<'tasks'>) => createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY(projectId) })
    },
  })
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTables<'tasks'> }) =>
      updateTask(taskId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY(projectId) })
    },
  })
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY(projectId) })
    },
  })
}

export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: MoveTaskPayload) => moveTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY(projectId) })
    },
  })
}
