'use client'

import { BarChart3, Clock, PieChart, Star, TrendingDown, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WIDGET_TYPE } from '@/lib/constants'
import type { WidgetType } from '@/types/common'
import { WIDGET_REGISTRY } from '@/types/dashboard'

interface AddWidgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (type: WidgetType) => void
  existingTypes: WidgetType[]
}

const WIDGET_ICONS: Record<string, typeof PieChart> = {
  [WIDGET_TYPE.TASK_STATUS]: PieChart,
  [WIDGET_TYPE.WEEKLY_PROGRESS]: BarChart3,
  [WIDGET_TYPE.BURNDOWN]: TrendingDown,
  [WIDGET_TYPE.MEMBER_LIST]: Users,
  [WIDGET_TYPE.MY_FAVORITES]: Star,
  [WIDGET_TYPE.TIME_REPORT]: Clock,
}

export function AddWidgetDialog({
  open,
  onOpenChange,
  onAdd,
  existingTypes,
}: AddWidgetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>위젯 추가</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {WIDGET_REGISTRY.map((widget) => {
            const Icon = WIDGET_ICONS[widget.type] ?? PieChart
            const isAdded = existingTypes.includes(widget.type)

            return (
              <Card
                key={widget.type}
                className={
                  isAdded
                    ? 'cursor-not-allowed opacity-60'
                    : 'hover:border-primary hover:bg-accent/30 cursor-pointer transition-colors'
                }
              >
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
                  <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm">{widget.title}</CardTitle>
                    <CardDescription className="text-xs">{widget.description}</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant={isAdded ? 'outline' : 'default'}
                    disabled={isAdded}
                    onClick={() => {
                      onAdd(widget.type)
                      onOpenChange(false)
                    }}
                  >
                    {isAdded ? '추가됨' : '추가'}
                  </Button>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
