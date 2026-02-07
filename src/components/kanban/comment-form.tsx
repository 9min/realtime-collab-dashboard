'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const MAX_COMMENT_LENGTH = 2000

interface CommentFormProps {
  onSubmit: (content: string) => void
  isPending?: boolean
}

export function CommentForm({ onSubmit, isPending = false }: CommentFormProps) {
  const [content, setContent] = useState('')

  const trimmed = content.trim()
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_COMMENT_LENGTH && !isPending

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(trimmed)
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
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="댓글을 입력하세요... (Ctrl+Enter로 전송)"
        rows={2}
        className="min-h-[60px] resize-none text-sm"
        maxLength={MAX_COMMENT_LENGTH}
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
