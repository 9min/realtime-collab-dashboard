'use client'

import { useCallback } from 'react'
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ServiceResult } from '@/types/common'

interface OptimisticMutationOptions<TData, TVariables> {
  /** 서버에 실행할 mutation 함수 */
  mutationFn: (variables: TVariables) => Promise<ServiceResult<TData>>
  /** 무효화할 쿼리 키 목록 */
  invalidateKeys: QueryKey[]
  /** Optimistic Update 적용 함수: (캐시, 변수) => 이전 캐시 */
  onOptimisticUpdate?: (variables: TVariables) => void
  /** 성공 시 메시지 */
  successMessage?: string
  /** 실패 시 메시지 */
  errorMessage?: string
}

/**
 * Optimistic Update 공통 훅
 *
 * Pattern B (ARCHITECTURE.md):
 *   User Action → Optimistic UI → TanStack Query Mutation
 *     → Success: Cache invalidate
 *     → Failure: 롤백 + Error Toast
 */
export function useOptimisticMutation<TData, TVariables>({
  mutationFn,
  invalidateKeys,
  onOptimisticUpdate,
  successMessage,
  errorMessage = '작업 중 오류가 발생했습니다',
}: OptimisticMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient()

  // 롤백용 스냅샷 저장/복원
  const saveSnapshots = useCallback(() => {
    const snapshots = new Map<string, unknown>()
    for (const key of invalidateKeys) {
      snapshots.set(JSON.stringify(key), queryClient.getQueryData(key))
    }
    return snapshots
  }, [queryClient, invalidateKeys])

  const restoreSnapshots = useCallback(
    (snapshots: Map<string, unknown>) => {
      for (const key of invalidateKeys) {
        const prev = snapshots.get(JSON.stringify(key))
        if (prev !== undefined) {
          queryClient.setQueryData(key, prev)
        }
      }
    },
    [queryClient, invalidateKeys],
  )

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const result = await mutationFn(variables)
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },

    onMutate: async (variables) => {
      // 진행 중인 refetch 취소 (optimistic data가 덮어쓰이는 것 방지)
      for (const key of invalidateKeys) {
        await queryClient.cancelQueries({ queryKey: key })
      }

      // 이전 상태 스냅샷
      const previousSnapshots = saveSnapshots()

      // Optimistic UI 업데이트
      onOptimisticUpdate?.(variables)

      return { previousSnapshots }
    },

    onError: (_error, _variables, context) => {
      // 실패 시 이전 상태로 롤백
      if (context?.previousSnapshots) {
        restoreSnapshots(context.previousSnapshots)
      }
      toast.error(errorMessage)
    },

    onSuccess: () => {
      if (successMessage) {
        toast.success(successMessage)
      }
    },

    onSettled: () => {
      // 성공/실패 여부와 관계없이 서버 데이터로 동기화
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}
