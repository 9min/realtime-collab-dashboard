'use client'

import { useCallback } from 'react'
import { MessageSquare } from 'lucide-react'

import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '@/queries/use-comments'

import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'

interface CommentSectionProps {
  taskId: string
  projectId: string
  canComment: boolean
  canDeleteAll: boolean
}

export function CommentSection({ taskId, projectId, canComment, canDeleteAll }: CommentSectionProps) {
  const { user } = useAuth()
  const { data: comments, isLoading } = useComments(taskId)
  const createMutation = useCreateComment(taskId)
  const updateMutation = useUpdateComment(taskId)
  const deleteMutation = useDeleteComment(taskId, projectId)

  const handleCreate = useCallback(
    (content: string) => {
      if (!user) return
      createMutation.mutate({ projectId, userId: user.id, content })
    },
    [user, projectId, createMutation],
  )

  const handleUpdate = useCallback(
    (commentId: string, content: string) => {
      updateMutation.mutate({ commentId, content })
    },
    [updateMutation],
  )

  const handleDelete = useCallback(
    (commentId: string) => {
      deleteMutation.mutate(commentId)
    },
    [deleteMutation],
  )

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <span className="text-sm font-medium">
          댓글 {comments && comments.length > 0 ? `(${comments.length})` : ''}
        </span>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-4 text-center text-sm">로딩 중...</p>
      ) : comments && comments.length > 0 ? (
        <div className="max-h-64 space-y-0 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                currentUserId={user?.id ?? ''}
                canDelete={canDeleteAll || comment.user_id === user?.id}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
              <Separator />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-4 text-center text-sm">아직 댓글이 없습니다</p>
      )}

      {canComment && (
        <div className="mt-3">
          <CommentForm onSubmit={handleCreate} isPending={createMutation.isPending} />
        </div>
      )}
    </div>
  )
}
