'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface WipLimitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columnTitle: string
  currentLimit: number | null
  onSave: (limit: number | null) => void
  isPending?: boolean
}

export function WipLimitDialog({
  open,
  onOpenChange,
  columnTitle,
  currentLimit,
  onSave,
  isPending = false,
}: WipLimitDialogProps) {
  const [hasLimit, setHasLimit] = useState(currentLimit !== null)
  const [limitValue, setLimitValue] = useState(currentLimit?.toString() ?? '5')

  const handleSave = () => {
    if (!hasLimit) {
      onSave(null)
    } else {
      const parsed = parseInt(limitValue, 10)
      if (isNaN(parsed) || parsed < 1) return
      onSave(parsed)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>WIP 제한 설정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-muted-foreground text-sm">
            &quot;{columnTitle}&quot; 컬럼의 최대 태스크 수를 설정합니다.
          </p>
          <div className="flex items-center justify-between">
            <Label htmlFor="wip-toggle">WIP 제한 활성화</Label>
            <Switch
              id="wip-toggle"
              checked={hasLimit}
              onCheckedChange={setHasLimit}
            />
          </div>
          {hasLimit && (
            <div className="space-y-1.5">
              <Label htmlFor="wip-limit-input">최대 태스크 수</Label>
              <Input
                id="wip-limit-input"
                type="number"
                min={1}
                max={100}
                value={limitValue}
                onChange={(e) => setLimitValue(e.target.value)}
                className="w-24"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
