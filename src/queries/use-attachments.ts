'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSupabase } from '@/components/providers/supabase-provider'
import { getAttachments, uploadAttachment, deleteAttachment } from '@/services/attachment-service'

export const attachmentKeys = {
  list: (taskId: string) => ['attachments', taskId] as const,
}

export function useAttachments(taskId: string) {
  const supabase = useSupabase()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: attachmentKeys.list(taskId),
    queryFn: async () => {
      const result = await getAttachments(supabase, taskId)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: !!taskId,
  })
}

export function useUploadAttachment(taskId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { projectId: string; userId: string; file: File }) => {
      const result = await uploadAttachment(supabase, { taskId, ...input })
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.list(taskId) })
      toast.success('파일이 첨부되었습니다')
    },
    onError: () => {
      toast.error('파일 업로드에 실패했습니다')
    },
  })
}

export function useDeleteAttachment(taskId: string) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ attachmentId, filePath }: { attachmentId: string; filePath: string }) => {
      const result = await deleteAttachment(supabase, attachmentId, filePath)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.list(taskId) })
      toast.success('첨부파일이 삭제되었습니다')
    },
    onError: () => {
      toast.error('첨부파일 삭제에 실패했습니다')
    },
  })
}
