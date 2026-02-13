'use client'

import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CUSTOM_FIELD_TYPE } from '@/types/custom-field'
import type { CustomFieldDefinition } from '@/types/custom-field'

interface CustomFieldRendererProps {
  field: CustomFieldDefinition
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
}

export function CustomFieldRenderer({
  field,
  value,
  onChange,
  disabled = false,
}: CustomFieldRendererProps) {
  switch (field.field_type) {
    case CUSTOM_FIELD_TYPE.TEXT:
      return (
        <Input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={field.name}
          disabled={disabled}
          className="h-8"
        />
      )

    case CUSTOM_FIELD_TYPE.NUMBER:
      return (
        <Input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={field.name}
          disabled={disabled}
          className="h-8"
        />
      )

    case CUSTOM_FIELD_TYPE.SELECT:
      return (
        <Select value={value ?? ''} onValueChange={(v) => onChange(v || null)} disabled={disabled}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder={`${field.name} 선택`} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case CUSTOM_FIELD_TYPE.DATE:
      return (
        <Input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className="h-8"
        />
      )

    case CUSTOM_FIELD_TYPE.CHECKBOX:
      return (
        <Checkbox
          checked={value === 'true'}
          onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
          disabled={disabled}
        />
      )

    default:
      return null
  }
}
