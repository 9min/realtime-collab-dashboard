'use client'

import { Loader2, Wifi, WifiOff } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { CONNECTION_STATUS, useRealtimeStore } from '@/stores/realtime-store'

const STATUS_CONFIG = {
  [CONNECTION_STATUS.CONNECTED]: {
    icon: Wifi,
    label: '실시간 연결됨',
    className: 'text-emerald-500',
  },
  [CONNECTION_STATUS.CONNECTING]: {
    icon: Loader2,
    label: '연결 중...',
    className: 'text-blue-500 animate-spin',
  },
  [CONNECTION_STATUS.RECONNECTING]: {
    icon: Loader2,
    label: '재연결 중...',
    className: 'text-amber-500 animate-spin',
  },
  [CONNECTION_STATUS.DISCONNECTED]: {
    icon: WifiOff,
    label: '연결 끊김',
    className: 'text-red-500',
  },
} as const

export function ConnectionStatus() {
  const { status } = useRealtimeStore()
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center" role="status" aria-label={config.label}>
            <Icon className={cn('h-4 w-4', config.className)} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
