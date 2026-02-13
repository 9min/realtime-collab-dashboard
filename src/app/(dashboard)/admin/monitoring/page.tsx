'use client'

import { ClipboardList, FolderKanban, HardDrive, Users } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { useMonitoringStats } from '@/queries/use-monitoring'
import { useMyProfile } from '@/queries/use-admin'

const BYTES_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${BYTES_UNITS[i]}`
}

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  borderColor: string
}

function StatCard({ icon, value, label, borderColor }: StatCardProps) {
  return (
    <Card className={`border-t-2 ${borderColor} gap-0 py-4`}>
      <CardContent className="flex items-center gap-3">
        <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          {icon}
        </div>
        <div>
          <p className="text-2xl leading-none font-bold">{value}</p>
          <p className="text-muted-foreground mt-1 text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface StorageCardProps {
  usedBytes: number
  limitBytes: number
}

function StorageCard({ usedBytes, limitBytes }: StorageCardProps) {
  const percent = limitBytes > 0 ? Math.min((usedBytes / limitBytes) * 100, 100) : 0

  return (
    <Card className="gap-0 border-t-2 border-t-rose-500 py-4">
      <CardContent className="flex items-center gap-3">
        <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <HardDrive className="h-5 w-5 text-rose-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl leading-none font-bold">
            {formatBytes(usedBytes)}
            <span className="text-muted-foreground ml-1 text-sm font-normal">
              / {formatBytes(limitBytes)}
            </span>
          </p>
          <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-rose-500 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-xs">스토리지 사용량</p>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">서비스 통계</h2>
        <p className="text-muted-foreground mt-1">서비스 현황 요약</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
    </div>
  )
}

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
          <h2 className="text-2xl font-bold">서비스 통계</h2>
          <p className="text-muted-foreground mt-1">서비스 현황 요약</p>
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">서비스 통계</h2>
        <p className="text-muted-foreground mt-1">서비스 현황 요약</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5 text-blue-500" />}
          value={stats.totalUsers}
          label="전체 사용자"
          borderColor="border-t-blue-500"
        />
        <StatCard
          icon={<FolderKanban className="h-5 w-5 text-emerald-500" />}
          value={stats.totalProjects}
          label="프로젝트"
          borderColor="border-t-emerald-500"
        />
        <StatCard
          icon={<ClipboardList className="h-5 w-5 text-amber-500" />}
          value={stats.totalTasks}
          label="태스크"
          borderColor="border-t-amber-500"
        />
        <StorageCard usedBytes={stats.storageUsedBytes} limitBytes={stats.storageLimitBytes} />
      </div>
    </div>
  )
}
