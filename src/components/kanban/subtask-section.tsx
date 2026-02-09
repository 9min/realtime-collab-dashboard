'use client'

import { useState } from 'react'
import { CheckSquare, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useSubtasks, useCreateSubtask, useUpdateSubtask, useDeleteSubtask } from '@/queries/use-subtasks'

interface SubtaskSectionProps {
  taskId: string
  projectId: string
  canEdit: boolean
}

export function SubtaskSection({ taskId, projectId, canEdit }: SubtaskSectionProps) {
  const { user } = useAuth()
  const { data: subtasks, isLoading } = useSubtasks(taskId)
  const createMutation = useCreateSubtask(taskId)
  const updateMutation = useUpdateSubtask(taskId)
  const deleteMutation = useDeleteSubtask(taskId)

  const [newTitle, setNewTitle] = useState('')
  const [showInput, setShowInput] = useState(false)

  const completedCount = subtasks?.filter((s) => s.completed).length ?? 0
  const totalCount = subtasks?.length ?? 0
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleAdd = () => {
    const trimmed = newTitle.trim()
    if (!trimmed || !user) return

    createMutation.mutate(
      {
        task_id: taskId,
        project_id: projectId,
        title: trimmed,
        position: totalCount,
        created_by: user.id,
      },
      {
        onSuccess: () => {
          setNewTitle('')
        },
      },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    } else if (e.key === 'Escape') {
      setShowInput(false)
      setNewTitle('')
    }
  }

  const handleToggle = (subtaskId: string, completed: boolean) => {
    updateMutation.mutate({ subtaskId, input: { completed } })
  }

  const handleDelete = (subtaskId: string) => {
    deleteMutation.mutate(subtaskId)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="bg-muted h-5 w-32 animate-pulse rounded" />
        <div className="bg-muted h-8 animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">
            서브태스크 ({completedCount}/{totalCount})
          </span>
        </div>
        {canEdit && !showInput && (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setShowInput(true)}>
            <Plus className="h-3 w-3" />
            추가
          </Button>
        )}
      </div>

      {/* 진행률 바 */}
      {totalCount > 0 && (
        <Progress value={progressPercent} className="h-1.5" />
      )}

      {/* 서브태스크 목록 */}
      {subtasks && subtasks.length > 0 && (
        <ul className="space-y-1">
          {subtasks.map((subtask) => (
            <li
              key={subtask.id}
              className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-accent/50"
            >
              <Checkbox
                checked={subtask.completed}
                onCheckedChange={(checked) => handleToggle(subtask.id, checked === true)}
                disabled={!canEdit}
                aria-label={`${subtask.title} 완료 토글`}
              />
              <span
                className={cn(
                  'flex-1 text-sm',
                  subtask.completed && 'text-muted-foreground line-through',
                )}
              >
                {subtask.title}
              </span>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(subtask.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 인라인 추가 입력 */}
      {showInput && canEdit && (
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="서브태스크 제목..."
            className="h-8 text-sm"
            autoFocus
            maxLength={200}
          />
          <Button size="sm" className="h-8" onClick={handleAdd} disabled={createMutation.isPending || !newTitle.trim()}>
            추가
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => {
              setShowInput(false)
              setNewTitle('')
            }}
          >
            취소
          </Button>
        </div>
      )}
    </div>
  )
}
