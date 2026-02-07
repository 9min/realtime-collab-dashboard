'use client'

import { useCallback, useMemo, useState } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { MEMBER_ROLE } from '@/lib/constants'
import { useColumns, useCreateColumn, useDeleteColumn } from '@/queries/use-columns'
import { useProjectMembers } from '@/queries/use-projects'
import { useTasks, useMoveTask } from '@/queries/use-tasks'
import type { Tables } from '@/types/database'
import type { KanbanColumnWithTasks } from '@/types/kanban'

import { KanbanColumn } from './kanban-column'
import { CreateTaskForm } from './create-task-form'
import { TaskDetailDialog } from './task-detail-dialog'

interface KanbanBoardProps {
  projectId: string
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { user } = useAuth()
  const { data: columns, isLoading: columnsLoading } = useColumns(projectId)
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId)
  const { data: members } = useProjectMembers(projectId)
  const moveTaskMutation = useMoveTask(projectId)
  const createColumnMutation = useCreateColumn(projectId)
  const deleteColumnMutation = useDeleteColumn(projectId)

  // 현재 유저 역할 확인 — 뷰어는 수정 불가
  const currentRole = members?.find((m) => m.user_id === user?.id)?.role
  const canEdit = currentRole !== MEMBER_ROLE.VIEWER

  // 태스크 생성 다이얼로그 상태
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string | null>(null)
  // 태스크 상세 다이얼로그 상태
  const [selectedTask, setSelectedTask] = useState<Tables<'tasks'> | null>(null)

  // 컬럼별 태스크 그룹핑
  const columnsWithTasks: KanbanColumnWithTasks[] = useMemo(() => {
    if (!columns || !tasks) return []
    return columns.map((column) => ({
      ...column,
      tasks: tasks
        .filter((t) => t.column_id === column.id)
        .sort((a, b) => a.position - b.position),
    }))
  }, [columns, tasks])

  // DnD 완료 핸들러 — 뷰어는 무시
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!canEdit) return
      const { draggableId, source, destination } = result
      if (!destination) return
      // 같은 위치에 드롭하면 무시
      if (source.droppableId === destination.droppableId && source.index === destination.index) return

      moveTaskMutation.mutate({
        taskId: draggableId,
        sourceColumnId: source.droppableId,
        destinationColumnId: destination.droppableId,
        newPosition: destination.index,
      })
    },
    [canEdit, moveTaskMutation],
  )

  // 컬럼 추가
  const handleAddColumn = useCallback(() => {
    if (!columns) return
    const title = `새 컬럼 ${columns.length + 1}`
    createColumnMutation.mutate({ title, position: columns.length })
  }, [columns, createColumnMutation])

  // 컬럼 삭제
  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      deleteColumnMutation.mutate(columnId)
    },
    [deleteColumnMutation],
  )

  if (columnsLoading || tasksLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columnsWithTasks.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={column.tasks}
              onAddTask={setCreateTaskColumnId}
              onTaskClick={setSelectedTask}
              onDeleteColumn={handleDeleteColumn}
              canEdit={canEdit}
            />
          ))}

          {/* 컬럼 추가 버튼 — 뷰어에게 숨김 */}
          {canEdit && (
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
        task={selectedTask}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null)
        }}
        canEdit={canEdit}
      />
    </>
  )
}
