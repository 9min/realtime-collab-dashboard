'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { useWeeklyTimeReport } from '@/queries/use-time-entries'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

function getWeekStartDate(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday as start
  const monday = new Date(now)
  monday.setDate(diff)
  return monday.toISOString().slice(0, 10)
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const hours = payload[0].value
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2.5 shadow-lg">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-muted-foreground mt-1 text-xs">{hours.toFixed(1)}시간</p>
    </div>
  )
}

interface WeeklyTimeChartProps {
  projectId: string
}

export function WeeklyTimeChart({ projectId }: WeeklyTimeChartProps) {
  const weekStart = useMemo(() => getWeekStartDate(), [])
  const { data: reports, isLoading } = useWeeklyTimeReport(projectId, weekStart)

  const chartData = useMemo(() => {
    if (!reports || reports.length === 0) return []

    // Aggregate all users' time per day
    const dailyTotals = new Map<string, number>()
    for (const report of reports) {
      for (const day of report.dailyMinutes) {
        dailyTotals.set(day.date, (dailyTotals.get(day.date) ?? 0) + day.totalMinutes)
      }
    }

    // Build chart data
    const start = new Date(weekStart)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayOfWeek = d.getDay()
      return {
        date: DAY_LABELS[dayOfWeek],
        hours: Math.round(((dailyTotals.get(dateStr) ?? 0) / 60) * 10) / 10,
      }
    })
  }, [reports, weekStart])

  if (isLoading) {
    return <ChartSkeleton />
  }

  if (chartData.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
            barCategoryGap="25%"
          >
            <defs>
              <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="date"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              fontSize={11}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              unit="h"
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
            />
            <Bar
              dataKey="hours"
              name="시간"
              fill="url(#timeGradient)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="bg-muted h-24 w-full animate-pulse rounded" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
      이번 주 시간 기록이 없습니다
    </div>
  )
}
