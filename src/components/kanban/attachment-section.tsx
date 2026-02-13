'use client'

import { useCallback, useState } from 'react'
import { ChevronDown, Paperclip } from 'lucide-react'

import { cn } from '@/lib/utils'

import { useSupabase } from '@/components/providers/supabase-provider'
import { useAuth } from '@/hooks/use-auth'
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '@/queries/use-attachments'
import { getPublicUrl } from '@/services/attachment-service'

import { AttachmentItem } from './attachment-item'
import { FileUploadButton } from './file-upload-button'

interface AttachmentSectionProps {
  taskId: string
  projectId: string
  canUpload: boolean
  canDeleteAll: boolean
}

export function AttachmentSection({
  taskId,
  projectId,
  canUpload,
  canDeleteAll,
}: AttachmentSectionProps) {
  const { user } = useAuth()
  const supabase = useSupabase()
  const { data: attachments, isLoading } = useAttachments(taskId)
  const uploadMutation = useUploadAttachment(taskId)
  const deleteMutation = useDeleteAttachment(taskId)

  const hasAttachments = !!attachments && attachments.length > 0
  // null = 유저가 아직 토글하지 않음 → 데이터 기반으로 결정
  const [userToggle, setUserToggle] = useState<boolean | null>(null)
  const isOpen = userToggle ?? (!isLoading && hasAttachments)

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!user) return
      uploadMutation.mutate({ projectId, userId: user.id, file })
    },
    [user, projectId, uploadMutation],
  )

  const handleDelete = useCallback(
    (attachmentId: string, filePath: string) => {
      deleteMutation.mutate({ attachmentId, filePath })
    },
    [deleteMutation],
  )

  return (
    <div>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2"
        onClick={() => setUserToggle((prev) => !(prev ?? isOpen))}
      >
        <Paperclip className="h-4 w-4" />
        <span className="text-sm font-medium">
          첨부파일 {hasAttachments ? `(${attachments.length})` : ''}
        </span>
        <ChevronDown
          className={cn('ml-auto h-4 w-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="mt-2">
          {isLoading ? (
            <p className="text-muted-foreground py-4 text-center text-sm">로딩 중...</p>
          ) : hasAttachments ? (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <AttachmentItem
                  key={attachment.id}
                  attachment={attachment}
                  publicUrl={getPublicUrl(supabase, attachment.file_path)}
                  canDelete={canDeleteAll || attachment.user_id === user?.id}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-2 text-center text-sm">첨부파일이 없습니다</p>
          )}

          {canUpload && (
            <div className="mt-3">
              <FileUploadButton
                onFileSelect={handleFileSelect}
                isPending={uploadMutation.isPending}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
