'use client'

import { useState } from 'react'
import { Calendar, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useUpdateTask, useDeleteTask } from '@/queries/use-tasks'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'

const PRIORITY_STYLES = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
} as const

const PRIORITY_LABELS = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  urgent: '긴급',
} as const

interface TaskDetailDialogProps {
  projectId: string
  task: Tables<'tasks'> | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailDialog({ projectId, task, open, onOpenChange }: TaskDetailDialogProps) {
  const updateTaskMutation = useUpdateTask(projectId)
  const deleteTaskMutation = useDeleteTask(projectId)

  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState<Tables<'tasks'>['priority']>('medium')
  const [editDueDate, setEditDueDate] = useState('')

  if (!task) return null

  const startEdit = () => {
    setEditTitle(task.title)
    setEditDescription(task.description ?? '')
    setEditPriority(task.priority)
    setEditDueDate(task.due_date ?? '')
    setIsEditing(true)
  }

  const handleSave = () => {
    updateTaskMutation.mutate(
      {
        taskId: task.id,
        input: {
          title: editTitle,
          description: editDescription || undefined,
          priority: editPriority,
          due_date: editDueDate || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false)
          onOpenChange(false)
        },
      },
    )
  }

  const handleDelete = () => {
    deleteTaskMutation.mutate(task.id, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-8">
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-lg font-semibold"
                autoFocus
              />
            ) : (
              task.title
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* 우선순위 */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16 text-sm">우선순위</span>
            {isEditing ? (
              <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Tables<'tasks'>['priority'])}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">낮음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="urgent">긴급</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary" className={cn('text-xs', PRIORITY_STYLES[task.priority])}>
                {PRIORITY_LABELS[task.priority]}
              </Badge>
            )}
          </div>

          {/* 마감일 */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16 text-sm">마감일</span>
            {isEditing ? (
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-40"
              />
            ) : task.due_date ? (
              <span className="flex items-center gap-1 text-sm">
                <Calendar className="h-4 w-4" />
                {new Date(task.due_date).toLocaleDateString('ko-KR')}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">없음</span>
            )}
          </div>

          <Separator />

          {/* 설명 */}
          <div>
            <span className="text-muted-foreground mb-1 block text-sm">설명</span>
            {isEditing ? (
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                placeholder="설명을 입력하세요"
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm">
                {task.description || '설명이 없습니다'}
              </p>
            )}
          </div>

          <Separator />

          {/* 메타 정보 */}
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>
              생성: {new Date(task.created_at).toLocaleDateString('ko-KR')}
            </span>
            <span>
              수정: {new Date(task.updated_at).toLocaleDateString('ko-KR')}
            </span>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-between">
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-1 h-4 w-4" />
              삭제
            </Button>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    취소
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={updateTaskMutation.isPending}>
                    저장
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={startEdit}>
                  편집
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
