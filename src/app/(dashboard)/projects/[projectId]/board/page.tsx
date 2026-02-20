'use client'

import { useParams } from 'next/navigation'

import { KanbanBoard } from '@/components/kanban/kanban-board'
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription'

export default function KanbanBoardPage() {
  const params = useParams<{ projectId: string }>()

  // 실시간 동기화: tasks + kanban_columns 변경 구독
  useRealtimeSubscription(params.projectId)

  return <KanbanBoard projectId={params.projectId} />
}
