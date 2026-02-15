'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { RealtimeChannel } from '@supabase/supabase-js'

import { useSupabase } from '@/components/providers/supabase-provider'
import { CHANNEL_PREFIX } from '@/lib/constants'
import { activityKeys } from '@/queries/use-activity-logs'
import { chartKeys } from '@/queries/use-chart-data'
import { automationKeys } from '@/queries/use-automations'
import { columnKeys } from '@/queries/use-columns'
import { commentKeys } from '@/queries/use-comments'
import { customFieldKeys } from '@/queries/use-custom-fields'
import { dependencyKeys } from '@/queries/use-dependencies'
import { labelKeys } from '@/queries/use-labels'
import { sprintKeys } from '@/queries/use-sprints'
import { subtaskKeys } from '@/queries/use-subtasks'
import { taskAssigneeKeys } from '@/queries/use-task-assignees'
import { taskKeys } from '@/queries/use-tasks'
import { timeEntryKeys } from '@/queries/use-time-entries'
import { useAuth } from '@/hooks/use-auth'
import { CONNECTION_STATUS, useRealtimeStore } from '@/stores/realtime-store'

const MAX_RETRY_COUNT = 8
const BASE_RETRY_DELAY = 1000 // 1초

function getRetryDelay(retryCount: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s (cap)
  const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, retryCount), 60_000)
  // jitter ±25%
  return delay * (0.75 + Math.random() * 0.5)
}

/**
 * 프로젝트별 Realtime 구독 훅
 *
 * Supabase Realtime Postgres Changes를 구독하여
 * tasks, kanban_columns 테이블 변경 시 TanStack Query 캐시를 무효화한다.
 */
