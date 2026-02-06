'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

import { useTaskStatusChart } from '@/queries/use-chart-data'

interface TaskStatusChartProps {
  projectId: string
}

export function TaskStatusChart({ projectId }: TaskStatusChartProps) {
  const { data, isLoading } = useTaskStatusChart(projectId)

  // 태스크가 0인 컬럼 제외
  const chartData = useMemo(() => data?.filter((d) => d.value > 0) ?? [], [data])

  if (isLoading) {
    return <ChartSkeleton />
  }

  if (chartData.length === 0) {
    return <EmptyState message="태스크가 없습니다" />
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="40%"
          outerRadius="70%"
          dataKey="value"
          nameKey="name"
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--popover-foreground))',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="bg-muted h-32 w-32 animate-pulse rounded-full" />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
      {message}
    </div>
  )
}
