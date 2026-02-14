'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { useVelocityData } from '@/queries/use-sprints'

interface VelocityChartProps {
  projectId: string
}

interface TooltipPayloadEntry {
  value: number
  dataKey: string
  color: string
  payload: {
    sprintName: string
    completedTasks: number
    totalTasks: number
  }
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  const rate = data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0

  return (
    <div className="bg-popover text-popover-foreground rounded-xl border px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground text-xs">
                {entry.dataKey === 'completedTasks' ? '완료' : '전체'}
              </span>
            </div>
            <span className="text-xs font-semibold tabular-nums">{entry.value}개</span>
          </div>
        ))}
      </div>
      <div className="border-border/50 mt-2 border-t pt-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">완료율</span>
          <span className="text-xs font-semibold tabular-nums">{rate}%</span>
        </div>
      </div>
    </div>
  )
}

function CustomLegend() {
  const items = [
    { label: '완료 태스크', color: 'var(--chart-1)' },
    { label: '전체 태스크', color: 'var(--chart-2)' },
  ]

  return (
    <div className="flex items-center justify-center gap-5 pt-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground text-xs">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function VelocityChart({ projectId }: VelocityChartProps) {
  const { data, isLoading } = useVelocityData(projectId)

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null

    const totalCompleted = data.reduce((sum, d) => sum + d.completedTasks, 0)
    const totalAll = data.reduce((sum, d) => sum + d.totalTasks, 0)
    const avgVelocity = Math.round(totalCompleted / data.length)
    const avgRate = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0

    return { avgVelocity, avgRate, sprintCount: data.length }
  }, [data])

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4">
        <div className="flex gap-3">
          <div className="bg-muted h-16 flex-1 animate-pulse rounded-lg" />
          <div className="bg-muted h-16 flex-1 animate-pulse rounded-lg" />
          <div className="bg-muted h-16 flex-1 animate-pulse rounded-lg" />
        </div>
        <div className="bg-muted flex-1 animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
        <div className="bg-muted rounded-full p-3">
          <svg
            className="text-muted-foreground/60 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
            />
          </svg>
        </div>
        <p className="text-sm">완료된 스프린트가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* 요약 통계 */}
      {stats && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg px-3 py-2.5">
            <p className="text-muted-foreground text-[11px] font-medium">평균 벨로시티</p>
            <p className="text-lg leading-tight font-bold tabular-nums">
              {stats.avgVelocity}
              <span className="text-muted-foreground ml-0.5 text-xs font-normal">개/스프린트</span>
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2.5">
            <p className="text-muted-foreground text-[11px] font-medium">평균 완료율</p>
            <p className="text-lg leading-tight font-bold tabular-nums">
              {stats.avgRate}
              <span className="text-muted-foreground ml-0.5 text-xs font-normal">%</span>
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2.5">
            <p className="text-muted-foreground text-[11px] font-medium">완료 스프린트</p>
            <p className="text-lg leading-tight font-bold tabular-nums">
              {stats.sprintCount}
              <span className="text-muted-foreground ml-0.5 text-xs font-normal">회</span>
            </p>
          </div>
        </div>
      )}

      {/* 차트 */}
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            barCategoryGap="25%"
            barGap={4}
          >
            <defs>
              <linearGradient id="velocityGradCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="velocityGradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.4}
            />
            <XAxis
              dataKey="sprintName"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)' }}
              dy={4}
            />
            <YAxis
              fontSize={11}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)' }}
              width={32}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
            <Bar
              dataKey="totalTasks"
              name="totalTasks"
              fill="url(#velocityGradTotal)"
              stroke="var(--chart-2)"
              strokeWidth={1}
              strokeOpacity={0.3}
              radius={[6, 6, 0, 0]}
              animationDuration={600}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="completedTasks"
              name="completedTasks"
              fill="url(#velocityGradCompleted)"
              stroke="var(--chart-1)"
              strokeWidth={1}
              strokeOpacity={0.3}
              radius={[6, 6, 0, 0]}
              animationDuration={600}
              animationEasing="ease-out"
              animationBegin={150}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 커스텀 레전드 */}
      <CustomLegend />
    </div>
  )
}
