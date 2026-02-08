'use client'

import { useRef, useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'

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

import { TaskCard } from './task-card'

interface KanbanColumnProps {
  column: Tables<'kanban_columns'>
  tasks: Tables<'tasks'>[]
  onAddTask: (columnId: string) => void
  onTaskClick: (task: Tables<'tasks'>) => void
  onRenameColumn: (columnId: string, title: string) => void
  onDeleteColumn: (columnId: string) => void
  canEdit: boolean
  canDeleteColumn: boolean
  canMoveAll: boolean
  currentUserId?: string
  members?: (Tables<'project_members'> & { profiles: Tables<'profiles'> })[]
}

export function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onTaskClick,
  onRenameColumn,
  onDeleteColumn,
  canEdit,
  canDeleteColumn,
  canMoveAll,
  currentUserId,
  members,
}: KanbanColumnProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(column.title)
  const inputRef = useRef<HTMLInputElement>(null)

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
    <div className="bg-card flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-lg border shadow-sm">
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
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                {tasks.length}
              </span>
            </>
          )}
        </div>
        {canEdit && !isEditing && (
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddTask(column.id)}>
              <Plus className="h-4 w-4" />
            </Button>
            {canDeleteColumn && (
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleStartEditing}>
                      <Pencil className="mr-2 h-4 w-4" />
                      이름 변경
                    </DropdownMenuItem>
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
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onClick={onTaskClick}
                  members={members}
                  isDragDisabled={!canMoveAll && task.assignee_id !== null && task.assignee_id !== currentUserId}
                />
              ))}
              {provided.placeholder}
            </div>
          </ScrollArea>
        )}
      </Droppable>
    </div>
  )
}
