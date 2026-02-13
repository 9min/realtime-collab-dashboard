'use client'

import { useCallback, useState } from 'react'
import { ChevronDown, MessageSquare } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '@/queries/use-comments'
import { useProjectMembers } from '@/queries/use-projects'

import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'

interface CommentSectionProps {
  taskId: string
  projectId: string
  canComment: boolean
  canDeleteAll: boolean
}

export function CommentSection({
  taskId,
  projectId,
  canComment,
  canDeleteAll,
}: CommentSectionProps) {
  const { user } = useAuth()
  const { data: comments, isLoading } = useComments(taskId)
  const { data: members } = useProjectMembers(projectId)
  const createMutation = useCreateComment(taskId)
  const updateMutation = useUpdateComment(taskId)
  const deleteMutation = useDeleteComment(taskId, projectId)

  const memberList = members ?? []
  const hasComments = !!comments && comments.length > 0
  // null = 유저가 아직 토글하지 않음 → 데이터 기반으로 결정
  const [userToggle, setUserToggle] = useState<boolean | null>(null)
  const isOpen = userToggle ?? (!isLoading && hasComments)

  const handleCreate = useCallback(
    (content: string, mentions: string[]) => {
      if (!user) return
      createMutation.mutate({ projectId, userId: user.id, content, mentions })
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
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2"
        onClick={() => setUserToggle((prev) => !(prev ?? isOpen))}
      >
        <MessageSquare className="h-4 w-4" />
        <span className="text-sm font-medium">
          댓글 {hasComments ? `(${comments.length})` : ''}
        </span>
        <ChevronDown
          className={cn('ml-auto h-4 w-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="mt-2">
          {isLoading ? (
            <p className="text-muted-foreground py-4 text-center text-sm">로딩 중...</p>
          ) : hasComments ? (
            <div className="max-h-64 space-y-0 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id}>
                  <CommentItem
                    comment={comment}
                    currentUserId={user?.id ?? ''}
                    canDelete={canDeleteAll || comment.user_id === user?.id}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    members={memberList}
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
              <CommentForm
                onSubmit={handleCreate}
                isPending={createMutation.isPending}
                members={memberList}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
