'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/services/notification-service'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => ['notifications', 'list', userId] as const,
  unreadCount: (userId: string) => ['notifications', 'unread', userId] as const,
}

export function useNotifications(userId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: notificationKeys.list(userId),
    queryFn: async () => {
      const result = await getNotifications(supabase, userId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!userId,
  })
}

export function useUnreadCount(userId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: notificationKeys.unreadCount(userId),
    queryFn: async () => {
      const result = await getUnreadCount(supabase, userId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!userId,
    refetchInterval: 1000 * 60, // 1분마다 폴링
  })
}

export function useMarkAsRead(userId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const result = await markAsRead(supabase, notificationId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) })
    },
    onError: () => {
      toast.error('알림 읽음 처리에 실패했습니다')
    },
  })
}

export function useMarkAllAsRead(userId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const result = await markAllAsRead(supabase, userId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) })
    },
    onError: () => {
      toast.error('알림 모두 읽음 처리에 실패했습니다')
    },
  })
}
