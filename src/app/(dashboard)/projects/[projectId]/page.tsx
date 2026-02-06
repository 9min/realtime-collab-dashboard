'use client'

import { useParams } from 'next/navigation'

import { WidgetGrid } from '@/components/dashboard/widget-grid'
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription'

export default function ProjectDashboardPage() {
  const params = useParams<{ projectId: string }>()

  // 실시간 동기화: 태스크/컬럼 변경 시 차트 데이터도 갱신
  useRealtimeSubscription(params.projectId)

  return (
    <div className="flex h-full flex-col gap-4">
      <WidgetGrid projectId={params.projectId} />
    </div>
  )
}
