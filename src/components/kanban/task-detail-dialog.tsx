'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Columns3, Trash2, User } from 'lucide-react'

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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { useAuth } from '@/hooks/use-auth'
import { useProjectMembers } from '@/queries/use-projects'
import { useUpdateTask, useDeleteTask } from '@/queries/use-tasks'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/database'

const UNASSIGNED_VALUE = '__none__'

import { AttachmentSection } from './attachment-section'
import { FavoriteButton } from './favorite-button'
import { CommentSection } from './comment-section'
import { DependencySection } from './dependency-section'
import { LabelBadge } from './label-badge'
import { LabelPicker } from './label-picker'
import { RecurrenceSection } from './recurrence-section'
import { SubtaskSection } from './subtask-section'

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

interface ProjectFeatures {
  feature_labels: boolean
  feature_subtasks: boolean
  feature_dependencies: boolean
  feature_attachments: boolean
  feature_comments: boolean
}

interface TaskDetailDialogProps {
  projectId: string
  task: Tables<'tasks'> | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canEdit?: boolean
  canDeleteAll?: boolean
  labels?: Tables<'labels'>[]
  taskLabelIds?: string[]
  projectFeatures?: ProjectFeatures
}

export function TaskDetailDialog({ projectId, task, open, onOpenChange, canEdit = true, canDeleteAll = false, labels, taskLabelIds, projectFeatures }: TaskDetailDialogProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const updateTaskMutation = useUpdateTask(projectId)
  const deleteTaskMutation = useDeleteTask(projectId)
  const { data: members } = useProjectMembers(projectId)
  const isOnBoardPage = pathname.includes(`/projects/${projectId}/board`)

  // 담당자 기반 권한: 담당자 없으면 모든 멤버 가능, 있으면 owner/admin/담당자만
  const canInteract = canDeleteAll || (canEdit && (task?.assignee_id === null || task?.assignee_id === user?.id))

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
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-xl" onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).focus() }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-lg font-semibold"
                autoFocus
              />
            ) : (
              <>
                <span className="min-w-0 break-words">{task.title}</span>
                <FavoriteButton taskId={task.id} size="default" />
              </>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">태스크 상세 정보</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-2">
          {/* 칸반 보드 이동 링크 */}
          {!isOnBoardPage && (
            <Link
              href={`/projects/${projectId}/board?taskId=${task.id}`}
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400 dark:hover:bg-blue-900/50"
              onClick={() => onOpenChange(false)}
            >
              <Columns3 className="h-3 w-3" />
              칸반 보드에서 보기
            </Link>
          )}

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

          {/* 라벨 */}
          {projectFeatures?.feature_labels !== false && labels && labels.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16 text-sm">라벨</span>
              <div className="flex flex-wrap items-center gap-1">
                {taskLabelIds && taskLabelIds.length > 0 ? (
                  labels
                    .filter((l) => taskLabelIds.includes(l.id))
                    .map((l) => <LabelBadge key={l.id} label={l} />)
                ) : (
                  <span className="text-muted-foreground text-sm">없음</span>
                )}
                <LabelPicker
                  projectId={projectId}
                  taskId={task.id}
                  assignedLabelIds={taskLabelIds ?? []}
                  canEdit={canInteract}
                />
              </div>
            </div>
          )}

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

          {/* 서브태스크 섹션 */}
          {projectFeatures?.feature_subtasks !== false && (
            <>
              <SubtaskSection
                taskId={task.id}
                projectId={projectId}
                canEdit={canInteract}
              />
              <Separator />
            </>
          )}

          {/* 의존성 섹션 */}
          {projectFeatures?.feature_dependencies !== false && (
            <>
              <DependencySection
                taskId={task.id}
                projectId={projectId}
                canEdit={canInteract}
              />
              <Separator />
            </>
          )}

          {/* 반복 설정 */}
          <RecurrenceSection
            taskId={task.id}
            projectId={projectId}
            canEdit={canInteract}
          />
          <Separator />

          {/* 첨부파일 섹션 */}
          {projectFeatures?.feature_attachments !== false && (
            <>
              <AttachmentSection
                taskId={task.id}
                projectId={projectId}
                canUpload={canEdit}
                canDeleteAll={canDeleteAll}
              />
              <Separator />
            </>
          )}

          {/* 댓글 섹션 */}
          {projectFeatures?.feature_comments !== false && (
            <>
              <CommentSection
                taskId={task.id}
                projectId={projectId}
                canComment={canEdit}
                canDeleteAll={canDeleteAll}
              />
              <Separator />
            </>
          )}

          {/* 메타 정보 */}
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>
              생성: {new Date(task.created_at).toLocaleDateString('ko-KR')}
            </span>
            <span>
              수정: {new Date(task.updated_at).toLocaleDateString('ko-KR')}
            </span>
          </div>

          {/* 액션 버튼 — 권한 있는 유저에게만 노출 */}
          {canInteract && (
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
