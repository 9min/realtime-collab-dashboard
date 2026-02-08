'use client'

import { useState } from 'react'
import { Calendar, Trash2, User } from 'lucide-react'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useProjectMembers } from '@/queries/use-projects'
import { useUpdateTask, useDeleteTask } from '@/queries/use-tasks'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'

const UNASSIGNED_VALUE = '__none__'

import { AttachmentSection } from './attachment-section'
import { CommentSection } from './comment-section'

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
  canEdit?: boolean
  canDeleteAll?: boolean
}

export function TaskDetailDialog({ projectId, task, open, onOpenChange, canEdit = true, canDeleteAll = false }: TaskDetailDialogProps) {
  const updateTaskMutation = useUpdateTask(projectId)
  const deleteTaskMutation = useDeleteTask(projectId)
  const { data: members } = useProjectMembers(projectId)

  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState<Tables<'tasks'>['priority']>('medium')
  const [editAssigneeId, setEditAssigneeId] = useState('')
  const [editDueDate, setEditDueDate] = useState('')

  if (!task) return null

  const assigneeProfile = task.assignee_id
    ? members?.find((m) => m.user_id === task.assignee_id)?.profiles
    : null

  const startEdit = () => {
    setEditTitle(task.title)
    setEditDescription(task.description ?? '')
    setEditPriority(task.priority)
    setEditAssigneeId(task.assignee_id ?? '')
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
          assignee_id: editAssigneeId || null,
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) setIsEditing(false); onOpenChange(v) }}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-xl">
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

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-2">
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

          {/* 담당자 */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16 text-sm">담당자</span>
            {isEditing ? (
              <Select
                value={editAssigneeId || UNASSIGNED_VALUE}
                onValueChange={(v) => setEditAssigneeId(v === UNASSIGNED_VALUE ? '' : v)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED_VALUE}>미배정</SelectItem>
                  {members?.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profiles.full_name ?? m.profiles.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : assigneeProfile ? (
              <span className="flex items-center gap-1 text-sm">
                <User className="h-4 w-4" />
                {assigneeProfile.full_name ?? assigneeProfile.email}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">미배정</span>
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
                placeholder="설명을 입력하세요"
                rows={4}
                className="resize-none"
              />
            ) : task.description ? (
              <MarkdownRenderer content={task.description} className="text-sm" />
            ) : (
              <p className="text-muted-foreground text-sm">설명이 없습니다</p>
            )}
          </div>

          <Separator />

          {/* 첨부파일 섹션 */}
          <AttachmentSection
            taskId={task.id}
            projectId={projectId}
            canUpload={canEdit}
            canDeleteAll={canDeleteAll}
          />

          <Separator />

          {/* 댓글 섹션 */}
          <CommentSection
            taskId={task.id}
            projectId={projectId}
            canComment={canEdit}
            canDeleteAll={canDeleteAll}
          />

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

          {/* 액션 버튼 — 뷰어에게 숨김 */}
          {canEdit && (
            <div className="flex justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-1 h-4 w-4" />
                    삭제
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>태스크를 삭제하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &quot;{task.title}&quot; 태스크가 삭제됩니다.<br />이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDelete}
                    >
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
