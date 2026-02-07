'use client'

import { CheckCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { NotificationWithActor } from '@/types/notification'

import { NotificationItem } from './notification-item'

interface NotificationListProps {
  notifications: NotificationWithActor[]
  isLoading: boolean
  onItemClick: (notification: NotificationWithActor) => void
  onMarkAllRead: () => void
  hasUnread: boolean
}

export function NotificationList({
  notifications,
  isLoading,
  onItemClick,
  onMarkAllRead,
  hasUnread,
}: NotificationListProps) {
  return (
    <div className="w-80">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold">알림</h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onMarkAllRead}
          >
            <CheckCheck className="mr-1 h-3 w-3" />
            모두 읽음
          </Button>
        )}
      </div>
      <Separator />
      <ScrollArea className="max-h-96">
        {isLoading ? (
          <p className="text-muted-foreground py-8 text-center text-sm">로딩 중...</p>
        ) : notifications.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">알림이 없습니다</p>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div key={notification.id}>
                <NotificationItem
                  notification={notification}
                  onClick={onItemClick}
                />
                <Separator />
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
