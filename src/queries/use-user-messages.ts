'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import { useAuth } from '@/hooks/use-auth'
import { getMyMessage, sendMessage, getAllUserMessages, markMessageAsRead } from '@/services/user-message-service'

export const userMessageKeys = {
  mine: ['user-messages', 'mine'] as const,
  all: ['user-messages', 'all'] as const,
}

export function useMyMessage() {
  const supabase = useSupabase()
  const { user } = useAuth()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: userMessageKeys.mine,
    queryFn: async () => {
      if (!user) return null
      const result = await getMyMessage(supabase, user.id)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!user,
  })
}

export function useAllUserMessages() {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: userMessageKeys.all,
    queryFn: async () => {
      const result = await getAllUserMessages(supabase)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
  })
}

export function useSendMessage() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      const result = await sendMessage(supabase, userId, message)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMessageKeys.mine })
      toast.success('메시지가 전송되었습니다')
    },
    onError: (error) => {
      toast.error(error.message || '메시지 전송에 실패했습니다')
    },
  })
}

export function useMarkMessageRead() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (messageId: string) => {
      const result = await markMessageAsRead(supabase, messageId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userMessageKeys.all })
    },
    onError: (error) => {
      toast.error(error.message || '읽음 처리에 실패했습니다')
    },
  })
}
