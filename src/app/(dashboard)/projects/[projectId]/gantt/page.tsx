'use client'

import { useParams } from 'next/navigation'

import { GanttChart } from '@/components/gantt/gantt-chart'
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription'

export default function GanttPage() {
  const params = useParams<{ projectId: string }>()

  useRealtimeSubscription(params.projectId)

  return (
    <div className="flex h-full flex-col">
      <GanttChart projectId={params.projectId} />
    </div>
  )
}
