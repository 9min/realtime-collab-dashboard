'use client'

import { memo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ACTION_CONFIG, ENTITY_CONFIG } from '@/lib/activity-constants'
import { cn } from '@/lib/utils'
import { ACTIVITY_ACTION, ACTIVITY_ENTITY } from '@/types/activity'
import type { ActivityAction, ActivityEntity, ActivityLogWithUser } from '@/types/activity'

interface ActivityItemProps {
  activity: ActivityLogWithUser
}

function formatMessage(activity: ActivityLogWithUser): string {
  const userName = activity.profiles.full_name ?? activity.profiles.email
  const actionConfig = ACTION_CONFIG[activity.action_type as ActivityAction]
  const entityConfig = ENTITY_CONFIG[activity.entity_type as ActivityEntity]
  const action = actionConfig?.label ?? activity.action_type
  const entity = entityConfig?.label ?? activity.entity_type
  const meta = activity.metadata as Record<string, unknown>
  const title = typeof meta.title === 'string' ? meta.title : ''

  if (activity.action_type === ACTIVITY_ACTION.MOVED && activity.entity_type === ACTIVITY_ENTITY.TASK) {
    return `${userName}님이 태스크 '${title}'를 이동했습니다`
  }

  if (activity.entity_type === ACTIVITY_ENTITY.MEMBER) {
    if (activity.action_type === ACTIVITY_ACTION.CREATED) {
      return `${userName}님이 새 멤버를 추가했습니다`
    }
    if (activity.action_type === ACTIVITY_ACTION.DELETED) {
      return `${userName}님이 멤버를 제거했습니다`
    }
    if (activity.action_type === ACTIVITY_ACTION.UPDATED) {
      const oldRole = typeof meta.old_role === 'string' ? meta.old_role : ''
      const newRole = typeof meta.new_role === 'string' ? meta.new_role : ''
      return `${userName}님이 멤버 역할을 ${oldRole} → ${newRole}로 변경했습니다`
    }
  }

  if (activity.entity_type === ACTIVITY_ENTITY.COMMENT) {
    if (activity.action_type === ACTIVITY_ACTION.CREATED) {
      return `${userName}님이 태스크에 댓글을 남겼습니다`
    }
    if (activity.action_type === ACTIVITY_ACTION.DELETED) {
      return `${userName}님이 댓글을 삭제했습니다`
    }
  }

  if (title) {
    return `${userName}님이 ${entity} '${title}'을(를) ${action}했습니다`
  }

  return `${userName}님이 ${entity}을(를) ${action}했습니다`
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

function getInitials(name: string | null, email: string): string {
  if (name) return name.charAt(0).toUpperCase()
  return email.charAt(0).toUpperCase()
}

export const ActivityItem = memo(function ActivityItem({ activity }: ActivityItemProps) {
  const profile = activity.profiles
  const message = formatMessage(activity)
  const time = getRelativeTime(activity.created_at)
  const actionConfig = ACTION_CONFIG[activity.action_type as ActivityAction]
  const entityConfig = ENTITY_CONFIG[activity.entity_type as ActivityEntity]

  const ActionIcon = actionConfig?.icon
  const actionLabel = actionConfig?.label ?? activity.action_type
  const entityLabel = entityConfig?.label ?? activity.entity_type

  return (
    <div className="hover:bg-muted/50 flex gap-3 rounded-lg px-3 py-3 transition-colors">
      {/* Action icon with colored bg */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          actionConfig?.bgColor ?? 'bg-muted',
        )}
      >
        {ActionIcon && (
          <ActionIcon className={cn('h-4 w-4', actionConfig?.textColor ?? 'text-muted-foreground')} />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed break-words">{message}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px]">
            {actionLabel}
          </Badge>
          <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px]">
            {entityLabel}
          </Badge>
          <span className="text-muted-foreground ml-auto text-xs">{time}</span>
        </div>
      </div>

      {/* User avatar */}
      <Avatar className="h-7 w-7 shrink-0 ring-2 ring-transparent">
        <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name ?? ''} />
        <AvatarFallback className="text-[10px]">
          {getInitials(profile.full_name, profile.email)}
        </AvatarFallback>
      </Avatar>
    </div>
  )
})
