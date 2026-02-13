'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import { activityKeys } from '@/queries/use-activity-logs'
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '@/services/comment-service'

export const commentKeys = {
  list: (taskId: string) => ['comments', taskId] as const,
}

export function useComments(taskId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: commentKeys.list(taskId),
    queryFn: async () => {
      const result = await getComments(supabase, taskId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!taskId,
  })
}

export function useCreateComment(taskId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      projectId: string
      userId: string
      content: string
      mentions?: string[]
    }) => {
      const result = await createComment(supabase, { taskId, ...input })
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(taskId) })
      queryClient.invalidateQueries({ queryKey: activityKeys.list(variables.projectId) })
    },
    onError: () => {
      toast.error('댓글 작성에 실패했습니다')
    },
  })
}

export function useUpdateComment(taskId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const result = await updateComment(supabase, { commentId, content })
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(taskId) })
    },
    onError: () => {
      toast.error('댓글 수정에 실패했습니다')
    },
  })
}

export function useDeleteComment(taskId: string, projectId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const result = await deleteComment(supabase, commentId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(taskId) })
      queryClient.invalidateQueries({ queryKey: activityKeys.list(projectId) })
      toast.success('댓글이 삭제되었습니다')
    },
    onError: () => {
      toast.error('댓글 삭제에 실패했습니다')
    },
  })
}
