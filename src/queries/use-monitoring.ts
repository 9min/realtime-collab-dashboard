'use client'

import { useQuery } from '@tanstack/react-query'

import type { MonitoringStats } from '@/types/monitoring'

export const monitoringKeys = {
  stats: () => ['monitoring', 'stats'] as const,
}

export function useMonitoringStats() {
  return useQuery<MonitoringStats>({
    queryKey: monitoringKeys.stats(),
    queryFn: async () => {
      const res = await fetch('/api/admin/monitoring')
      if (!res.ok) {
        throw new Error('통계 데이터를 불러오는데 실패했습니다')
      }
      return res.json()
    },
  })
}
