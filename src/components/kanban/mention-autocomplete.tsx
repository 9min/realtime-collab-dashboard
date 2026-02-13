'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'

interface MemberInfo {
  user_id: string
  profiles: Tables<'profiles'>
}

interface MentionAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  members: MemberInfo[]
  placeholder?: string
  maxLength?: number
  rows?: number
  className?: string
  autoFocus?: boolean
}

export function MentionAutocomplete({
  value,
  onChange,
  onKeyDown,
  members,
  placeholder,
  maxLength,
  rows = 2,
  className,
  autoFocus,
}: MentionAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStartPos, setMentionStartPos] = useState(-1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const filteredMembers = members.filter((m) => {
    const name = (m.profiles.full_name ?? m.profiles.email).toLowerCase()
    return name.includes(searchText.toLowerCase())
  })

  const insertMention = useCallback(
    (member: MemberInfo) => {
      const name = member.profiles.full_name ?? member.profiles.email
      const before = value.slice(0, mentionStartPos)
      const after = value.slice(textareaRef.current?.selectionStart ?? value.length)
      const newValue = `${before}@${name} ${after}`
      onChange(newValue)
      setShowSuggestions(false)
      setSearchText('')
      setMentionStartPos(-1)

      // 커서 위치 복원
      requestAnimationFrame(() => {
        const pos = before.length + name.length + 2 // @name + space
        textareaRef.current?.setSelectionRange(pos, pos)
        textareaRef.current?.focus()
      })
    },
    [value, mentionStartPos, onChange],
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    const cursorPos = e.target.selectionStart
    const textBeforeCursor = newValue.slice(0, cursorPos)

    // @ 직전 문자가 없거나 공백인 경우에만 멘션 시작
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    if (lastAtIndex !== -1) {
      const charBefore = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' '
      if (charBefore === ' ' || charBefore === '\n' || lastAtIndex === 0) {
        const query = textBeforeCursor.slice(lastAtIndex + 1)
        // 공백이 없는 검색어 OR 이름에 공백이 있을 수 있으므로 허용
        if (!query.includes('\n')) {
          setMentionStartPos(lastAtIndex)
          setSearchText(query)
          setShowSuggestions(true)
          setSelectedIndex(0)
          return
        }
      }
    }

    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredMembers.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length)
        return
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        insertMention(filteredMembers[selectedIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowSuggestions(false)
        return
      }
    }

    onKeyDown?.(e)
  }

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!showSuggestions) return
    const handleClick = (e: MouseEvent) => {
      if (textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showSuggestions])

  return (
    <Popover open={showSuggestions && filteredMembers.length > 0}>
      <PopoverAnchor asChild>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          className={cn('min-h-[60px] resize-none text-sm', className)}
          autoFocus={autoFocus}
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-64 p-1"
        align="start"
        side="top"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-48 overflow-y-auto">
          {filteredMembers.map((member, index) => {
            const name = member.profiles.full_name ?? member.profiles.email
            return (
              <button
                key={member.user_id}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50',
                )}
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertMention(member)
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={member.profiles.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{name}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
