'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ProjectIntegration, IntegrationType, SlackConfig, GitHubConfig } from '@/types/integration'

export const integrationKeys = {
  list: (projectId: string) => ['integrations', projectId] as const,
}

export function useIntegrations(projectId: string) {
  return useQuery({
    queryKey: integrationKeys.list(projectId),
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/integrations`)
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? '연동 목록 조회 실패')
      }
      return res.json() as Promise<ProjectIntegration[]>
    },
  })
}

export function useUpsertIntegration(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ type, config }: { type: IntegrationType; config: SlackConfig | GitHubConfig }) => {
      const res = await fetch(`/api/projects/${projectId}/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? '연동 설정 저장 실패')
      }
      return res.json() as Promise<ProjectIntegration>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.list(projectId) })
      toast.success('연동 설정이 저장되었습니다')
    },
    onError: () => {
      toast.error('연동 설정 저장에 실패했습니다')
    },
  })
}

export function useDeleteIntegration(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const res = await fetch(`/api/projects/${projectId}/integrations/${integrationId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? '연동 삭제 실패')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.list(projectId) })
      toast.success('연동이 삭제되었습니다')
    },
    onError: () => {
      toast.error('연동 삭제에 실패했습니다')
    },
  })
}

export function useToggleIntegration(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ integrationId, isActive }: { integrationId: string; isActive: boolean }) => {
      const res = await fetch(`/api/projects/${projectId}/integrations/${integrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? '연동 상태 변경 실패')
      }
      return res.json() as Promise<ProjectIntegration>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.list(projectId) })
    },
  })
}
