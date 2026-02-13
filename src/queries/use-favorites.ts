'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getMyFavoriteIds,
  addFavorite,
  removeFavorite,
  getFavoriteTasks,
} from '@/services/favorite-service'
import { QUERY_CONFIG } from '@/lib/constants'

export const favoriteKeys = {
  ids: (userId: string) => ['favorite-ids', userId] as const,
  tasks: (userId: string) => ['favorite-tasks', userId] as const,
}

export function useFavoriteIds(userId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: favoriteKeys.ids(userId ?? ''),
    queryFn: async () => {
      if (!userId) return new Set<string>()
      const result = await getMyFavoriteIds(supabase, userId)
      if (result.error) throw new Error(result.error.message)
      return new Set(result.data)
    },
    enabled: !!userId,
    staleTime: QUERY_CONFIG.STALE_TIME,
  })
}

export function useToggleFavorite(userId: string | undefined) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, isFavorite }: { taskId: string; isFavorite: boolean }) => {
      if (!userId) throw new Error('Not authenticated')
      if (isFavorite) {
        const result = await removeFavorite(supabase, userId, taskId)
        if (result.error) throw new Error(result.error.message)
      } else {
        const result = await addFavorite(supabase, userId, taskId)
        if (result.error) throw new Error(result.error.message)
      }
    },
    onMutate: async ({ taskId, isFavorite }) => {
      if (!userId) return
      await queryClient.cancelQueries({ queryKey: favoriteKeys.ids(userId) })
      const previous = queryClient.getQueryData<Set<string>>(favoriteKeys.ids(userId))

      if (previous) {
        const next = new Set(previous)
        if (isFavorite) {
          next.delete(taskId)
        } else {
          next.add(taskId)
        }
        queryClient.setQueryData(favoriteKeys.ids(userId), next)
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && userId) {
        queryClient.setQueryData(favoriteKeys.ids(userId), context.previous)
      }
      toast.error('즐겨찾기 변경에 실패했습니다')
    },
    onSettled: () => {
      if (!userId) return
      queryClient.invalidateQueries({ queryKey: favoriteKeys.ids(userId) })
      queryClient.invalidateQueries({ queryKey: favoriteKeys.tasks(userId) })
    },
  })
}

export function useFavoriteTasks(userId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: favoriteKeys.tasks(userId ?? ''),
    queryFn: async () => {
      if (!userId) return []
      const result = await getFavoriteTasks(supabase, userId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!userId,
    staleTime: QUERY_CONFIG.STALE_TIME,
  })
}
