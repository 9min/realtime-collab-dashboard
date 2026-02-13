'use client'

import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCreateTimeEntry } from '@/queries/use-time-entries'
import { useAuth } from '@/hooks/use-auth'

const timeEntryBaseSchema = z.object({
  hours: z.coerce.number().int().min(0, '0 이상'),
  minutes: z.coerce.number().int().min(0, '0 이상').max(59, '59 이하'),
  description: z.string().optional(),
})

const timeEntrySchema = timeEntryBaseSchema.refine((data) => data.hours > 0 || data.minutes > 0, {
  message: '시간을 입력해주세요',
  path: ['minutes'],
})

type TimeEntryFormValues = z.infer<typeof timeEntryBaseSchema>

interface TimeEntryFormProps {
  taskId: string
  projectId: string
  onSuccess?: () => void
}

export function TimeEntryForm({ taskId, projectId, onSuccess }: TimeEntryFormProps) {
  const { user } = useAuth()
  const createTimeEntry = useCreateTimeEntry(projectId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema) as Resolver<TimeEntryFormValues>,
    defaultValues: {
      hours: 0,
      minutes: 30,
      description: '',
    },
  })

  const onSubmit = (values: TimeEntryFormValues) => {
    if (!user) return

    const durationMinutes = values.hours * 60 + values.minutes
    createTimeEntry.mutate(
      {
        task_id: taskId,
        project_id: projectId,
        user_id: user.id,
        duration_minutes: durationMinutes,
        description: values.description || undefined,
      },
      {
        onSuccess: () => {
          reset()
          onSuccess?.()
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="hours" className="text-muted-foreground text-xs">
            시간
          </label>
          <Input id="hours" type="number" min={0} className="h-8" {...register('hours')} />
          {errors.hours && <p className="text-destructive mt-1 text-xs">{errors.hours.message}</p>}
        </div>
        <div className="flex-1">
          <label htmlFor="minutes" className="text-muted-foreground text-xs">
            분
          </label>
          <Input
            id="minutes"
            type="number"
            min={0}
            max={59}
            className="h-8"
            {...register('minutes')}
          />
          {errors.minutes && (
            <p className="text-destructive mt-1 text-xs">{errors.minutes.message}</p>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="description" className="text-muted-foreground text-xs">
          설명 (선택)
        </label>
        <Textarea
          id="description"
          className="h-16 resize-none"
          placeholder="작업 내용을 입력하세요"
          {...register('description')}
        />
      </div>
      <Button type="submit" size="sm" className="w-full" disabled={createTimeEntry.isPending}>
        {createTimeEntry.isPending ? '기록 중...' : '시간 기록'}
      </Button>
    </form>
  )
}
