'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useActivityLogs } from '@/queries/use-activity-logs'

import { ActivityItem } from './activity-item'

interface ActivityFeedProps {
  projectId: string
}

export function ActivityFeed({ projectId }: ActivityFeedProps) {
  const { data: activities, isLoading, error } = useActivityLogs(projectId)

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
    <ScrollArea className="h-[600px]">
      <div className="divide-y">
        {activities.map((activity, index) => (
          <div key={activity.id}>
            <ActivityItem activity={activity} />
            {index < activities.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
