'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/hooks/use-auth'
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/queries/use-notifications'
import type { NotificationWithActor } from '@/types/notification'

import { NotificationList } from './notification-list'

export function NotificationBell() {
  const { user } = useAuth()
  const router = useRouter()
  const userId = user?.id ?? ''

  const { data: notifications, isLoading } = useNotifications(userId)
  const { data: unreadCount } = useUnreadCount(userId)
  const markAsReadMutation = useMarkAsRead(userId)
  const markAllAsReadMutation = useMarkAllAsRead(userId)

  const handleItemClick = useCallback(
    (notification: NotificationWithActor) => {
      if (!notification.is_read) {
        markAsReadMutation.mutate(notification.id)
      }
      if (notification.entity_type === 'task' && notification.entity_id) {
        router.push(`/projects/${notification.project_id}/board`)
      } else if (notification.entity_type === 'comment') {
        router.push(`/projects/${notification.project_id}/board`)
      }
    },
    [markAsReadMutation, router],
  )

  const handleMarkAllRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  if (!userId) return null

  const displayCount = unreadCount ?? 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {displayCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {displayCount > 99 ? '99+' : displayCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-auto overflow-hidden p-0">
        <NotificationList
          notifications={notifications ?? []}
          isLoading={isLoading}
          onItemClick={handleItemClick}
          onMarkAllRead={handleMarkAllRead}
          hasUnread={displayCount > 0}
        />
      </PopoverContent>
    </Popover>
  )
}
