'use client'

import { useParams } from 'next/navigation'

import { ActivityFeed } from '@/components/activity/activity-feed'
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription'

export default function ActivityPage() {
  const params = useParams<{ projectId: string }>()

  useRealtimeSubscription(params.projectId)

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-4 text-lg font-semibold">활동 로그</h2>
      <ActivityFeed projectId={params.projectId} />
    </div>
  )
}
