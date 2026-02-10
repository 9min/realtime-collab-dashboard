'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { parseMentionSegments } from '@/lib/mention-utils'
import type { TaskCommentWithUser } from '@/types/comment'
import type { Tables } from '@/types/database'

interface MemberInfo {
  user_id: string
  profiles: Tables<'profiles'>
}

interface CommentItemProps {
  comment: TaskCommentWithUser
  currentUserId: string
  canDelete: boolean
  onUpdate: (commentId: string, content: string) => void
  onDelete: (commentId: string) => void
  members?: MemberInfo[]
}

function getRelativeTime(dateString: string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return new Date(dateString).toLocaleDateString('ko-KR')
}

export function CommentItem({ comment, currentUserId, canDelete, onUpdate, onDelete, members = [] }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')

  const profile = comment.profiles
  const isAuthor = comment.user_id === currentUserId
  const isEdited = comment.created_at !== comment.updated_at
  const showActions = isAuthor || canDelete

  const startEdit = () => {
    setEditContent(comment.content)
    setIsEditing(true)
  }

  const handleSave = () => {
    const trimmed = editContent.trim()
    if (trimmed.length > 0 && trimmed !== comment.content) {
      onUpdate(comment.id, trimmed)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  return (
    <div className="group flex gap-3 py-3">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={profile.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs">
          {(profile.full_name ?? profile.email).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">
            {profile.full_name ?? profile.email}
          </span>
          <span className="text-muted-foreground text-xs shrink-0">
            {getRelativeTime(comment.created_at)}
          </span>
          {isEdited && (
            <span className="text-muted-foreground text-xs">(수정됨)</span>
          )}

          {showActions && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-6 w-6 opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor && (
                  <DropdownMenuItem onClick={startEdit}>
                    <Pencil className="mr-2 h-3 w-3" />
                    편집
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(comment.id)}
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="mt-1 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="min-h-[48px] resize-none text-sm"
              maxLength={2000}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={editContent.trim().length === 0}
              >
                저장
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap text-sm">
            {members.length > 0
              ? parseMentionSegments(comment.content, members).map((segment, i) =>
                  segment.type === 'mention' ? (
                    <span key={i} className="rounded bg-blue-100 px-0.5 font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {segment.content}
                    </span>
                  ) : (
                    <span key={i}>{segment.content}</span>
                  ),
                )
              : comment.content}
          </p>
        )}
      </div>
    </div>
  )
}
