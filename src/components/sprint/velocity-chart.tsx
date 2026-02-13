'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

import { useVelocityData } from '@/queries/use-sprints'

interface VelocityChartProps {
  projectId: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2.5 shadow-lg">
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-1.5 space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground text-xs">
              {entry.dataKey === 'completedTasks' ? '완료' : '전체'}
            </span>
            <span className="text-xs font-medium">{entry.value}개</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function VelocityChart({ projectId }: VelocityChartProps) {
  const { data, isLoading } = useVelocityData(projectId)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="bg-muted h-24 w-full animate-pulse rounded" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        완료된 스프린트가 없습니다
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="sprintName"
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value: string) =>
                value === 'completedTasks' ? '완료 태스크' : '전체 태스크'
              }
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Bar
              dataKey="totalTasks"
              name="totalTasks"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.25}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="completedTasks"
              name="completedTasks"
              fill="hsl(var(--chart-2))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
