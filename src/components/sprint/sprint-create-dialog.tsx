'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useCreateSprint, useUpdateSprint } from '@/queries/use-sprints'
import type { Sprint } from '@/types/sprint'

const sprintSchema = z
  .object({
    name: z.string().min(1, '이름을 입력하세요').max(100, '100자 이내로 입력하세요'),
    goal: z.string().max(500, '500자 이내로 입력하세요').optional(),
    start_date: z.string().min(1, '시작일을 선택하세요'),
    end_date: z.string().min(1, '종료일을 선택하세요'),
  })
  .refine((data) => data.end_date > data.start_date, {
    message: '종료일은 시작일 이후여야 합니다',
    path: ['end_date'],
  })

type SprintFormData = z.infer<typeof sprintSchema>

interface SprintCreateDialogProps {
  projectId: string
  sprint?: Sprint
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SprintCreateDialog({
  projectId,
  sprint,
  open,
  onOpenChange,
}: SprintCreateDialogProps) {
  const { user } = useAuth()
  const createMutation = useCreateSprint(projectId)
  const updateMutation = useUpdateSprint(projectId)

  const isEdit = !!sprint
  const isPending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SprintFormData>({
    resolver: zodResolver(sprintSchema),
    defaultValues: {
      name: sprint?.name ?? '',
      goal: sprint?.goal ?? '',
      start_date: sprint?.start_date ?? '',
      end_date: sprint?.end_date ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: sprint?.name ?? '',
        goal: sprint?.goal ?? '',
        start_date: sprint?.start_date ?? '',
        end_date: sprint?.end_date ?? '',
      })
    }
  }, [open, sprint, reset])

  const onSubmit = (data: SprintFormData) => {
    if (isEdit && sprint) {
      updateMutation.mutate(
        {
          sprintId: sprint.id,
          input: {
            name: data.name,
            goal: data.goal || null,
            start_date: data.start_date,
            end_date: data.end_date,
          },
        },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      if (!user?.id) return
      createMutation.mutate(
        {
          project_id: projectId,
          name: data.name,
          goal: data.goal,
          start_date: data.start_date,
          end_date: data.end_date,
          created_by: user.id,
        },
        { onSuccess: () => onOpenChange(false) },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '스프린트 수정' : '새 스프린트'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '스프린트 정보를 수정합니다.' : '새로운 스프린트를 생성합니다.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sprint-name">이름</Label>
            <Input id="sprint-name" placeholder="Sprint 1" {...register('name')} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sprint-goal">목표 (선택)</Label>
            <Textarea
              id="sprint-goal"
              placeholder="이번 스프린트의 목표를 입력하세요"
              rows={3}
              {...register('goal')}
            />
            {errors.goal && <p className="text-destructive text-sm">{errors.goal.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-start">시작일</Label>
              <Input id="sprint-start" type="date" {...register('start_date')} />
              {errors.start_date && (
                <p className="text-destructive text-sm">{errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprint-end">종료일</Label>
              <Input id="sprint-end" type="date" {...register('end_date')} />
              {errors.end_date && (
                <p className="text-destructive text-sm">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '저장 중...' : isEdit ? '수정' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
