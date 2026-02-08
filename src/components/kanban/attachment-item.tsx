'use client'

import NextImage from 'next/image'
import { Download, FileText, Image as ImageIcon, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { isImageType, formatFileSize } from '@/types/attachment'
import type { TaskAttachmentWithUser } from '@/types/attachment'

interface AttachmentItemProps {
  attachment: TaskAttachmentWithUser
  publicUrl: string
  canDelete: boolean
  onDelete: (attachmentId: string, filePath: string) => void
}

export function AttachmentItem({ attachment, publicUrl, canDelete, onDelete }: AttachmentItemProps) {
  const isImage = isImageType(attachment.content_type)

  return (
    <div className="border-border flex items-center gap-3 rounded-md border p-2">
      {/* 썸네일 / 아이콘 */}
      {isImage ? (
        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
          <NextImage
            src={publicUrl}
            alt={attachment.file_name}
            width={48}
            height={48}
            className="h-12 w-12 rounded object-cover"
          />
        </a>
      ) : (
        <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded">
          {attachment.content_type === 'application/pdf' ? (
            <FileText className="h-5 w-5 text-red-500" />
          ) : (
            <ImageIcon className="text-muted-foreground h-5 w-5" />
          )}
        </div>
      )}

      {/* 파일 정보 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.file_name}</p>
        <p className="text-muted-foreground text-xs">
          {formatFileSize(attachment.file_size)} · {attachment.profiles.full_name ?? attachment.profiles.email}
        </p>
      </div>

      {/* 액션 */}
      <div className="flex shrink-0 items-center gap-1">
        <a href={publicUrl} download={attachment.file_name} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </a>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive h-7 w-7"
            onClick={() => onDelete(attachment.id, attachment.file_path)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
