'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import { useWeeklyProgressChart } from '@/queries/use-chart-data'

interface WeeklyProgressChartProps {
  projectId: string
}

export function WeeklyProgressChart({ projectId }: WeeklyProgressChartProps) {
  const { data, isLoading } = useWeeklyProgressChart(projectId)

  if (isLoading) {
    return <ChartSkeleton />
  }

  if (!data || data.length === 0) {
    return <EmptyState />
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
        <Bar dataKey="created" name="생성" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" name="완료" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
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
      데이터가 없습니다
    </div>
  )
}
