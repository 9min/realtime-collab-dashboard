'use client'

import { useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

import { useSupabase } from '@/components/providers/supabase-provider'
import { CHANNEL_PREFIX } from '@/lib/constants'
import { useAuth } from '@/hooks/use-auth'
import { useProfile } from '@/queries/use-profile'

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
  const { data: profile } = useProfile()
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])

  // profile을 ref로 관리하여 채널 재생성 방지
  const profileRef = useRef(profile)
  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  // 채널 참조를 별도 effect에서 접근하기 위한 ref
  const channelRef = useRef<RealtimeChannel | null>(null)

  // 메인 effect: 채널 생성/구독 (profile 의존성 제거)
  useEffect(() => {
    if (!projectId || !user?.id) return

    const channelName = `${CHANNEL_PREFIX}-presence:${projectId}`
    const channel = supabase.channel(channelName)
    channelRef.current = channel

    // presence sync 이벤트: 전체 상태가 동기화될 때
    channel.on('presence', { event: 'sync' }, () => {
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
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          full_name: profileRef.current?.full_name ?? user.user_metadata?.full_name ?? null,
          avatar_url: profileRef.current?.avatar_url ?? null,
          online_at: new Date().toISOString(),
        })
      }
    })

    return () => {
      channelRef.current = null
      channel.untrack()
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- user_metadata는 fallback 용도이며 채널 재생성을 유발하면 안 됨
  }, [supabase, projectId, user?.id])

  // 프로필 변경 시 채널 재생성 없이 presence 정보만 업데이트
  useEffect(() => {
    if (!profile || !user?.id || !channelRef.current) return

    channelRef.current.track({
      user_id: user.id,
      full_name: profile.full_name ?? user.user_metadata?.full_name ?? null,
      avatar_url: profile.avatar_url ?? null,
      online_at: new Date().toISOString(),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- user_metadata는 fallback 용도이며 불필요한 re-track 방지
  }, [profile, user?.id])

  return { onlineUsers }
}
