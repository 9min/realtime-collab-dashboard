'use client'

import { useParams } from 'next/navigation'

import { ActivityFeed } from '@/components/activity/activity-feed'
import { ActivityFilterBar } from '@/components/activity/activity-filter-bar'
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription'
import { useProjectMembers } from '@/queries/use-projects'

export default function ActivityPage() {
  const params = useParams<{ projectId: string }>()
  const { data: members } = useProjectMembers(params.projectId)

  useRealtimeSubscription(params.projectId)

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-4 text-lg font-semibold">활동 로그</h2>
      <ActivityFilterBar members={members ?? []} />
      <ActivityFeed projectId={params.projectId} />
    </div>
  )
}
