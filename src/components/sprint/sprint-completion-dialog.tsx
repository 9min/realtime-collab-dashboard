'use client'

import { useState, useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useSprints, useCompleteSprint } from '@/queries/use-sprints'
import { SPRINT_STATUS } from '@/types/sprint'

interface SprintCompletionDialogProps {
  sprintId: string
  projectId: string
  unfinishedCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SprintCompletionDialog({
  sprintId,
  projectId,
  unfinishedCount,
  open,
  onOpenChange,
}: SprintCompletionDialogProps) {
  const { data: sprints } = useSprints(projectId)
  const completeMutation = useCompleteSprint(projectId)

  const [moveTarget, setMoveTarget] = useState<'backlog' | string>('backlog')

  const plannedSprints = useMemo(
    () => (sprints ?? []).filter((s) => s.status === SPRINT_STATUS.PLANNED),
    [sprints],
  )

  const handleComplete = () => {
    completeMutation.mutate(
      { sprintId, moveUnfinishedTo: moveTarget },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>스프린트 완료</DialogTitle>
          <DialogDescription>
            스프린트를 완료합니다. 미완료 태스크를 어떻게 처리할지 선택하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {unfinishedCount > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm">미완료 태스크:</span>
                <Badge variant="secondary">{unfinishedCount}개</Badge>
              </div>

              <div className="space-y-3">
                <Label>미완료 태스크 이동 대상</Label>

                <label className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors">
                  <input
                    type="radio"
                    name="moveTarget"
                    value="backlog"
                    checked={moveTarget === 'backlog'}
                    onChange={() => setMoveTarget('backlog')}
                    className="accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">백로그로 이동</p>
                    <p className="text-muted-foreground text-xs">
                      스프린트에 배정되지 않은 상태로 변경됩니다
                    </p>
                  </div>
                </label>

                {plannedSprints.map((sprint) => (
                  <label
                    key={sprint.id}
                    className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors"
                  >
                    <input
                      type="radio"
                      name="moveTarget"
                      value={sprint.id}
                      checked={moveTarget === sprint.id}
                      onChange={() => setMoveTarget(sprint.id)}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">{sprint.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {sprint.start_date} ~ {sprint.end_date}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">모든 태스크가 완료되었습니다.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleComplete} disabled={completeMutation.isPending}>
            {completeMutation.isPending ? '처리 중...' : '스프린트 완료'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
