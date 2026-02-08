'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription'

const GanttChart = dynamic(
  () => import('@/components/gantt/gantt-chart').then((mod) => ({ default: mod.GanttChart })),
  {
    loading: () => (
      <div className="text-muted-foreground py-12 text-center">로딩 중...</div>
    ),
  },
)

export default function GanttPage() {
  const params = useParams<{ projectId: string }>()

  useRealtimeSubscription(params.projectId)

  return (
    <div className="flex h-full flex-col">
      <GanttChart projectId={params.projectId} />
    </div>
  )
}
