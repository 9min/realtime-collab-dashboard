'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ACTIVITY_ACTION, ACTIVITY_ENTITY } from '@/types/activity'
import type { ActivityLogWithUser } from '@/types/activity'

interface ActivityItemProps {
  activity: ActivityLogWithUser
}

function getActionLabel(actionType: string): string {
  switch (actionType) {
    case ACTIVITY_ACTION.CREATED: return '생성'
    case ACTIVITY_ACTION.UPDATED: return '수정'
    case ACTIVITY_ACTION.DELETED: return '삭제'
    case ACTIVITY_ACTION.MOVED: return '이동'
    default: return actionType
  }
}

function getEntityLabel(entityType: string): string {
  switch (entityType) {
    case ACTIVITY_ENTITY.TASK: return '태스크'
    case ACTIVITY_ENTITY.COLUMN: return '컬럼'
    case ACTIVITY_ENTITY.MEMBER: return '멤버'
    case ACTIVITY_ENTITY.COMMENT: return '댓글'
    default: return entityType
  }
}

function formatMessage(activity: ActivityLogWithUser): string {
  const userName = activity.profiles.full_name ?? activity.profiles.email
  const action = getActionLabel(activity.action_type)
  const entity = getEntityLabel(activity.entity_type)
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

export function ActivityItem({ activity }: ActivityItemProps) {
  const profile = activity.profiles
  const message = formatMessage(activity)
  const time = getRelativeTime(activity.created_at)

  return (
    <div className="flex gap-3 py-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={profile.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs">
          {getInitials(profile.full_name, profile.email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed">{message}</p>
        <span className="text-muted-foreground text-xs">{time}</span>
      </div>
    </div>
  )
}
