'use client'

import { Repeat } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RecurrenceBadgeProps {
  isRecurring: boolean
}

export function RecurrenceBadge({ isRecurring }: RecurrenceBadgeProps) {
  if (!isRecurring) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-indigo-100 px-1 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
            <Repeat className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>반복 태스크</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
