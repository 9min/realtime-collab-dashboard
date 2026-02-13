'use client'

import { useState, useMemo } from 'react'
import {
  ChevronDown,
  Play,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Calendar,
  Target,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { useSprints, useStartSprint, useDeleteSprint, useReopenSprint } from '@/queries/use-sprints'
import { useSprintStore } from '@/stores/sprint-store'
import { SPRINT_STATUS } from '@/types/sprint'
import type { SprintWithStats } from '@/types/sprint'

import { SprintCreateDialog } from './sprint-create-dialog'
import { SprintCompletionDialog } from './sprint-completion-dialog'

const STATUS_LABELS: Record<string, string> = {
  planned: '계획됨',
  active: '진행 중',
  completed: '완료',
}

const STATUS_STYLES: Record<string, string> = {
  planned: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  planned: 'secondary',
  active: 'default',
  completed: 'outline',
}

interface SprintHeaderProps {
  projectId: string
  canManage: boolean
}

export function SprintHeader({ projectId, canManage }: SprintHeaderProps) {
  const { data: sprints } = useSprints(projectId)
  const startSprintMutation = useStartSprint(projectId)
  const deleteSprintMutation = useDeleteSprint(projectId)
  const reopenSprintMutation = useReopenSprint(projectId)

  const selectedSprintId = useSprintStore((s) => s.selectedSprintId)
  const setSelectedSprintId = useSprintStore((s) => s.setSelectedSprintId)

  const [createOpen, setCreateOpen] = useState(false)
  const [editSprint, setEditSprint] = useState<SprintWithStats | null>(null)
  const [completeOpen, setCompleteOpen] = useState(false)

  const selectedSprint = useMemo(
    () => sprints?.find((s) => s.id === selectedSprintId) ?? null,
    [sprints, selectedSprintId],
  )

  const activeSprint = useMemo(
    () => sprints?.find((s) => s.status === SPRINT_STATUS.ACTIVE) ?? null,
    [sprints],
  )

  const unfinishedCount = useMemo(() => {
    if (!selectedSprint) return 0
    return selectedSprint.totalTasks - selectedSprint.completedTasks
  }, [selectedSprint])

  const progressPercent = useMemo(() => {
    if (!selectedSprint || selectedSprint.totalTasks === 0) return 0
    return Math.round((selectedSprint.completedTasks / selectedSprint.totalTasks) * 100)
  }, [selectedSprint])

  const handleStartSprint = () => {
    if (!selectedSprint) return
    startSprintMutation.mutate(selectedSprint.id)
  }

  const handleDeleteSprint = () => {
    if (!selectedSprint) return
    deleteSprintMutation.mutate(selectedSprint.id)
    setSelectedSprintId(null)
  }

  const handleReopenSprint = () => {
    if (!selectedSprint) return
    reopenSprintMutation.mutate(selectedSprint.id)
  }

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col gap-4 px-5 py-4">
        {/* 상단: 드롭다운 + 액션 */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {selectedSprint ? selectedSprint.name : '스프린트 선택'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {sprints?.map((sprint) => (
                <DropdownMenuItem
                  key={sprint.id}
                  onClick={() => setSelectedSprintId(sprint.id)}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">{sprint.name}</span>
                  <Badge variant={STATUS_VARIANTS[sprint.status]}>
                    {STATUS_LABELS[sprint.status]}
                  </Badge>
                </DropdownMenuItem>
              ))}
              {(!sprints || sprints.length === 0) && (
                <DropdownMenuItem disabled>스프린트가 없습니다</DropdownMenuItem>
              )}
              {canManage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />새 스프린트
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedSprint && (
            <Badge className={STATUS_STYLES[selectedSprint.status]}>
              {STATUS_LABELS[selectedSprint.status]}
            </Badge>
          )}

          {/* 액션 버튼 */}
          {canManage && selectedSprint && (
            <div className="ml-auto flex items-center gap-1">
              {selectedSprint.status === SPRINT_STATUS.PLANNED && !activeSprint && (
                <Button
                  size="sm"
                  onClick={handleStartSprint}
                  disabled={startSprintMutation.isPending}
                >
                  <Play className="mr-1 h-3.5 w-3.5" />
                  시작
                </Button>
              )}
              {selectedSprint.status === SPRINT_STATUS.ACTIVE && (
                <Button size="sm" variant="secondary" onClick={() => setCompleteOpen(true)}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  완료
                </Button>
              )}
              {selectedSprint.status === SPRINT_STATUS.COMPLETED && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReopenSprint}
                    disabled={reopenSprintMutation.isPending || !!activeSprint}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    다시 열기
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={handleDeleteSprint}
                    disabled={deleteSprintMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              {selectedSprint.status === SPRINT_STATUS.PLANNED && (
                <>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setEditSprint(selectedSprint)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={handleDeleteSprint}
                    disabled={deleteSprintMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 하단: 스프린트 상세 정보 */}
        {selectedSprint && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Calendar className="h-3.5 w-3.5" />
              {selectedSprint.start_date} ~ {selectedSprint.end_date}
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Target className="h-3.5 w-3.5" />
              {selectedSprint.completedTasks}/{selectedSprint.totalTasks} 완료
            </span>
            <div className="flex flex-1 items-center gap-2">
              <Progress value={progressPercent} className="h-1.5 min-w-20" />
              <span className="text-muted-foreground text-xs tabular-nums">{progressPercent}%</span>
            </div>
          </div>
        )}
      </CardContent>

      {/* 다이얼로그 */}
      <SprintCreateDialog projectId={projectId} open={createOpen} onOpenChange={setCreateOpen} />
      {editSprint && (
        <SprintCreateDialog
          projectId={projectId}
          sprint={editSprint}
          open={!!editSprint}
          onOpenChange={(open) => {
            if (!open) setEditSprint(null)
          }}
        />
      )}
      {selectedSprint && (
        <SprintCompletionDialog
          sprintId={selectedSprint.id}
          projectId={projectId}
          unfinishedCount={unfinishedCount}
          open={completeOpen}
          onOpenChange={setCompleteOpen}
        />
      )}
    </Card>
  )
}
