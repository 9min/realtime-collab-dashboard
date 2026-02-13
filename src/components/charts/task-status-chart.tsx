'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

import { useTaskStatusChart } from '@/queries/use-chart-data'

interface TaskStatusChartProps {
  projectId: string
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { color: string } }>
}) {
  if (!active || !payload?.length) return null
  const { name, value, payload: entry } = payload[0]
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-sm font-medium">{name}</span>
      </div>
      <p className="text-muted-foreground mt-0.5 text-xs">{value}개 태스크</p>
    </div>
  )
}

function CenterLabel({ viewBox, total }: { viewBox?: { cx: number; cy: number }; total: number }) {
  if (!viewBox) return null
  const { cx, cy } = viewBox
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground text-2xl font-bold">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground text-xs">
        전체
      </text>
    </g>
  )
}

export function TaskStatusChart({ projectId }: TaskStatusChartProps) {
  const { data, isLoading } = useTaskStatusChart(projectId)

  const chartData = useMemo(() => data?.filter((d) => d.value > 0) ?? [], [data])
  const total = useMemo(() => chartData.reduce((sum, d) => sum + d.value, 0), [chartData])

  if (isLoading) {
    return <ChartSkeleton />
  }

  if (chartData.length === 0) {
    return <EmptyState message="태스크가 없습니다" />
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="80%"
              dataKey="value"
              nameKey="name"
              paddingAngle={3}
              strokeWidth={0}
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} className="outline-none" />
              ))}
              <CenterLabel total={total} />
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* 커스텀 범례 */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-1">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground text-xs">{entry.name}</span>
            <span className="text-foreground text-xs font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
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
