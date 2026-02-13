'use client'
'use no memo'

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { CheckCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
  const parentRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line react-hooks/incompatible-library -- 'use no memo'로 Compiler 스킵 처리됨
  const virtualizer = useVirtualizer({
    count: notifications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  })

  return (
    <div className="w-full">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">알림</h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7 text-xs"
            onClick={onMarkAllRead}
          >
            <CheckCheck className="mr-1 h-3 w-3" />
            모두 읽음
          </Button>
        )}
      </div>
      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center text-sm">로딩 중...</p>
      ) : notifications.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">알림이 없습니다</p>
      ) : (
        <div ref={parentRef} className="max-h-[400px] overflow-y-auto">
          <div
            className="relative w-full"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={virtualItem.key}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                className="absolute left-0 top-0 w-full"
                style={{ transform: `translateY(${virtualItem.start}px)` }}
              >
                <NotificationItem
                  notification={notifications[virtualItem.index]}
                  onClick={onItemClick}
                />
                {virtualItem.index < notifications.length - 1 && (
                  <div className="bg-border h-px" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
