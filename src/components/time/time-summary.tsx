'use client'

import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useTaskTimeSummary } from '@/queries/use-time-entries'

function formatMinutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

interface TimeSummaryProps {
  taskId: string
}

export function TimeSummary({ taskId }: TimeSummaryProps) {
  const { data: summary, isLoading } = useTaskTimeSummary(taskId)

  if (isLoading) {
    return <Skeleton className="h-8 w-full" />
  }

  if (!summary) return null

  const { totalMinutes, estimatedMinutes, entryCount } = summary

  if (entryCount === 0 && !estimatedMinutes) return null

  const percentage =
    estimatedMinutes && estimatedMinutes > 0
      ? Math.min(100, Math.round((totalMinutes / estimatedMinutes) * 100))
      : 0

  const isOverEstimate =
    estimatedMinutes && estimatedMinutes > 0 ? totalMinutes > estimatedMinutes : false

  return (
    <div className="space-y-1.5">
      {estimatedMinutes ? (
        <>
          <Progress value={percentage} className="h-2" aria-label="시간 진행률" />
          <p className="text-muted-foreground text-xs">
            <span className={isOverEstimate ? 'text-destructive font-medium' : ''}>
              {formatMinutesToHours(totalMinutes)}
            </span>
            {' / '}
            {formatMinutesToHours(estimatedMinutes)} 예상
          </p>
        </>
      ) : (
        <p className="text-muted-foreground text-xs">
          총 {formatMinutesToHours(totalMinutes)} 기록 ({entryCount}건)
        </p>
      )}
    </div>
  )
}
