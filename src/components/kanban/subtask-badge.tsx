'use client'

import { useMemo } from 'react'
import { CheckSquare } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Progress } from '@/components/ui/progress'
import type { Tables } from '@/types/database'

interface SubtaskBadgeProps {
  subtasks: Tables<'subtasks'>[]
}

export function SubtaskBadge({ subtasks }: SubtaskBadgeProps) {
  const { completed, total, percent } = useMemo(() => {
    const t = subtasks.length
    const c = subtasks.filter((s) => s.completed).length
    return { completed: c, total: t, percent: t > 0 ? Math.round((c / t) * 100) : 0 }
  }, [subtasks])

  if (total === 0) return null

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span
          className={cn(
            'text-muted-foreground inline-flex shrink-0 cursor-default items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium',
            completed === total
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
              : 'bg-muted',
          )}
        >
          <CheckSquare className="h-3 w-3" />
          {completed}/{total}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="start"
        className="w-56 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between text-xs font-medium">
          <span>서브태스크</span>
          <span className="text-muted-foreground">{percent}%</span>
        </div>
        <Progress value={percent} className="mb-3 h-1.5" />
        <ul className="space-y-1.5">
          {subtasks.map((subtask) => (
            <li key={subtask.id} className="flex items-start gap-2">
              <Checkbox
                checked={subtask.completed}
                disabled
                className="mt-0.5"
                aria-label={subtask.title}
              />
              <span
                className={cn(
                  'text-xs leading-snug',
                  subtask.completed && 'text-muted-foreground line-through',
                )}
              >
                {subtask.title}
              </span>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  )
}