export function useRealtimeSubscription(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { setStatus, setConnected, incrementRetry, resetRetry } = useRealtimeStore()

  const userIdRef = useRef(user?.id)
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    userIdRef.current = user?.id
  }, [user?.id])

  useEffect(() => {
    if (!projectId || !user?.id) return

    setStatus(CONNECTION_STATUS.CONNECTING)

    // 고유 채널 이름 (동일 project의 복수 탭/페이지 충돌 방지)
    const channelName = `${CHANNEL_PREFIX}:${projectId}:${Date.now()}`
    let channel: RealtimeChannel | null = null
    let cancelled = false
    let authUnsubscribe: (() => void) | null = null

    async function setupChannel() {
      // 1. getUser()로 서버 검증된 세션 확보 (getSession은 로컬 캐시만 읽음)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return

      if (!session?.access_token) {
        // 세션이 없으면 구독 불가
        return
      }

      // 2. Realtime WebSocket에 토큰 설정
      supabase.realtime.setAuth(session.access_token)

      // 3. 토큰 갱신 시 Realtime 재인증
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (event === 'TOKEN_REFRESHED' && newSession?.access_token) {
          supabase.realtime.setAuth(newSession.access_token)
        }
      })
      authUnsubscribe = () => subscription.unsubscribe()

      // 4. 채널 구독
      const ch = supabase
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
            queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) })
            queryClient.invalidateQueries({
              predicate: (query) => chartKeys.isProjectChart(query.queryKey, projectId),
            })
            queryClient.invalidateQueries({ queryKey: activityKeys.list(projectId) })

            const record = payload.new as Record<string, unknown> | undefined
            if (record && record['created_by'] !== userIdRef.current) {
              const eventLabel =
                payload.eventType === 'INSERT'
                  ? '추가'
                  : payload.eventType === 'UPDATE'
                    ? '수정'
                    : '삭제'
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
            queryClient.invalidateQueries({ queryKey: activityKeys.list(projectId) })
          },
        )
        // projects 테이블 삭제 감지 (프로젝트 삭제 시 다른 멤버에게 알림)
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'projects',
            filter: `id=eq.${projectId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
            queryClient.invalidateQueries({ queryKey: ['projects'] })
          },
        )
        // project_members 변경 감지
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
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
            queryClient.invalidateQueries({ queryKey: activityKeys.list(projectId) })
          },
        )
        // activity_logs 변경 감지
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_logs',
            filter: `project_id=eq.${projectId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: activityKeys.list(projectId) })
          },
        )
        // labels 변경 감지
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'labels',
            filter: `project_id=eq.${projectId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: labelKeys.list(projectId) })
          },
        )
        // task_labels 변경 감지
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'task_labels',
          },
          () => {
            queryClient.invalidateQueries({ queryKey: labelKeys.taskLabels(projectId) })
          },
        )
        // subtasks 변경 감지
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subtasks',
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            const record = (payload.new ?? payload.old) as Record<string, unknown> | undefined
            if (record && typeof record['task_id'] === 'string') {
              queryClient.invalidateQueries({
                queryKey: subtaskKeys.list(record['task_id'] as string),
              })
            }
            queryClient.invalidateQueries({ queryKey: activityKeys.list(projectId) })
          },
        )
        // task_comments 변경 감지
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'task_comments',
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            const record = (payload.new ?? payload.old) as Record<string, unknown> | undefined
            if (record && typeof record['task_id'] === 'string') {
              queryClient.invalidateQueries({
                queryKey: commentKeys.list(record['task_id'] as string),
              })
            }
            queryClient.invalidateQueries({ queryKey: activityKeys.list(projectId) })
          },
        )
        // notifications: 글로벌 구독(useNotificationRealtime)으로 이전됨
        // task_attachments 변경 감지
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'task_attachments',
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            const record = (payload.new ?? payload.old) as Record<string, unknown> | undefined
            if (record && typeof record['task_id'] === 'string') {
              queryClient.invalidateQueries({
                queryKey: ['attachments', record['task_id'] as string],
              })
            }
          },
        )
        // task_dependencies 변경 감지
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'task_dependencies',
            filter: `project_id=eq.${projectId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: dependencyKeys.list(projectId) })
          },
        )
        // task_assignees 변경 감지
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'task_assignees',
          },
          (payload) => {
            const record = (payload.new ?? payload.old) as Record<string, unknown> | undefined
            if (record && typeof record['task_id'] === 'string') {
              queryClient.invalidateQueries({
                queryKey: taskAssigneeKeys.list(record['task_id'] as string),
              })
            }
            queryClient.invalidateQueries({ queryKey: taskAssigneeKeys.project(projectId) })
          },
        )
        // time_entries 변경 감지
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'time_entries',
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            const record = (payload.new ?? payload.old) as Record<string, unknown> | undefined
            if (record && typeof record['task_id'] === 'string') {
              queryClient.invalidateQueries({
                queryKey: timeEntryKeys.byTask(record['task_id'] as string),
              })
              queryClient.invalidateQueries({
                queryKey: timeEntryKeys.taskSummary(record['task_id'] as string),
              })
            }
            queryClient.invalidateQueries({ queryKey: timeEntryKeys.byProject(projectId) })
          },
        )
        // custom_field_definitions 변경 감지
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'custom_field_definitions',
            filter: `project_id=eq.${projectId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: customFieldKeys.definitions(projectId) })
          },
        )
        // task_custom_field_values 변경 감지
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'task_custom_field_values',
          },
          () => {
            queryClient.invalidateQueries({ queryKey: customFieldKeys.values(projectId) })
          },
        )
        // sprints 변경 감지
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sprints',
            filter: `project_id=eq.${projectId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: sprintKeys.all(projectId) })
            queryClient.invalidateQueries({ queryKey: sprintKeys.velocity(projectId) })
          },
        )
        // automation_rules 변경 감지
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'automation_rules',
            filter: `project_id=eq.${projectId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: automationKeys.rules(projectId) })
          },
        )
        .subscribe((status, _err) => {
          if (cancelled) return

          if (status === 'SUBSCRIBED') {
            retryCountRef.current = 0
            resetRetry()
            setConnected()
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setStatus(CONNECTION_STATUS.RECONNECTING)

            if (retryCountRef.current < MAX_RETRY_COUNT) {
              const delay = getRetryDelay(retryCountRef.current)
              retryCountRef.current += 1
              incrementRetry()

              retryTimerRef.current = setTimeout(() => {
                if (!cancelled) {
                  ch.subscribe()
                }
              }, delay)
            } else {
              setStatus(CONNECTION_STATUS.DISCONNECTED)
              toast.error('실시간 연결이 끊어졌습니다. 페이지를 새로고침해주세요.', {
                duration: 0,
                id: 'realtime-disconnected',
              })
            }
          } else if (status === 'CLOSED') {
            if (!cancelled) {
              setStatus(CONNECTION_STATUS.DISCONNECTED)
            }
          }
        })

      if (cancelled) {
        supabase.removeChannel(ch)
        return
      }

      channel = ch
    }

    setupChannel()

    return () => {
      cancelled = true
      authUnsubscribe?.()
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
      }
      if (channel) {
        supabase.removeChannel(channel)
      }
      setStatus(CONNECTION_STATUS.DISCONNECTED)
    }
  }, [
    supabase,
    projectId,
    queryClient,
    user?.id,
    setStatus,
    setConnected,
    incrementRetry,
    resetRetry,
  ])
}
