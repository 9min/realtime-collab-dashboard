'use client'

import { useRef, useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { Gauge, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'

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
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'
import type { Label } from '@/types/label'

import { TaskCard } from './task-card'

interface KanbanColumnProps {
  column: Tables<'kanban_columns'>
  tasks: Tables<'tasks'>[]
  onAddTask: (columnId: string) => void
  onTaskClick: (task: Tables<'tasks'>) => void
  onRenameColumn: (columnId: string, title: string) => void
  onDeleteColumn: (columnId: string) => void
  onSetWipLimit?: (columnId: string) => void
  canEdit: boolean
  canDeleteColumn: boolean
  canMoveAll: boolean
  currentUserId?: string
  members?: (Tables<'project_members'> & { profiles: Tables<'profiles'> })[]
  labels?: Label[]
  taskLabelMap?: Map<string, string[]>
  blockedTaskIds?: Set<string>
}

export function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onTaskClick,
  onRenameColumn,
  onDeleteColumn,
  onSetWipLimit,
  canEdit,
  canDeleteColumn,
  canMoveAll,
  currentUserId,
  members,
  labels,
  taskLabelMap,
  blockedTaskIds,
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

  return (
    <div className={cn(
      'flex w-72 shrink-0 flex-col overflow-hidden rounded-lg border bg-muted/60 shadow-sm dark:bg-muted/30',
      isOverWipLimit && 'border-red-400 dark:border-red-600',
    )} style={{ height: 'calc(100vh - 220px)', minHeight: 300 }}>
      {/* 컬럼 헤더 */}
      <div className="flex items-center justify-between border-b bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 dark:from-blue-950/30 dark:to-indigo-950/30">
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
              <span className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                isOverWipLimit
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
              )}>
                {wipLimit !== null ? `${tasks.length}/${wipLimit}` : tasks.length}
              </span>
            </>
          )}
        </div>
        {canEdit && !isEditing && (
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddTask(column.id)} aria-label="태스크 추가">
              <Plus className="h-4 w-4" />
            </Button>
            {canDeleteColumn && (
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="컬럼 메뉴">
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
                      &quot;{column.title}&quot; 컬럼과 포함된 태스크 {tasks.length}개가 모두 삭제됩니다.<br />
                      이 작업은 되돌릴 수 없습니다.
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
          <ScrollArea className="flex-1">
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
                const taskLabelsForCard = taskLabelIds && labels
                  ? labels.filter((l) => taskLabelIds.includes(l.id))
                  : undefined
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onClick={onTaskClick}
                    members={members}
                    isDragDisabled={!canMoveAll && task.assignee_id !== null && task.assignee_id !== currentUserId}
                    taskLabels={taskLabelsForCard}
                    isBlocked={blockedTaskIds?.has(task.id)}
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
}
