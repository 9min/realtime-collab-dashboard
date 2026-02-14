'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { ArrowRightLeft, Pencil, Plus, Trash2 } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { ActivityFeed } from '@/components/activity/activity-feed'
import { ActivityFilterBar } from '@/components/activity/activity-filter-bar'
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription'
import { useActivityLogs } from '@/queries/use-activity-logs'
import { useProjectMembers } from '@/queries/use-projects'
import { ACTIVITY_ACTION } from '@/types/activity'

function StatCard({
  icon: Icon,
  label,
  value,
  accentClass,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  accentClass: string
}) {
  return (
    <Card className={`border-t-2 ${accentClass} gap-0 py-4`}>
      <CardContent className="flex items-center gap-3">
        <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Icon className="text-muted-foreground h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl leading-none font-bold">{value}</p>
          <p className="text-muted-foreground mt-1 text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ActivityPage() {
  const params = useParams<{ projectId: string }>()
  const { data: members } = useProjectMembers(params.projectId)
  const { data: activities } = useActivityLogs(params.projectId)

  useRealtimeSubscription(params.projectId)

  const stats = useMemo(() => {
    if (!activities) return null
    const created = activities.filter((a) => a.action_type === ACTIVITY_ACTION.CREATED).length
    const updated = activities.filter((a) => a.action_type === ACTIVITY_ACTION.UPDATED).length
    const deleted = activities.filter((a) => a.action_type === ACTIVITY_ACTION.DELETED).length
    const moved = activities.filter((a) => a.action_type === ACTIVITY_ACTION.MOVED).length
    return { created, updated, deleted, moved }
  }, [activities])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">활동 로그</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          프로젝트 내 모든 활동 내역을 확인합니다
        </p>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Plus}
            label="생성"
            value={stats.created}
            accentClass="border-t-emerald-500"
          />
          <StatCard
            icon={Pencil}
            label="수정"
            value={stats.updated}
            accentClass="border-t-blue-500"
          />
          <StatCard
            icon={Trash2}
            label="삭제"
            value={stats.deleted}
            accentClass="border-t-red-500"
          />
          <StatCard
            icon={ArrowRightLeft}
            label="이동"
            value={stats.moved}
            accentClass="border-t-amber-500"
          />
        </div>
      )}

      {/* Filter Bar */}
      <ActivityFilterBar members={members ?? []} />

      {/* Activity Feed */}
      <ActivityFeed projectId={params.projectId} />
    </div>
  )
}
