'use client'

import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Activity, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="bg-muted h-5 w-24 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-3.5 w-16 animate-pulse rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
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
      </CardContent>
    </Card>
  )
}

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
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-destructive text-sm">활동 로그를 불러오지 못했습니다</p>
        </CardContent>
      </Card>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-64 flex-col items-center justify-center gap-3">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <Activity className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="text-muted-foreground text-sm">아직 활동이 없습니다</p>
        </CardContent>
      </Card>
    )
  }

  if (flatItems.length === 0 && hasActiveFilters()) {
    return (
      <Card>
        <CardContent className="flex h-64 flex-col items-center justify-center gap-3">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <Search className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="text-muted-foreground text-sm">필터 조건에 맞는 활동이 없습니다</p>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="cursor-pointer text-xs"
          >
            필터 초기화
          </Button>
        </CardContent>
      </Card>
    )
  }

  const activityCount = activities?.length ?? 0
  const filteredCount = flatItems.filter((i) => i.type === 'activity').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">타임라인</CardTitle>
            <CardDescription>
              {hasActiveFilters()
                ? `${filteredCount}개 / ${activityCount}개 활동`
                : `총 ${activityCount}개 활동`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
