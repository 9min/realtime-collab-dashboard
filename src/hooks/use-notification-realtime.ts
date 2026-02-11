'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import { notificationKeys } from '@/queries/use-notifications'
import { useAuth } from '@/hooks/use-auth'

/**
 * 글로벌 알림 Realtime 구독 훅
 *
 * 프로젝트 컨텍스트와 무관하게 notifications 테이블 INSERT를 감지하여
 * 알림 목록/미읽음 카운트를 즉시 갱신한다.
 * Header에서 호출하여 모든 페이지에서 활성화된다.
 */
export function useNotificationRealtime() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userIdRef = useRef(user?.id)

  useEffect(() => {
    userIdRef.current = user?.id
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`global-notifications:${user.id}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const record = payload.new as Record<string, unknown> | undefined
          const currentUserId = userIdRef.current
          if (currentUserId && record && record['user_id'] === currentUserId) {
            queryClient.invalidateQueries({ queryKey: notificationKeys.list(currentUserId) })
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(currentUserId) })
            toast.info('새 알림이 도착했습니다', { duration: 3000 })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, queryClient, user?.id])
}
