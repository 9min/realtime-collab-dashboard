export interface ErrorTrend {
  date: string
  count: number
}

export interface CacheStatsData {
  hits: number
  misses: number
  hitRate: number
}

export interface MonitoringStats {
  errors: {
    total: number
    trend: ErrorTrend[]
  }
  cache: CacheStatsData
  activeUsers: {
    current: number
  }
  system: {
    realtimeStatus: 'connected' | 'disconnected' | 'connecting'
    apiStatus: 'healthy' | 'degraded' | 'down'
    uptime: number
  }
}
