'use client'

import { AlertTriangle, Database, Users, Wifi } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { ErrorTrendChart } from '@/components/monitoring/error-trend-chart'
import { CacheStatsChart } from '@/components/monitoring/cache-stats-chart'
import { ActiveUsersChart } from '@/components/monitoring/active-users-chart'
import { SystemStatusCard } from '@/components/monitoring/system-status-card'
import { useMonitoringStats } from '@/queries/use-monitoring'
import { useMyProfile } from '@/queries/use-admin'

const SKELETON_STAT_COUNT = 4
const SKELETON_CHART_COUNT = 4

function StatCard({
  icon: Icon,
  label,
  value,
  accentClass,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  accentClass: string
}) {
  return (
    <Card className={`border-t-2 ${accentClass} gap-0 py-4`}>
      <CardContent className="flex items-center gap-3">
        <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Icon className="text-muted-foreground h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-muted-foreground mt-1 text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">모니터링</h2>
        <p className="text-muted-foreground mt-1">시스템 상태 및 성능 모니터링</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: SKELETON_STAT_COUNT }).map((_, i) => (
          <Card key={i} className="gap-0 py-4">
            <CardContent className="flex items-center gap-3">
              <div className="bg-muted h-10 w-10 animate-pulse rounded-lg" />
              <div className="space-y-2">
                <div className="bg-muted h-6 w-10 animate-pulse rounded" />
                <div className="bg-muted h-3 w-16 animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: SKELETON_CHART_COUNT }).map((_, i) => (
          <Card key={i}>
            <CardContent className="h-[300px] animate-pulse" />
          </Card>
        ))}
      </div>
    </div>
  )
}

const REALTIME_LABELS = {
  connected: '연결됨',
  connecting: '연결 중',
  disconnected: '끊김',
} as const

export default function MonitoringPage() {
  const { data: myProfile, isLoading: profileLoading } = useMyProfile()
  const { data: stats, isLoading: statsLoading } = useMonitoringStats()

  if (profileLoading || statsLoading) {
    return <LoadingSkeleton />
  }

  if (!myProfile?.is_admin) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">모니터링</h2>
          <p className="text-muted-foreground mt-1">시스템 상태 및 성능 모니터링</p>
        </div>
        <Card className="border-destructive/50">
          <CardContent>
            <p className="text-destructive text-sm">관리자 권한이 필요합니다.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) return null

  const realtimeLabel = REALTIME_LABELS[stats.system.realtimeStatus]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">모니터링</h2>
        <p className="text-muted-foreground mt-1">시스템 상태 및 성능 모니터링</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="총 에러 (7일)"
          value={stats.errors.total}
          accentClass="border-t-rose-500"
        />
        <StatCard
          icon={Users}
          label="활성 사용자"
          value={stats.activeUsers.current}
          accentClass="border-t-blue-500"
        />
        <StatCard
          icon={Database}
          label="캐시 적중률"
          value={`${stats.cache.hitRate}%`}
          accentClass="border-t-emerald-500"
        />
        <StatCard
          icon={Wifi}
          label="Realtime 상태"
          value={realtimeLabel}
          accentClass="border-t-violet-500"
        />
      </div>

      {/* Charts 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4">
        <ErrorTrendChart data={stats.errors.trend} />
        <CacheStatsChart data={stats.cache} />
        <ActiveUsersChart current={stats.activeUsers.current} />
        <SystemStatusCard
          realtimeStatus={stats.system.realtimeStatus}
          apiStatus={stats.system.apiStatus}
        />
      </div>
    </div>
  )
}
