'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Tables } from '@/types/database'

import { MentionAutocomplete } from './mention-autocomplete'

const MAX_COMMENT_LENGTH = 2000

interface MemberInfo {
  user_id: string
  profiles: Tables<'profiles'>
}

interface CommentFormProps {
  onSubmit: (content: string, mentions: string[]) => void
  isPending?: boolean
  members?: MemberInfo[]
}

export function CommentForm({ onSubmit, isPending = false, members = [] }: CommentFormProps) {
  const [content, setContent] = useState('')

  const trimmed = content.trim()
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_COMMENT_LENGTH && !isPending

  const handleSubmit = () => {
    if (!canSubmit) return
    // @멘션 파싱
    const mentionedIds: string[] = []
    for (const member of members) {
      const name = member.profiles.full_name ?? member.profiles.email
      if (trimmed.includes(`@${name}`)) {
        mentionedIds.push(member.user_id)
      }
    }
    onSubmit(trimmed, mentionedIds)
    setContent('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex gap-2">
      <MentionAutocomplete
        value={content}
        onChange={setContent}
        onKeyDown={handleKeyDown}
        members={members}
        placeholder="댓글을 입력하세요... (@로 멘션, Ctrl+Enter로 전송)"
        maxLength={MAX_COMMENT_LENGTH}
        rows={2}
      />
      <Button
        size="icon"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="shrink-0 self-end"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
