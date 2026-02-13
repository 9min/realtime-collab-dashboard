'use client'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { PresenceUser } from '@/hooks/use-presence'

interface OnlineUsersProps {
  users: PresenceUser[]
}

// 표시할 최대 아바타 수
const MAX_VISIBLE = 5

export function OnlineUsers({ users }: OnlineUsersProps) {
  if (users.length === 0) return null

  const visible = users.slice(0, MAX_VISIBLE)
  const remaining = users.length - MAX_VISIBLE

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">{users.length}명 접속 중</span>
        <AvatarGroup>
          {visible.map((user) => {
            const initials = getInitials(user.full_name, user.user_id)
            return (
              <Tooltip key={user.user_id}>
                <TooltipTrigger asChild>
                  <Avatar size="sm">
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                    <AvatarBadge className="bg-emerald-500" />
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{user.full_name ?? '사용자'}</TooltipContent>
              </Tooltip>
            )
          })}
          {remaining > 0 && <AvatarGroupCount>+{remaining}</AvatarGroupCount>}
        </AvatarGroup>
      </div>
    </TooltipProvider>
  )
}

function getInitials(fullName: string | null, fallback: string): string {
  if (fullName) {
    return fullName.slice(0, 2).toUpperCase()
  }
  return fallback.slice(0, 2).toUpperCase()
}
