import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import type { MonitoringStats, ErrorTrend } from '@/types/monitoring'

type Client = SupabaseClient<Database>

const ACTIVE_USER_WINDOW_MS = 30 * 60 * 1000

export async function getActiveUsersCount(supabase: Client): Promise<number> {
  const thirtyMinutesAgo = new Date(Date.now() - ACTIVE_USER_WINDOW_MS).toISOString()
  const { count } = await supabase
    .from('activity_logs')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', thirtyMinutesAgo)
  return count ?? 0
}

const TREND_DAYS = 7
const MAX_MOCK_ERRORS = 20

export async function getErrorTrends(): Promise<ErrorTrend[]> {
  // Generate last 7 days of mock error trend data
  // In production, this would call Sentry API
  const trends: ErrorTrend[] = []
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    trends.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * MAX_MOCK_ERRORS),
    })
  }
  return trends
}

const PERCENTAGE_MULTIPLIER = 100

export async function getMonitoringStats(
  supabase: Client,
  cacheStats: { hits: number; misses: number },
): Promise<MonitoringStats> {
  const [activeUsers, errorTrends] = await Promise.all([
    getActiveUsersCount(supabase),
    getErrorTrends(),
  ])

  const totalHitsAndMisses = cacheStats.hits + cacheStats.misses
  const hitRate = totalHitsAndMisses > 0
    ? Math.round((cacheStats.hits / totalHitsAndMisses) * PERCENTAGE_MULTIPLIER)
    : 0

  return {
    errors: {
      total: errorTrends.reduce((sum, t) => sum + t.count, 0),
      trend: errorTrends,
    },
    cache: {
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      hitRate,
    },
    activeUsers: {
      current: activeUsers,
    },
    system: {
      realtimeStatus: 'connected',
      apiStatus: 'healthy',
      uptime: Date.now(),
    },
  }
}
