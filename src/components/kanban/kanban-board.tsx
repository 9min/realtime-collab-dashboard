'use client'

import { useCallback, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { MEMBER_ROLE } from '@/lib/constants'
import { filterTasks } from '@/lib/task-filter'
import { useColumns, useCreateColumn, useUpdateColumn, useDeleteColumn } from '@/queries/use-columns'
import { useLabels, useTaskLabels } from '@/queries/use-labels'
import { useProjectMembers } from '@/queries/use-projects'
import { useTasks, useMoveTask } from '@/queries/use-tasks'
import { useKanbanFilterStore } from '@/stores/kanban-filter-store'
import type { Tables } from '@/types/database'
import type { KanbanColumnWithTasks } from '@/types/kanban'

import { BulkDeleteDialog } from './bulk-delete-dialog'
import { CreateTaskForm } from './create-task-form'
import { ExportButton } from './export-button'
import { KanbanColumn } from './kanban-column'
import { TaskFilterBar } from './task-filter-bar'

const TaskDetailDialog = dynamic(
  () => import('./task-detail-dialog').then((mod) => ({ default: mod.TaskDetailDialog })),
)

interface KanbanBoardProps {
  projectId: string
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { data: columns, isLoading: columnsLoading } = useColumns(projectId)
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId)
  const { data: members } = useProjectMembers(projectId)
  const moveTaskMutation = useMoveTask(projectId)
  const createColumnMutation = useCreateColumn(projectId)
  const updateColumnMutation = useUpdateColumn(projectId)
  const deleteColumnMutation = useDeleteColumn(projectId)

  // 현재 유저 역할 확인 — 뷰어는 수정 불가
  const currentRole = members?.find((m) => m.user_id === user?.id)?.role
  const canEdit = currentRole !== MEMBER_ROLE.VIEWER
  const canDeleteAll = currentRole === MEMBER_ROLE.OWNER || currentRole === MEMBER_ROLE.ADMIN

  // 라벨 데이터
  const { data: labels } = useLabels(projectId)
  const { data: taskLabelsData } = useTaskLabels(projectId)

  // 필터 상태
  const { searchText, priorities, assigneeIds, dueDateRange, labelIds } = useKanbanFilterStore()

  // 태스크 생성 다이얼로그 상태
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string | null>(null)
  // 태스크 상세 다이얼로그 상태 (수동 클릭)
  const [selectedTask, setSelectedTask] = useState<Tables<'tasks'> | null>(null)

  // URL 쿼리 파라미터로 태스크 자동 선택 (검색 결과 클릭 시)
  const taskIdParam = searchParams.get('taskId')
  const taskFromUrl = useMemo(() => {
    if (!taskIdParam || !tasks) return null
    return tasks.find((t) => t.id === taskIdParam) ?? null
  }, [taskIdParam, tasks])

  // 다이얼로그에 표시할 태스크: URL 파라미터 우선
  const displayedTask = taskFromUrl ?? selectedTask

  // task→labelIds 맵 생성
  const taskLabelMap = useMemo(() => {
    const map = new Map<string, string[]>()
    if (!taskLabelsData) return map
    for (const tl of taskLabelsData) {
      const existing = map.get(tl.task_id)
      if (existing) {
        existing.push(tl.label_id)
      } else {
        map.set(tl.task_id, [tl.label_id])
      }
    }
    return map
  }, [taskLabelsData])

  // 컬럼별 태스크 그룹핑 + 필터 적용
  const columnsWithTasks: KanbanColumnWithTasks[] = useMemo(() => {
    if (!columns || !tasks) return []
    const filtered = filterTasks(tasks, { searchText, priorities, assigneeIds, dueDateRange, labelIds, taskLabelMap })
    return columns.map((column) => ({
      ...column,
      tasks: filtered
        .filter((t) => t.column_id === column.id)
        .sort((a, b) => a.position - b.position),
    }))
  }, [columns, tasks, searchText, priorities, assigneeIds, dueDateRange, labelIds, taskLabelMap])

  // DnD 완료 핸들러 — 뷰어는 무시, 일반 멤버는 본인 태스크만
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!canEdit) return
      const { draggableId, source, destination } = result
      if (!destination) return
      // 같은 위치에 드롭하면 무시
      if (source.droppableId === destination.droppableId && source.index === destination.index) return

      // 일반 멤버: 담당자 없는 태스크 또는 본인 담당 태스크만 이동 가능
      if (!canDeleteAll && tasks) {
        const draggedTask = tasks.find((t) => t.id === draggableId)
        if (draggedTask && draggedTask.assignee_id !== null && draggedTask.assignee_id !== user?.id) return
      }

      moveTaskMutation.mutate({
        taskId: draggableId,
        sourceColumnId: source.droppableId,
        destinationColumnId: destination.droppableId,
        newPosition: destination.index,
      })
    },
    [canEdit, canDeleteAll, tasks, user?.id, moveTaskMutation],
  )

  // 컬럼 추가
  const handleAddColumn = useCallback(() => {
    if (!columns) return
    const title = `새 컬럼 ${columns.length + 1}`
    createColumnMutation.mutate({ title, position: columns.length })
  }, [columns, createColumnMutation])

  // 컬럼 이름 변경
  const handleRenameColumn = useCallback(
    (columnId: string, title: string) => {
      updateColumnMutation.mutate({ columnId, input: { title } })
    },
    [updateColumnMutation],
  )

  // 컬럼 삭제
  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      deleteColumnMutation.mutate(columnId)
    },
    [deleteColumnMutation],
  )

  if (columnsLoading || tasksLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 3 }).map((_, colIdx) => (
          <div key={colIdx} className="w-72 shrink-0 rounded-lg border">
            <div className="border-b px-3 py-2">
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }).map((_, cardIdx) => (
                <div key={cardIdx} className="space-y-2 rounded-lg border p-3">
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
                    <div className="ml-auto h-6 w-6 animate-pulse rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* 필터 바 + 일괄 삭제 */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1">
          <TaskFilterBar members={members ?? []} labels={labels ?? []} />
        </div>
        <div className="flex gap-2 pb-4">
          <ExportButton projectId={projectId} />
          {canDeleteAll && (
            <BulkDeleteDialog projectId={projectId} tasks={tasks ?? []} />
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columnsWithTasks.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={column.tasks}
              onAddTask={setCreateTaskColumnId}
              onTaskClick={setSelectedTask}
              onRenameColumn={handleRenameColumn}
              onDeleteColumn={handleDeleteColumn}
              canEdit={canEdit}
              canDeleteColumn={canDeleteAll}
              canMoveAll={canDeleteAll}
              currentUserId={user?.id}
              members={members}
              labels={labels}
              taskLabelMap={taskLabelMap}
            />
          ))}

          {/* 컬럼 추가 버튼 — owner/admin만 */}
          {canDeleteAll && (
            <Button
              variant="outline"
              className="h-12 w-72 shrink-0 border-dashed"
              onClick={handleAddColumn}
            >
              <Plus className="mr-2 h-4 w-4" />
              컬럼 추가
            </Button>
          )}
        </div>
      </DragDropContext>

      {/* 태스크 생성 다이얼로그 */}
      <CreateTaskForm
        projectId={projectId}
        columnId={createTaskColumnId}
        open={createTaskColumnId !== null}
        onOpenChange={(open) => {
          if (!open) setCreateTaskColumnId(null)
        }}
      />

      {/* 태스크 상세 다이얼로그 */}
      <TaskDetailDialog
        projectId={projectId}
        task={displayedTask}
        open={displayedTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null)
            if (taskIdParam) {
              router.replace(`/projects/${projectId}/board`, { scroll: false })
            }
          }
        }}
        canEdit={canEdit}
        canDeleteAll={canDeleteAll}
        labels={labels}
        taskLabelIds={displayedTask ? taskLabelMap.get(displayedTask.id) : undefined}
      />
    </>
  )
}
