'use client'

import { useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

import { useSupabase } from '@/components/providers/supabase-provider'
import { CHANNEL_PREFIX } from '@/lib/constants'
import { useAuth } from '@/hooks/use-auth'

// Presence로 공유할 유저 정보
export interface PresenceUser {
  user_id: string
  full_name: string | null
  avatar_url: string | null
  online_at: string
}

/**
 * 프로젝트별 Presence 훅
 *
 * Supabase Realtime Presence를 사용하여
 * 현재 프로젝트에 접속 중인 유저 목록을 관리한다.
 *
 * - 마운트 시 channel에 presence track
 * - sync 이벤트로 전체 상태 갱신
 * - 언마운트 시 untrack + channel 해제
 */
export function usePresence(projectId: string) {
  const supabase = useSupabase()
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    if (!projectId || !user) return

    const channelName = `${CHANNEL_PREFIX}-presence:${projectId}`
    let channel: RealtimeChannel | null = null

    channel = supabase.channel(channelName)

    // presence sync 이벤트: 전체 상태가 동기화될 때
    channel.on('presence', { event: 'sync' }, () => {
      if (!channel) return
      const state = channel.presenceState<PresenceUser>()
      const users: PresenceUser[] = []
      const seen = new Set<string>()

      // presenceState는 { [key]: PresenceUser[] } 형태
      for (const presences of Object.values(state)) {
        for (const presence of presences) {
          if (!seen.has(presence.user_id)) {
            seen.add(presence.user_id)
            users.push(presence)
          }
        }
      }

      setOnlineUsers(users)
    })

    // 구독 후 자신의 presence 등록
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && channel) {
        await channel.track({
          user_id: user.id,
          full_name: user.user_metadata?.full_name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          online_at: new Date().toISOString(),
        })
      }
    })

    return () => {
      if (channel) {
        channel.untrack()
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, projectId, user])

  return { onlineUsers }
}
