import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from './button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8', className)}>
      <Icon className="text-muted-foreground h-12 w-12" />
      <div className="text-center">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      {action && (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
