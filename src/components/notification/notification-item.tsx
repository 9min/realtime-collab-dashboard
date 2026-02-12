'use client'

import { memo } from 'react'
import { Bell, MessageSquare, AtSign, Clock, Mail } from 'lucide-react'

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

const ICON_CONFIG = {
  [NOTIFICATION_TYPE.TASK_ASSIGNED]: {
    icon: Bell,
    className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  },
  [NOTIFICATION_TYPE.COMMENTED]: {
    icon: MessageSquare,
    className: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
  },
  [NOTIFICATION_TYPE.MENTIONED]: {
    icon: AtSign,
    className: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
  },
  [NOTIFICATION_TYPE.DUE_SOON]: {
    icon: Clock,
    className: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
  },
  [NOTIFICATION_TYPE.USER_MESSAGE]: {
    icon: Mail,
    className: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
  },
} as const

export const NotificationItem = memo(function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const config = ICON_CONFIG[notification.type as keyof typeof ICON_CONFIG] ?? {
    icon: Bell,
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }
  const Icon = config.icon

  return (
    <button
      onClick={() => onClick(notification)}
      className={cn(
        'hover:bg-muted/80 flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors',
        !notification.is_read && 'bg-blue-50/60 dark:bg-blue-950/20',
      )}
    >
      <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', config.className)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm leading-snug', !notification.is_read && 'font-medium')}>
          {notification.message}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {notification.actor && (
            <span>{notification.actor.full_name ?? notification.actor.email}</span>
          )}
          {notification.actor && <span className="mx-1">·</span>}
          <span>{getRelativeTime(notification.created_at)}</span>
        </p>
      </div>
      {!notification.is_read && (
        <div className="mt-3 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </button>
  )
})
