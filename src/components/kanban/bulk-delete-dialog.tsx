'use client'

import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getTasksCreatedBefore } from '@/lib/task-filter'
import { useBulkDeleteTasks } from '@/queries/use-tasks'
import type { Task } from '@/types/kanban'

interface BulkDeleteDialogProps {
  projectId: string
  tasks: Task[]
  externalOpen?: boolean
  onExternalOpenChange?: (open: boolean) => void
}

export function BulkDeleteDialog({ projectId, tasks, externalOpen, onExternalOpenChange }: BulkDeleteDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [beforeDate, setBeforeDate] = useState('')
  const bulkDeleteMutation = useBulkDeleteTasks(projectId)

  const isControlled = externalOpen !== undefined
  const dialogOpen = isControlled ? externalOpen : internalOpen
  const setDialogOpen = isControlled ? (onExternalOpenChange ?? setInternalOpen) : setInternalOpen

  const targetTasks = useMemo(() => {
    if (!beforeDate) return []
    // 날짜 input은 YYYY-MM-DD → 해당 날짜 시작 시점(00:00:00) 기준
    const isoDate = `${beforeDate}T00:00:00Z`
    return getTasksCreatedBefore(tasks, isoDate)
  }, [tasks, beforeDate])

  const handleConfirmDelete = () => {
    if (!beforeDate || targetTasks.length === 0) return
    const isoDate = `${beforeDate}T00:00:00Z`
    bulkDeleteMutation.mutate(isoDate, {
      onSuccess: () => {
        setConfirmOpen(false)
        setDialogOpen(false)
        setBeforeDate('')
      },
    })
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setBeforeDate('')
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Trash2 className="h-4 w-4" />
            일괄 삭제
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>태스크 일괄 삭제</DialogTitle>
          <DialogDescription>
            선택한 날짜 이전에 생성된 태스크를 일괄 삭제합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-delete-date">기준 날짜</Label>
            <Input
              id="bulk-delete-date"
              type="date"
              value={beforeDate}
              onChange={(e) => setBeforeDate(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              이 날짜 이전에 생성된 태스크가 삭제됩니다.
            </p>
          </div>

          {beforeDate && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                삭제 대상: <span className="text-destructive">{targetTasks.length}개</span>
              </p>
              {targetTasks.length > 0 && (
                <ScrollArea className="h-40 rounded-md border p-2">
                  <ul className="space-y-1">
                    {targetTasks.map((task) => (
                      <li key={task.id} className="text-sm truncate">
                        {task.title}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <Button
              variant="destructive"
              disabled={targetTasks.length === 0 || bulkDeleteMutation.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              {bulkDeleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  {targetTasks.length}개의 태스크를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleConfirmDelete}
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
