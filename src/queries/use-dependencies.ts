'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import { QUERY_CONFIG } from '@/lib/constants'
import { getDependencies, createDependency, deleteDependency, hasCyclicDependency } from '@/services/dependency-service'
import type { InsertTables } from '@/types/database'
import type { TaskDependency } from '@/types/dependency'

export const dependencyKeys = {
  list: (projectId: string) => ['dependencies', projectId] as const,
}

export function useDependencies(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: dependencyKeys.list(projectId),
    queryFn: async () => {
      const result = await getDependencies(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    refetchInterval: QUERY_CONFIG.REALTIME_POLL_INTERVAL,
  })
}

export function useCreateDependency(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: InsertTables<'task_dependencies'>) => {
      // 클라이언트 측 순환 감지
      const existing = queryClient.getQueryData<TaskDependency[]>(dependencyKeys.list(projectId))
      if (existing && hasCyclicDependency(existing, input.blocking_task_id, input.blocked_task_id)) {
        throw new Error('순환 연결이 감지되었습니다 (A→B→A 불가)')
      }

      const result = await createDependency(supabase, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dependencyKeys.list(projectId) })
      toast.success('작업 연결이 추가되었습니다')
    },
    onError: (error) => {
      toast.error(error.message || '작업 연결 추가에 실패했습니다')
    },
  })
}

export function useDeleteDependency(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dependencyId: string) => {
      const result = await deleteDependency(supabase, dependencyId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async (dependencyId) => {
      await queryClient.cancelQueries({ queryKey: dependencyKeys.list(projectId) })
      const previous = queryClient.getQueryData<TaskDependency[]>(dependencyKeys.list(projectId))

      if (previous) {
        queryClient.setQueryData<TaskDependency[]>(dependencyKeys.list(projectId), (old) =>
          old?.filter((d) => d.id !== dependencyId),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(dependencyKeys.list(projectId), context.previous)
      }
      toast.error('작업 연결 해제에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dependencyKeys.list(projectId) })
    },
  })
}
