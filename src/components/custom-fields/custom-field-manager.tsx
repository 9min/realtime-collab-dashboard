'use client'

import { useState, useCallback } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCustomFieldDefinitions,
  useCreateCustomField,
  useUpdateCustomField,
  useDeleteCustomField,
} from '@/queries/use-custom-fields'
import { CUSTOM_FIELD_TYPE } from '@/types/custom-field'
import type { CustomFieldDefinition, CustomFieldType } from '@/types/custom-field'

const MAX_CUSTOM_FIELDS = 20

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  [CUSTOM_FIELD_TYPE.TEXT]: '텍스트',
  [CUSTOM_FIELD_TYPE.NUMBER]: '숫자',
  [CUSTOM_FIELD_TYPE.SELECT]: '선택',
  [CUSTOM_FIELD_TYPE.DATE]: '날짜',
  [CUSTOM_FIELD_TYPE.CHECKBOX]: '체크박스',
}

interface CustomFieldManagerProps {
  projectId: string
}

interface FieldFormState {
  name: string
  field_type: CustomFieldType
  options: string
  is_required: boolean
}

const INITIAL_FORM_STATE: FieldFormState = {
  name: '',
  field_type: CUSTOM_FIELD_TYPE.TEXT,
  options: '',
  is_required: false,
}

export function CustomFieldManager({ projectId }: CustomFieldManagerProps) {
  const { data: definitions, isLoading } = useCustomFieldDefinitions(projectId)
  const createMutation = useCreateCustomField(projectId)
  const updateMutation = useUpdateCustomField(projectId)
  const deleteMutation = useDeleteCustomField(projectId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null)
  const [form, setForm] = useState<FieldFormState>(INITIAL_FORM_STATE)

  const openCreateDialog = useCallback(() => {
    setEditingField(null)
    setForm(INITIAL_FORM_STATE)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((field: CustomFieldDefinition) => {
    setEditingField(field)
    setForm({
      name: field.name,
      field_type: field.field_type,
      options: (field.options ?? []).join(', '),
      is_required: field.is_required,
    })
    setDialogOpen(true)
  }, [])

  const handleSubmit = useCallback(() => {
    const parsedOptions =
      form.field_type === CUSTOM_FIELD_TYPE.SELECT
        ? form.options
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined

    if (editingField) {
      updateMutation.mutate(
        {
          fieldId: editingField.id,
          input: {
            name: form.name,
            options: parsedOptions ?? null,
            is_required: form.is_required,
          },
        },
        { onSuccess: () => setDialogOpen(false) },
      )
    } else {
      createMutation.mutate(
        {
          project_id: projectId,
          name: form.name,
          field_type: form.field_type,
          options: parsedOptions,
          is_required: form.is_required,
        },
        { onSuccess: () => setDialogOpen(false) },
      )
    }
  }, [form, editingField, projectId, createMutation, updateMutation])

  const handleDelete = useCallback(
    (fieldId: string) => {
      deleteMutation.mutate(fieldId)
    },
    [deleteMutation],
  )

  const parsedSelectOptions =
    form.field_type === CUSTOM_FIELD_TYPE.SELECT
      ? form.options
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : []

  const isFormValid =
    form.name.trim().length > 0 &&
    form.name.trim().length <= 50 &&
    (form.field_type !== CUSTOM_FIELD_TYPE.SELECT || parsedSelectOptions.length > 0)

  const canAddMore = (definitions?.length ?? 0) < MAX_CUSTOM_FIELDS

  if (isLoading) {
    return <Skeleton className="h-20" />
  }

  return (
    <>
      <div className="space-y-3">
        {definitions && definitions.length > 0 && (
          <div className="space-y-2">
            {definitions.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{field.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {FIELD_TYPE_LABELS[field.field_type]}
                  </Badge>
                  {field.is_required && (
                    <Badge variant="destructive" className="text-xs">
                      필수
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(field)}
                    aria-label="필드 편집"
                  >
                    <PencilIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive h-8 w-8"
                    onClick={() => handleDelete(field.id)}
                    aria-label="필드 삭제"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!canAddMore && (
          <p className="text-muted-foreground text-xs">
            최대 {MAX_CUSTOM_FIELDS}개의 커스텀 필드만 추가할 수 있습니다.
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={openCreateDialog}
          disabled={!canAddMore}
        >
          <PlusIcon className="h-3 w-3" />
          필드 추가
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? '커스텀 필드 수정' : '커스텀 필드 추가'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cf-name">필드 이름</Label>
              <Input
                id="cf-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="예: 스프린트 포인트"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cf-type">필드 타입</Label>
              <Select
                value={form.field_type}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, field_type: v as CustomFieldType }))
                }
                disabled={!!editingField}
              >
                <SelectTrigger id="cf-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.field_type === CUSTOM_FIELD_TYPE.SELECT && (
              <div className="space-y-2">
                <Label htmlFor="cf-options">옵션 (쉼표로 구분)</Label>
                <Input
                  id="cf-options"
                  value={form.options}
                  onChange={(e) => setForm((prev) => ({ ...prev, options: e.target.value }))}
                  placeholder="예: 옵션1, 옵션2, 옵션3"
                />
                {form.options.trim().length > 0 && parsedSelectOptions.length === 0 && (
                  <p className="text-destructive text-xs">최소 1개의 옵션을 입력해주세요</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="cf-required"
                checked={form.is_required}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, is_required: checked === true }))
                }
              />
              <Label htmlFor="cf-required" className="text-sm">
                필수 필드
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || createMutation.isPending || updateMutation.isPending}
            >
              {editingField ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
