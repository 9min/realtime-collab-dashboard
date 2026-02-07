'use client'

import { Avatar, AvatarFallback, AvatarImage, AvatarBadge } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface UserAvatarProps {
  name: string | null
  avatarUrl: string | null
  /** 온라인 표시 여부 */
  isOnline?: boolean
  /** 아바타 크기 */
  size?: 'sm' | 'default' | 'lg'
  /** 툴팁 표시 여부 */
  showTooltip?: boolean
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.slice(0, 2).toUpperCase()
}

export function UserAvatar({
  name,
  avatarUrl,
  isOnline = false,
  size = 'default',
  showTooltip = true,
}: UserAvatarProps) {
  const avatar = (
    <Avatar size={size === 'default' ? undefined : size}>
      <AvatarImage src={avatarUrl ?? undefined} alt={name ?? '사용자'} />
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
      {isOnline && <AvatarBadge className="bg-emerald-500" />}
    </Avatar>
  )

  if (!showTooltip) return avatar

  return (
    <Tooltip>
      <TooltipTrigger asChild>{avatar}</TooltipTrigger>
      <TooltipContent>{name ?? '사용자'}</TooltipContent>
    </Tooltip>
  )
}
