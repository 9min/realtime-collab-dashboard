'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useProjectMembers } from '@/queries/use-projects'

interface MemberListWidgetProps {
  projectId: string
}

const ROLE_LABELS: Record<string, string> = {
  owner: '소유자',
  admin: '관리자',
  member: '멤버',
  viewer: '뷰어',
}

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  member: 'outline',
  viewer: 'outline',
}

const ITEM_HEIGHT = 48
const MAX_PREVIEW_AVATARS = 3

export function MemberListWidget({ projectId }: MemberListWidgetProps) {
  const { data: members, isLoading } = useProjectMembers(projectId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(false)
  const [hiddenStartIndex, setHiddenStartIndex] = useState(Infinity)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !members) return

    const overflowing = el.scrollHeight > el.clientHeight + 1
    setHasOverflow(overflowing)

    if (!overflowing) {
      setIsAtBottom(false)
      setHiddenStartIndex(members.length)
      return
    }

    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 4
    setIsAtBottom(atBottom)

    const bottomEdge = el.scrollTop + el.clientHeight
    const visibleCount = Math.max(1, Math.floor(bottomEdge / ITEM_HEIGHT))
    setHiddenStartIndex(Math.min(visibleCount, members.length))
  }, [members])

  useEffect(() => {
    checkScroll()
  }, [members, checkScroll])

  if (isLoading) {
    return (
      <div className="space-y-3 p-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
            <div className="bg-muted h-4 flex-1 animate-pulse rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!members || members.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        멤버가 없습니다
      </div>
    )
  }

  const hiddenMembers = members.slice(hiddenStartIndex)
  const showOverlay = hasOverflow && !isAtBottom && hiddenMembers.length > 0

  return (
    <div className="relative flex h-full flex-col">
      <div ref={scrollRef} onScroll={checkScroll} className="min-h-0 flex-1 overflow-y-auto p-1">
        <div className="space-y-1">
          {members.map((member) => {
            const initials = (member.profiles.full_name ?? member.profiles.email)
              .slice(0, 2)
              .toUpperCase()

            return (
              <div key={member.id} className="flex items-center gap-3 rounded-md p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.profiles.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.profiles.full_name ?? member.profiles.email}
                  </p>
                </div>
                <Badge
                  variant={ROLE_VARIANTS[member.role] ?? 'outline'}
                  className="shrink-0 text-xs"
                >
                  {ROLE_LABELS[member.role] ?? member.role}
                </Badge>
              </div>
            )
          })}
        </div>
      </div>
      {showOverlay && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <div className="to-card h-6 bg-gradient-to-b from-transparent" />
          <div className="bg-card flex items-center gap-2 px-3 pb-2">
            <div className="flex -space-x-2">
              {hiddenMembers.slice(0, MAX_PREVIEW_AVATARS).map((member) => {
                const initials = (member.profiles.full_name ?? member.profiles.email)
                  .slice(0, 2)
                  .toUpperCase()
                return (
                  <Avatar key={member.id} className="border-card h-6 w-6 border-2">
                    <AvatarImage src={member.profiles.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                )
              })}
            </div>
            <span className="text-muted-foreground text-xs font-medium">
              +{hiddenMembers.length}명
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
