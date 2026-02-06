'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import { useBurndownChart } from '@/queries/use-chart-data'

interface BurndownChartProps {
  projectId: string
}

export function BurndownChart({ projectId }: BurndownChartProps) {
  const { data, isLoading } = useBurndownChart(projectId)

  if (isLoading) {
    return <ChartSkeleton />
  }

  if (!data || data.length === 0) {
    return <EmptyState />
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          fontSize={12}
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          fontSize={12}
          allowDecimals={false}
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--popover-foreground))',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="remaining"
          name="남은 태스크"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: '#ef4444', r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="ideal"
          name="이상적 진행"
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
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
      태스크가 없습니다
    </div>
  )
}
