'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import { CHANNEL_PREFIX } from '@/lib/constants'
import { chartKeys } from '@/queries/use-chart-data'
import { columnKeys } from '@/queries/use-columns'
import { taskKeys } from '@/queries/use-tasks'
import { useAuth } from '@/hooks/use-auth'

/**
 * 프로젝트별 Realtime 구독 훅
 *
 * Supabase Realtime Postgres Changes를 구독하여
 * tasks, kanban_columns 테이블 변경 시 TanStack Query 캐시를 무효화한다.
 *
 * - 구독 범위: 특정 project_id의 tasks + kanban_columns + project_members
 * - 충돌 해결: Last-Write-Wins (서버 상태를 캐시에 반영) + Toast 알림
 * - 생명주기: 마운트 시 구독 → 언마운트 시 해제
 */
export function useRealtimeSubscription(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!projectId) return

    const channelName = `${CHANNEL_PREFIX}:${projectId}`

    const channel = supabase
      .channel(channelName)
      // tasks 테이블 변경 감지
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          // LWW: 서버 변경 수신 시 캐시 무효화 → refetch
          queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
          // 차트 데이터도 함께 갱신
          queryClient.invalidateQueries({ queryKey: chartKeys.taskStatus(projectId) })
          queryClient.invalidateQueries({ queryKey: chartKeys.weeklyProgress(projectId) })
          queryClient.invalidateQueries({ queryKey: chartKeys.burndown(projectId) })

          // 다른 사용자의 변경인 경우 Toast로 알림 (LWW 충돌 인지)
          const record = payload.new as Record<string, unknown> | undefined
          if (record && record['created_by'] !== user?.id) {
            const eventLabel = payload.eventType === 'INSERT' ? '추가' : payload.eventType === 'UPDATE' ? '수정' : '삭제'
            toast.info(`다른 사용자가 태스크를 ${eventLabel}했습니다`, {
              duration: 3000,
            })
          }
        },
      )
      // kanban_columns 테이블 변경 감지
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kanban_columns',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: columnKeys.list(projectId) })
        },
      )
      // project_members 변경 감지 (멤버 추가/제거)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, projectId, queryClient, user?.id])
}
