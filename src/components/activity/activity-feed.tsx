'use client'

import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Activity } from 'lucide-react'

import { filterActivityLogs, groupActivitiesByDate } from '@/lib/activity-filter'
import { useActivityLogs } from '@/queries/use-activity-logs'
import { useActivityFilterStore } from '@/stores/activity-filter-store'
import type { ActivityLogWithUser } from '@/types/activity'

import { ActivityItem } from './activity-item'

interface ActivityFeedProps {
  projectId: string
}

type FlatItem =
  | { type: 'header'; label: string }
  | { type: 'activity'; activity: ActivityLogWithUser }

export function ActivityFeed({ projectId }: ActivityFeedProps) {
  const { data: activities, isLoading, error } = useActivityLogs(projectId)
  const parentRef = useRef<HTMLDivElement>(null)

  const { searchText, actionTypes, entityTypes, userIds, resetFilters, hasActiveFilters } =
    useActivityFilterStore()

  const flatItems = useMemo<FlatItem[]>(() => {
    if (!activities) return []

    const filtered = filterActivityLogs(activities, {
      searchText,
      actionTypes,
      entityTypes,
      userIds,
    })

    const groups = groupActivitiesByDate(filtered)

    const items: FlatItem[] = []
    for (const group of groups) {
      items.push({ type: 'header', label: group.label })
      for (const activity of group.activities) {
        items.push({ type: 'activity', activity })
      }
    }
    return items
  }, [activities, searchText, actionTypes, entityTypes, userIds])

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (flatItems[index]?.type === 'header' ? 40 : 72),
    overscan: 5,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 px-3 py-3">
            <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
              <div className="flex gap-1.5">
                <div className="bg-muted h-4 w-12 animate-pulse rounded-full" />
                <div className="bg-muted h-4 w-14 animate-pulse rounded-full" />
                <div className="bg-muted h-4 w-10 animate-pulse rounded" />
              </div>
            </div>
            <div className="bg-muted h-6 w-6 animate-pulse rounded-full" />
          </div>
        ))}
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
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Activity className="text-muted-foreground h-10 w-10" />
        <p className="text-muted-foreground text-sm">아직 활동이 없습니다</p>
      </div>
    )
  }

  if (flatItems.length === 0 && hasActiveFilters()) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Activity className="text-muted-foreground h-10 w-10" />
        <p className="text-muted-foreground text-sm">필터 조건에 맞는 활동이 없습니다</p>
        <button
          onClick={resetFilters}
          className="text-primary text-sm underline underline-offset-4"
        >
          필터 초기화
        </button>
      </div>
    )
  }

  return (
    <div ref={parentRef} className="h-[600px] overflow-y-auto">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = flatItems[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              {item.type === 'header' ? (
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="bg-border h-px flex-1" />
                  <span className="text-muted-foreground shrink-0 text-xs font-medium">
                    {item.label}
                  </span>
                  <div className="bg-border h-px flex-1" />
                </div>
              ) : (
                <ActivityItem activity={item.activity} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
