'use client'

import { memo, useRef, useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { CheckCircle2, Gauge, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { COLUMN_COLORS, COLUMN_DEFAULT_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'
import type { Label } from '@/types/label'
import type { TaskAssigneeWithProfile } from '@/types/task-assignee'

import { TaskCard } from './task-card'

interface KanbanColumnProps {
  column: Tables<'kanban_columns'>
  tasks: Tables<'tasks'>[]
  onAddTask: (columnId: string) => void
  onTaskClick: (task: Tables<'tasks'>) => void
  onRenameColumn: (columnId: string, title: string) => void
  onDeleteColumn: (columnId: string) => void
  onSetWipLimit?: (columnId: string) => void
  onToggleDone?: (columnId: string, isDone: boolean) => void
  canEdit: boolean
  canDeleteColumn: boolean
  canMoveAll: boolean
  currentUserId?: string
  members?: (Tables<'project_members'> & { profiles: Tables<'profiles'> })[]
  labels?: Label[]
  taskLabelMap?: Map<string, string[]>
  blockedTaskIds?: Set<string>
  recurringTaskIds?: Set<string>
  taskAssigneeMap?: Map<string, TaskAssigneeWithProfile[]>
  subtaskMap?: Map<string, Tables<'subtasks'>[]>
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onTaskClick,
  onRenameColumn,
  onDeleteColumn,
  onSetWipLimit,
  onToggleDone,
  canEdit,
  canDeleteColumn,
  canMoveAll,
  currentUserId,
  members,
  labels,
  taskLabelMap,
  blockedTaskIds,
  recurringTaskIds,
  taskAssigneeMap,
  subtaskMap,
}: KanbanColumnProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(column.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const wipLimit = column.wip_limit ?? null
  const isOverWipLimit = wipLimit !== null && tasks.length > wipLimit

  const handleStartEditing = () => {
    setEditTitle(column.title)
    setIsEditing(true)
    // Input이 렌더링된 후 포커스
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleSubmitRename = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== column.title) {
      onRenameColumn(column.id, trimmed)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitRename()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  const columnColor = COLUMN_COLORS[column.title] ?? COLUMN_DEFAULT_COLORS

  return (
    <div
      className={cn(
        'bg-muted/60 dark:bg-muted/30 flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border shadow-sm',
        isOverWipLimit && 'border-red-400 dark:border-red-600',
      )}
      style={{ maxHeight: 'calc(100dvh - 19rem)', minHeight: 300 }}
    >
      {/* 컬럼 헤더 */}
      <div
        className={cn(
          'flex items-center justify-between border-b bg-gradient-to-r px-3 py-2',
          columnColor.gradient,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSubmitRename}
              onKeyDown={handleKeyDown}
              className="h-6 text-sm font-semibold"
              maxLength={50}
            />
          ) : (
            <>
              <h3 className="truncate text-sm font-semibold">{column.title}</h3>
              {column.is_done_column && (
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400"
                  aria-label="완료 컬럼"
                />
              )}
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                  isOverWipLimit
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                    : columnColor.badge,
                )}
              >
                {wipLimit !== null ? `${tasks.length}/${wipLimit}` : tasks.length}
              </span>
            </>
          )}
        </div>
        {canEdit && !isEditing && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onAddTask(column.id)}
              aria-label="태스크 추가"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {canDeleteColumn && (
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="컬럼 메뉴">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleStartEditing}>
                      <Pencil className="mr-2 h-4 w-4" />
                      이름 변경
                    </DropdownMenuItem>
                    {onSetWipLimit && (
                      <DropdownMenuItem onClick={() => onSetWipLimit(column.id)}>
                        <Gauge className="mr-2 h-4 w-4" />
                        WIP 제한 설정
                      </DropdownMenuItem>
                    )}
                    {onToggleDone && (
                      <DropdownMenuItem
                        onClick={() => onToggleDone(column.id, !column.is_done_column)}
                      >
                        <CheckCircle2
                          className={cn(
                            'mr-2 h-4 w-4',
                            column.is_done_column && 'text-green-600 dark:text-green-400',
                          )}
                        />
                        완료 컬럼으로 지정
                        {column.is_done_column && (
                          <span className="ml-auto text-xs text-green-600 dark:text-green-400">
                            &#10003;
                          </span>
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        컬럼 삭제
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>컬럼을 삭제하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &quot;{column.title}&quot; 컬럼과 포함된 태스크 {tasks.length}개가 모두
                      삭제됩니다.
                      <br />이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDeleteColumn(column.id)}
                    >
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>

      {/* 태스크 목록 (드롭 영역) */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <ScrollArea className="min-h-0 flex-1">
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'min-h-[100px] p-2 transition-colors',
                snapshot.isDraggingOver && 'bg-primary/5',
              )}
            >
              {tasks.length === 0 && !snapshot.isDraggingOver && (
                <p className="text-muted-foreground py-6 text-center text-xs">
                  {canEdit ? '태스크를 추가하거나 여기로 드래그하세요' : '태스크가 없습니다'}
                </p>
              )}
              {tasks.map((task, index) => {
                const taskLabelIds = taskLabelMap?.get(task.id)
                const taskLabelsForCard =
                  taskLabelIds && labels
                    ? labels.filter((l) => taskLabelIds.includes(l.id))
                    : undefined
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onClick={onTaskClick}
                    members={members}
                    isDragDisabled={
                      !canMoveAll && task.assignee_id !== null && task.assignee_id !== currentUserId
                    }
                    taskLabels={taskLabelsForCard}
                    isBlocked={blockedTaskIds?.has(task.id)}
                    isRecurring={recurringTaskIds?.has(task.id)}
                    taskAssignees={taskAssigneeMap?.get(task.id)}
                    subtasks={subtaskMap?.get(task.id)}
                  />
                )
              })}
              {provided.placeholder}
            </div>
          </ScrollArea>
        )}
      </Droppable>
    </div>
  )
})
