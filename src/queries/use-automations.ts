'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  toggleAutomationRule,
  getAutomationExecutions,
} from '@/services/automation-service'
import type {
  AutomationRule,
  CreateAutomationRuleInput,
  UpdateAutomationRuleInput,
} from '@/types/automation'

export const automationKeys = {
  rules: (projectId: string) => ['automation-rules', projectId] as const,
  executions: (ruleId: string) => ['automation-executions', ruleId] as const,
}

export function useAutomationRules(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: automationKeys.rules(projectId),
    queryFn: async () => {
      const result = await getAutomationRules(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useCreateAutomationRule(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAutomationRuleInput & { created_by: string }) => {
      const result = await createAutomationRule(supabase, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.rules(projectId) })
      toast.success('자동화 규칙이 생성되었습니다')
    },
    onError: () => {
      toast.error('자동화 규칙 생성에 실패했습니다')
    },
  })
}

export function useUpdateAutomationRule(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ruleId, input }: { ruleId: string; input: UpdateAutomationRuleInput }) => {
      const result = await updateAutomationRule(supabase, ruleId, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async ({ ruleId, input }) => {
      await queryClient.cancelQueries({ queryKey: automationKeys.rules(projectId) })
      const previous = queryClient.getQueryData<AutomationRule[]>(automationKeys.rules(projectId))

      if (previous) {
        queryClient.setQueryData<AutomationRule[]>(automationKeys.rules(projectId), (old) =>
          old?.map((r) => (r.id === ruleId ? { ...r, ...input } : r)),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(automationKeys.rules(projectId), context.previous)
      }
      toast.error('자동화 규칙 수정에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.rules(projectId) })
    },
  })
}

export function useDeleteAutomationRule(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const result = await deleteAutomationRule(supabase, ruleId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async (ruleId) => {
      await queryClient.cancelQueries({ queryKey: automationKeys.rules(projectId) })
      const previous = queryClient.getQueryData<AutomationRule[]>(automationKeys.rules(projectId))

      if (previous) {
        queryClient.setQueryData<AutomationRule[]>(automationKeys.rules(projectId), (old) =>
          old?.filter((r) => r.id !== ruleId),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(automationKeys.rules(projectId), context.previous)
      }
      toast.error('자동화 규칙 삭제에 실패했습니다')
    },
    onSuccess: () => {
      toast.success('자동화 규칙이 삭제되었습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.rules(projectId) })
    },
  })
}

export function useToggleAutomationRule(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const result = await toggleAutomationRule(supabase, ruleId, isActive)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async ({ ruleId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: automationKeys.rules(projectId) })
      const previous = queryClient.getQueryData<AutomationRule[]>(automationKeys.rules(projectId))

      if (previous) {
        queryClient.setQueryData<AutomationRule[]>(automationKeys.rules(projectId), (old) =>
          old?.map((r) => (r.id === ruleId ? { ...r, is_active: isActive } : r)),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(automationKeys.rules(projectId), context.previous)
      }
      toast.error('자동화 규칙 상태 변경에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.rules(projectId) })
    },
  })
}

export function useAutomationExecutions(ruleId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: automationKeys.executions(ruleId),
    queryFn: async () => {
      const result = await getAutomationExecutions(supabase, ruleId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!ruleId,
  })
}
