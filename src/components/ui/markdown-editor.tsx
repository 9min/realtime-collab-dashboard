'use client'

import { useState } from 'react'
import { Eye, Pencil } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from './button'
import { Textarea } from './textarea'
import { MarkdownRenderer } from './markdown-renderer'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  rows?: number
  className?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 4,
  className,
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-1">
        <Button
          type="button"
          variant={!isPreview ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setIsPreview(false)}
        >
          <Pencil className="mr-1 h-3 w-3" />
          작성
        </Button>
        <Button
          type="button"
          variant={isPreview ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setIsPreview(true)}
        >
          <Eye className="mr-1 h-3 w-3" />
          미리보기
        </Button>
      </div>

      {isPreview ? (
        <div className="border-input min-h-[100px] rounded-md border p-3">
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-muted-foreground text-sm">미리보기할 내용이 없습니다</p>
          )}
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          className="resize-none"
        />
      )}
    </div>
  )
}
