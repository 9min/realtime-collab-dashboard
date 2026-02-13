'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useWorkload } from '@/queries/use-workload'
import { getWorkloadZone } from '@/types/workload'

import { WorkloadChart } from './workload-chart'

interface WorkloadViewProps {
  projectId: string
}

const ZONE_BADGE_STYLES = {
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  red: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
} as const

const ZONE_LABELS = {
  green: '여유',
  yellow: '적정',
  red: '과부하',
} as const

export function WorkloadView({ projectId }: WorkloadViewProps) {
  const { data, isLoading } = useWorkload(projectId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted h-12 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16">
        <p className="text-sm">프로젝트 멤버가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 차트 */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="mb-4 text-sm font-medium">멤버별 태스크 분포</h3>
        <WorkloadChart data={data} projectId={projectId} />
      </div>

      {/* 멤버 리스트 */}
      <div className="space-y-2">
        {data.map((member) => {
          const zone = getWorkloadZone(member.totalTasks)
          return (
            <div
              key={member.userId}
              className="bg-card flex items-center gap-3 rounded-lg border px-4 py-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {member.userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.userName}</p>
              </div>
              <Badge variant="secondary" className={cn('text-xs', ZONE_BADGE_STYLES[zone])}>
                {ZONE_LABELS[zone]}
              </Badge>
              <span className="text-sm font-medium tabular-nums">{member.totalTasks}개</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
