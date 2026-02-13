'use client'

import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTimeEntriesByTask, useDeleteTimeEntry } from '@/queries/use-time-entries'

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

interface TimeEntryListProps {
  taskId: string
  projectId: string
  canEdit?: boolean
}

export function TimeEntryList({ taskId, projectId, canEdit = false }: TimeEntryListProps) {
  const { data: entries, isLoading, error } = useTimeEntriesByTask(taskId)
  const deleteTimeEntry = useDeleteTimeEntry(projectId)

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (error) {
    return <p className="text-destructive text-sm">시간 기록을 불러올 수 없습니다</p>
  }

  if (!entries || entries.length === 0) {
    return <p className="text-muted-foreground text-sm">기록된 시간이 없습니다</p>
  }

  const handleDelete = (entryId: string) => {
    deleteTimeEntry.mutate({ entryId, taskId })
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatDuration(entry.duration_minutes)}</span>
              <span className="text-muted-foreground">{formatDate(entry.created_at)}</span>
            </div>
            {entry.description && (
              <p className="text-muted-foreground mt-0.5 truncate text-xs">{entry.description}</p>
            )}
          </div>
          {canEdit && (
            <div className="ml-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleDelete(entry.id)}
                aria-label="시간 기록 삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
