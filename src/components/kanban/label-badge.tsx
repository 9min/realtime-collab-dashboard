'use client'

import { cn } from '@/lib/utils'
import type { Label } from '@/types/label'

interface LabelBadgeProps {
  label: Label
  size?: 'sm' | 'md'
  className?: string
}

export function LabelBadge({ label, size = 'md', className }: LabelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        className,
      )}
      style={{
        backgroundColor: `${label.color}20`,
        color: label.color,
        border: `1px solid ${label.color}40`,
      }}
    >
      {label.name}
    </span>
  )
}
