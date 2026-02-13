'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getSprints,
  createSprint,
  updateSprint,
  deleteSprint,
  startSprint,
  completeSprint,
  reopenSprint,
  getVelocityData,
} from '@/services/sprint-service'
import { taskKeys } from '@/queries/use-tasks'
import type { CreateSprintInput, UpdateSprintInput } from '@/types/sprint'

export const sprintKeys = {
  all: (projectId: string) => ['sprints', projectId] as const,
  velocity: (projectId: string) => ['sprints', projectId, 'velocity'] as const,
}

export function useSprints(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: sprintKeys.all(projectId),
    queryFn: async () => {
      const result = await getSprints(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useCreateSprint(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSprintInput & { created_by: string }) => {
      const result = await createSprint(supabase, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.all(projectId) })
      toast.success('스프린트가 생성되었습니다')
    },
    onError: () => {
      toast.error('스프린트 생성에 실패했습니다')
    },
  })
}

export function useUpdateSprint(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sprintId, input }: { sprintId: string; input: UpdateSprintInput }) => {
      const result = await updateSprint(supabase, sprintId, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.all(projectId) })
      toast.success('스프린트가 수정되었습니다')
    },
    onError: () => {
      toast.error('스프린트 수정에 실패했습니다')
    },
  })
}

export function useDeleteSprint(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sprintId: string) => {
      const result = await deleteSprint(supabase, sprintId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.all(projectId) })
      toast.success('스프린트가 삭제되었습니다')
    },
    onError: () => {
      toast.error('스프린트 삭제에 실패했습니다')
    },
  })
}

export function useStartSprint(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sprintId: string) => {
      const result = await startSprint(supabase, sprintId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.all(projectId) })
      toast.success('스프린트가 시작되었습니다')
    },
    onError: () => {
      toast.error('스프린트 시작에 실패했습니다')
    },
  })
}

export function useCompleteSprint(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sprintId,
      moveUnfinishedTo,
    }: {
      sprintId: string
      moveUnfinishedTo: 'backlog' | string
    }) => {
      const result = await completeSprint(supabase, sprintId, moveUnfinishedTo)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.all(projectId) })
      queryClient.invalidateQueries({ queryKey: sprintKeys.velocity(projectId) })
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
      toast.success('스프린트가 완료되었습니다')
    },
    onError: () => {
      toast.error('스프린트 완료에 실패했습니다')
    },
  })
}

export function useReopenSprint(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sprintId: string) => {
      const result = await reopenSprint(supabase, sprintId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.all(projectId) })
      queryClient.invalidateQueries({ queryKey: sprintKeys.velocity(projectId) })
      toast.success('스프린트가 다시 열렸습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '스프린트 재오픈에 실패했습니다')
    },
  })
}

export function useVelocityData(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: sprintKeys.velocity(projectId),
    queryFn: async () => {
      const result = await getVelocityData(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}
