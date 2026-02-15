'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import {
  getCustomFieldDefinitions,
  createCustomFieldDefinition,
  updateCustomFieldDefinition,
  deleteCustomFieldDefinition,
  getTaskCustomFieldValues,
  setTaskCustomFieldValue,
} from '@/services/custom-field-service'
import type {
  CustomFieldDefinition,
  TaskCustomFieldValue,
  CreateCustomFieldInput,
  UpdateCustomFieldInput,
} from '@/types/custom-field'

export const customFieldKeys = {
  definitions: (projectId: string) => ['custom-field-definitions', projectId] as const,
  values: (projectId: string) => ['custom-field-values', projectId] as const,
}

export function useCustomFieldDefinitions(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: customFieldKeys.definitions(projectId),
    queryFn: async () => {
      const result = await getCustomFieldDefinitions(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useCreateCustomField(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCustomFieldInput) => {
      const result = await createCustomFieldDefinition(supabase, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.definitions(projectId) })
      toast.success('커스텀 필드가 생성되었습니다')
    },
    onError: () => {
      toast.error('커스텀 필드 생성에 실패했습니다')
    },
  })
}

export function useUpdateCustomField(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fieldId, input }: { fieldId: string; input: UpdateCustomFieldInput }) => {
      const result = await updateCustomFieldDefinition(supabase, fieldId, input)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async ({ fieldId, input }) => {
      await queryClient.cancelQueries({ queryKey: customFieldKeys.definitions(projectId) })
      const previous = queryClient.getQueryData<CustomFieldDefinition[]>(
        customFieldKeys.definitions(projectId),
      )

      if (previous) {
        queryClient.setQueryData<CustomFieldDefinition[]>(
          customFieldKeys.definitions(projectId),
          (old) => old?.map((f) => (f.id === fieldId ? { ...f, ...input } : f)),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(customFieldKeys.definitions(projectId), context.previous)
      }
      toast.error('커스텀 필드 수정에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.definitions(projectId) })
    },
  })
}

export function useDeleteCustomField(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fieldId: string) => {
      const result = await deleteCustomFieldDefinition(supabase, fieldId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async (fieldId) => {
      await queryClient.cancelQueries({ queryKey: customFieldKeys.definitions(projectId) })
      const previous = queryClient.getQueryData<CustomFieldDefinition[]>(
        customFieldKeys.definitions(projectId),
      )

      if (previous) {
        queryClient.setQueryData<CustomFieldDefinition[]>(
          customFieldKeys.definitions(projectId),
          (old) => old?.filter((f) => f.id !== fieldId),
        )
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(customFieldKeys.definitions(projectId), context.previous)
      }
      toast.error('커스텀 필드 삭제에 실패했습니다')
    },
    onSuccess: () => {
      toast.success('커스텀 필드가 삭제되었습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.definitions(projectId) })
      queryClient.invalidateQueries({ queryKey: customFieldKeys.values(projectId) })
    },
  })
}

export function useTaskCustomFieldValues(projectId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: customFieldKeys.values(projectId),
    queryFn: async () => {
      const result = await getTaskCustomFieldValues(supabase, projectId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useSetCustomFieldValue(projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      fieldId,
      value,
    }: {
      taskId: string
      fieldId: string
      value: string | null
    }) => {
      const result = await setTaskCustomFieldValue(supabase, taskId, fieldId, value)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onMutate: async ({ taskId, fieldId, value }) => {
      await queryClient.cancelQueries({ queryKey: customFieldKeys.values(projectId) })
      const previous = queryClient.getQueryData<TaskCustomFieldValue[]>(
        customFieldKeys.values(projectId),
      )

      if (previous) {
        const existingIndex = previous.findIndex(
          (v) => v.task_id === taskId && v.field_id === fieldId,
        )
        const now = new Date().toISOString()

        if (existingIndex >= 0) {
          queryClient.setQueryData<TaskCustomFieldValue[]>(
            customFieldKeys.values(projectId),
            (old) =>
              old?.map((v) =>
                v.task_id === taskId && v.field_id === fieldId
                  ? { ...v, value, updated_at: now }
                  : v,
              ),
          )
        } else {
          queryClient.setQueryData<TaskCustomFieldValue[]>(
            customFieldKeys.values(projectId),
            (old) => [
              ...(old ?? []),
              {
                id: `temp-${Date.now()}`,
                task_id: taskId,
                field_id: fieldId,
                value,
                created_at: now,
                updated_at: now,
              },
            ],
          )
        }
      }

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(customFieldKeys.values(projectId), context.previous)
      }
      toast.error('커스텀 필드 값 설정에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.values(projectId) })
    },
  })
}
