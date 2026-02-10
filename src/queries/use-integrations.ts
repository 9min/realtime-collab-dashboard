'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import { getProjectIntegrations, upsertIntegration, deleteIntegration, toggleIntegration } from '@/services/integration-service'
import type { IntegrationType, SlackConfig, GitHubConfig } from '@/types/integration'

export const integrationKeys = {
  list: (projectId: string) => ['integrations', projectId] as const,
}

export function useIntegrations(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: integrationKeys.list(projectId),
    queryFn: async () => {
      const result = await getProjectIntegrations(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useUpsertIntegration(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ type, config }: { type: IntegrationType; config: SlackConfig | GitHubConfig }) => {
      const result = await upsertIntegration(supabase, projectId, type, config)
      if (result.error) throw new Error(result.error.message)
      return result.data
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
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const result = await deleteIntegration(supabase, integrationId)
      if (result.error) throw new Error(result.error.message)
      return result.data
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
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ integrationId, isActive }: { integrationId: string; isActive: boolean }) => {
      const result = await toggleIntegration(supabase, integrationId, isActive)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.list(projectId) })
    },
  })
}
