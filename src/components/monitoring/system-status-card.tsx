'use client'

import { Wifi, WifiOff, Server, AlertTriangle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SystemStatusCardProps {
  realtimeStatus: 'connected' | 'disconnected' | 'connecting'
  apiStatus: 'healthy' | 'degraded' | 'down'
}

const REALTIME_CONFIG = {
  connected: { label: '연결됨', variant: 'default' as const, icon: Wifi },
  disconnected: { label: '연결 끊김', variant: 'destructive' as const, icon: WifiOff },
  connecting: { label: '연결 중...', variant: 'secondary' as const, icon: Wifi },
} as const

const API_CONFIG = {
  healthy: { label: '정상', variant: 'default' as const, icon: Server },
  degraded: { label: '성능 저하', variant: 'secondary' as const, icon: AlertTriangle },
  down: { label: '장애', variant: 'destructive' as const, icon: AlertTriangle },
} as const

export function SystemStatusCard({ realtimeStatus, apiStatus }: SystemStatusCardProps) {
  const rtConfig = REALTIME_CONFIG[realtimeStatus]
  const apiConfig = API_CONFIG[apiStatus]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">시스템 상태</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <rtConfig.icon className="h-4 w-4" />
            <span className="text-sm">Realtime</span>
          </div>
          <Badge variant={rtConfig.variant}>{rtConfig.label}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <apiConfig.icon className="h-4 w-4" />
            <span className="text-sm">API</span>
          </div>
          <Badge variant={apiConfig.variant}>{apiConfig.label}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
