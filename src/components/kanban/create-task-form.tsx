'use client'

import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

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
import { useAuth } from '@/hooks/use-auth'
import { useProjectMembers } from '@/queries/use-projects'
import { useCreateTask, useTasks } from '@/queries/use-tasks'

// 폼 스키마
const UNASSIGNED_VALUE = '__none__'

const createTaskSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 100자 이내'),
  description: z.string().max(500, '설명은 500자 이내').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignee_id: z.string().optional(),
  due_date: z.string().optional(),
})

type CreateTaskFormData = z.infer<typeof createTaskSchema>

interface CreateTaskFormProps {
  projectId: string
  columnId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTaskForm({ projectId, columnId, open, onOpenChange }: CreateTaskFormProps) {
  const { user } = useAuth()
  const createTaskMutation = useCreateTask(projectId)
  const { data: tasks } = useTasks(projectId)
  const { data: members } = useProjectMembers(projectId)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      assignee_id: '',
      due_date: '',
    },
  })

  const onSubmit = (data: CreateTaskFormData) => {
    if (!columnId || !user) return

    // 해당 컬럼의 마지막 위치 계산
    const columnTasks = tasks?.filter((t) => t.column_id === columnId) ?? []
    const nextPosition = columnTasks.length

    createTaskMutation.mutate(
      {
        project_id: projectId,
        column_id: columnId,
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        assignee_id: data.assignee_id || undefined,
        position: nextPosition,
        due_date: data.due_date || undefined,
        created_by: user.id,
      },
      {
        onSuccess: () => {
          reset()
          onOpenChange(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 태스크 생성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* 제목 */}
          <div>
            <Input placeholder="태스크 제목" {...register('title')} autoFocus />
            {errors.title && (
              <p className="text-destructive mt-1 text-xs">{errors.title.message}</p>
            )}
          </div>

          {/* 설명 */}
          <div>
            <Textarea placeholder="설명 (선택)" rows={3} {...register('description')} />
            {errors.description && (
              <p className="text-destructive mt-1 text-xs">{errors.description.message}</p>
            )}
          </div>

          {/* 우선순위 */}
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="우선순위" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">낮음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="urgent">긴급</SelectItem>
                </SelectContent>
              </Select>
            )}
          />

          {/* 담당자 */}
          <Controller
            control={control}
            name="assignee_id"
            render={({ field }) => (
              <Select
                value={field.value || UNASSIGNED_VALUE}
                onValueChange={(v) => field.onChange(v === UNASSIGNED_VALUE ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="담당자 (선택)" />
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
            )}
          />

          {/* 마감일 */}
          <div>
            <Input type="date" {...register('due_date')} />
          </div>

          {/* 제출 */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? '생성 중...' : '생성'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
