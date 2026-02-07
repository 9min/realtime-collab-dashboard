'use client'

import { Bell, MessageSquare, AtSign, Clock } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { NotificationWithActor } from '@/types/notification'
import { NOTIFICATION_TYPE } from '@/types/notification'

interface NotificationItemProps {
  notification: NotificationWithActor
  onClick: (notification: NotificationWithActor) => void
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

function getNotificationIcon(type: string) {
  switch (type) {
    case NOTIFICATION_TYPE.TASK_ASSIGNED:
      return <Bell className="h-4 w-4 text-blue-500" />
    case NOTIFICATION_TYPE.COMMENTED:
      return <MessageSquare className="h-4 w-4 text-green-500" />
    case NOTIFICATION_TYPE.MENTIONED:
      return <AtSign className="h-4 w-4 text-purple-500" />
    case NOTIFICATION_TYPE.DUE_SOON:
      return <Clock className="h-4 w-4 text-orange-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  return (
    <button
      onClick={() => onClick(notification)}
      className={cn(
        'hover:bg-muted flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
        !notification.is_read && 'bg-blue-50/50 dark:bg-blue-950/20',
      )}
    >
      <div className="mt-0.5 shrink-0">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', !notification.is_read && 'font-medium')}>
          {notification.message}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          {notification.actor && (
            <span className="text-muted-foreground text-xs">
              {notification.actor.full_name ?? notification.actor.email}
            </span>
          )}
          <span className="text-muted-foreground text-xs">
            {getRelativeTime(notification.created_at)}
          </span>
        </div>
      </div>
      {!notification.is_read && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </button>
  )
}
