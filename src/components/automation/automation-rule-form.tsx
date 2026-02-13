'use client'

import { useForm, Controller, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useCreateAutomationRule, useUpdateAutomationRule } from '@/queries/use-automations'
import { TRIGGER_TYPE, ACTION_TYPE, TRIGGER_LABELS, ACTION_LABELS } from '@/types/automation'
import type { AutomationRule } from '@/types/automation'
import { TriggerConfigForm } from '@/components/automation/trigger-config-form'
import { ActionConfigForm } from '@/components/automation/action-config-form'

const ruleSchema = z
  .object({
    name: z.string().min(1, '이름을 입력해주세요').max(100, '이름은 100자 이내'),
    trigger_type: z.string().min(1, '트리거를 선택해주세요'),
    action_type: z.string().min(1, '액션을 선택해주세요'),
    trigger_config: z.record(z.string(), z.unknown()).default({}),
    action_config: z.record(z.string(), z.unknown()).default({}),
  })
  .refine(
    (data) => {
      // 트리거 config 필수값 검증
      if (data.trigger_type === 'task_moved_to_column' && !data.trigger_config.column_id)
        return false
      if (data.trigger_type === 'priority_changed' && !data.trigger_config.to_priority) return false
      return true
    },
    { message: '트리거 설정을 완료해주세요', path: ['trigger_config'] },
  )
  .refine(
    (data) => {
      // 액션 config 필수값 검증
      if (data.action_type === 'set_priority' && !data.action_config.priority) return false
      if (data.action_type === 'move_to_column' && !data.action_config.column_id) return false
      return true
    },
    { message: '액션 설정을 완료해주세요', path: ['action_config'] },
  )

type RuleFormData = z.infer<typeof ruleSchema>

interface AutomationRuleFormProps {
  projectId: string
  rule?: AutomationRule
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AutomationRuleForm({
  projectId,
  rule,
  open,
  onOpenChange,
}: AutomationRuleFormProps) {
  const { user } = useAuth()
  const createMutation = useCreateAutomationRule(projectId)
  const updateMutation = useUpdateAutomationRule(projectId)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema) as Resolver<RuleFormData>,
    defaultValues: {
      name: rule?.name ?? '',
      trigger_type: rule?.trigger_type ?? '',
      action_type: rule?.action_type ?? '',
      trigger_config: rule?.trigger_config ?? {},
      action_config: rule?.action_config ?? {},
    },
  })

  const triggerType = watch('trigger_type')
  const actionType = watch('action_type')
  const triggerConfig = watch('trigger_config')
  const actionConfig = watch('action_config')

  const isEditing = !!rule
  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: RuleFormData) => {
    if (!user) return

    if (isEditing) {
      updateMutation.mutate(
        {
          ruleId: rule.id,
          input: {
            name: data.name,
            trigger_type: data.trigger_type,
            trigger_config: data.trigger_config,
            action_type: data.action_type,
            action_config: data.action_config,
          },
        },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      createMutation.mutate(
        {
          project_id: projectId,
          created_by: user.id,
          name: data.name,
          trigger_type: data.trigger_type,
          trigger_config: data.trigger_config,
          action_type: data.action_type,
          action_config: data.action_config,
        },
        { onSuccess: () => onOpenChange(false) },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? '규칙 편집' : '자동화 규칙 추가'}</DialogTitle>
          <DialogDescription>트리거 조건과 실행할 액션을 설정합니다.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* 이름 */}
          <div className="space-y-1.5">
            <Label htmlFor="rule-name">규칙 이름</Label>
            <Input
              id="rule-name"
              placeholder="예: 완료 시 우선순위 낮춤"
              {...register('name')}
              autoFocus
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          {/* 트리거 타입 */}
          <div className="space-y-1.5">
            <Label>트리거</Label>
            <Controller
              control={control}
              name="trigger_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="트리거 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TRIGGER_TYPE).map((type) => (
                      <SelectItem key={type} value={type}>
                        {TRIGGER_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.trigger_type && (
              <p className="text-destructive text-xs">{errors.trigger_type.message}</p>
            )}
          </div>

          {/* 트리거 설정 */}
          {triggerType && (
            <TriggerConfigForm
              triggerType={triggerType}
              config={triggerConfig}
              onChange={(config) => setValue('trigger_config', config)}
              projectId={projectId}
            />
          )}

          {/* 액션 타입 */}
          <div className="space-y-1.5">
            <Label>액션</Label>
            <Controller
              control={control}
              name="action_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="액션 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ACTION_TYPE).map((type) => (
                      <SelectItem key={type} value={type}>
                        {ACTION_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.action_type && (
              <p className="text-destructive text-xs">{errors.action_type.message}</p>
            )}
          </div>

          {/* 액션 설정 */}
          {actionType && (
            <ActionConfigForm
              actionType={actionType}
              config={actionConfig}
              onChange={(config) => setValue('action_config', config)}
              projectId={projectId}
            />
          )}

          {errors.trigger_config?.root && (
            <p className="text-destructive text-xs">{errors.trigger_config.root.message}</p>
          )}
          {errors.action_config?.root && (
            <p className="text-destructive text-xs">{errors.action_config.root.message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '저장 중...' : isEditing ? '수정' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
