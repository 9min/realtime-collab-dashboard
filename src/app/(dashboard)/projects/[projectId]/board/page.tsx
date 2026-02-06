'use client'

import { useParams } from 'next/navigation'

import { KanbanBoard } from '@/components/kanban/kanban-board'

export default function KanbanBoardPage() {
  const params = useParams<{ projectId: string }>()

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={params.projectId} />
      </div>
    </div>
  )
}
