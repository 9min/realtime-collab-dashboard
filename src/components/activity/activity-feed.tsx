'use client'

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

import { useActivityLogs } from '@/queries/use-activity-logs'

import { ActivityItem } from './activity-item'

interface ActivityFeedProps {
  projectId: string
}

export function ActivityFeed({ projectId }: ActivityFeedProps) {
  const { data: activities, isLoading, error } = useActivityLogs(projectId)
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: activities?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive text-sm">활동 로그를 불러오지 못했습니다</p>
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">아직 활동이 없습니다</p>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="h-[600px] overflow-y-auto">
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
            <ActivityItem activity={activities[virtualItem.index]} />
            {virtualItem.index < activities.length - 1 && (
              <div className="bg-border h-px" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
