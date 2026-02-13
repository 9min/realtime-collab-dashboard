'use client'

import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useCreateTaskTemplate, useUpdateTaskTemplate } from '@/queries/use-task-templates'
import type { TaskTemplate } from '@/types/task-template'

const templateSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(100, '이름은 100자 이내'),
  description_template: z.string().max(2000, '설명은 2000자 이내').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  subtasks: z.array(
    z.object({
      title: z.string().min(1, '서브태스크 제목을 입력해주세요'),
    }),
  ),
  is_personal: z.boolean(),
})

type TemplateFormData = z.infer<typeof templateSchema>

interface TemplateFormProps {
  projectId: string
  template?: TaskTemplate
  onSuccess: () => void
  onCancel: () => void
}

export function TemplateForm({ projectId, template, onSuccess, onCancel }: TemplateFormProps) {
  const { user } = useAuth()
  const createMutation = useCreateTaskTemplate(projectId)
  const updateMutation = useUpdateTaskTemplate(projectId)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name ?? '',
      description_template: template?.description_template ?? '',
      priority: template?.priority ?? 'medium',
      subtasks: template?.subtasks_template?.map((st) => ({ title: st.title })) ?? [],
      is_personal: template?.is_personal ?? false,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'subtasks',
  })

  const isEditing = !!template
  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: TemplateFormData) => {
    if (!user) return

    const subtasksTemplate = data.subtasks.map((st, index) => ({
      title: st.title,
      position: index,
    }))

    if (isEditing) {
      updateMutation.mutate(
        {
          templateId: template.id,
          input: {
            name: data.name,
            description_template: data.description_template || null,
            priority: data.priority,
            subtasks_template: subtasksTemplate,
            is_personal: data.is_personal,
          },
        },
        { onSuccess },
      )
    } else {
      createMutation.mutate(
        {
          project_id: projectId,
          created_by: user.id,
          name: data.name,
          description_template: data.description_template,
          priority: data.priority,
          subtasks_template: subtasksTemplate,
          is_personal: data.is_personal,
        },
        { onSuccess },
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* 이름 */}
      <div className="space-y-1.5">
        <Label htmlFor="template-name">템플릿 이름</Label>
        <Input id="template-name" placeholder="예: 버그 리포트" {...register('name')} autoFocus />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      {/* 설명 */}
      <div className="space-y-1.5">
        <Label htmlFor="template-description">설명 템플릿</Label>
        <Textarea
          id="template-description"
          placeholder="태스크 생성 시 자동 입력될 설명 (선택)"
          rows={3}
          {...register('description_template')}
        />
        {errors.description_template && (
          <p className="text-destructive text-xs">{errors.description_template.message}</p>
        )}
      </div>

      {/* 우선순위 */}
      <div className="space-y-1.5">
        <Label>기본 우선순위</Label>
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
      </div>

      {/* 서브태스크 */}
      <div className="space-y-2">
        <Label>서브태스크 템플릿</Label>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              placeholder={`서브태스크 ${index + 1}`}
              {...register(`subtasks.${index}.title`)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive h-8 w-8 shrink-0"
              onClick={() => remove(index)}
              aria-label="서브태스크 삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => append({ title: '' })}
        >
          <Plus className="h-3 w-3" />
          서브태스크 추가
        </Button>
      </div>

      {/* 개인 템플릿 */}
      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="is_personal"
          render={({ field }) => (
            <Checkbox
              id="template-personal"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="template-personal" className="text-sm font-normal">
          개인 템플릿 (나에게만 표시)
        </Label>
      </div>

      {/* 제출 */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? '저장 중...' : isEditing ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  )
}
