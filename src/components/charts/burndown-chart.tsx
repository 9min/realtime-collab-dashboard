'use client'

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { useBurndownChart } from '@/queries/use-chart-data'

interface BurndownChartProps {
  projectId: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; name?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  // Area("remaining-area")를 제외하고 Line 항목만 표시
  const items = payload.filter((entry) => entry.name !== 'remaining-area')
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2.5 shadow-lg">
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-1.5 space-y-1">
        {items.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="inline-block h-0.5 w-3 rounded"
              style={{
                backgroundColor: entry.dataKey === 'remaining' ? '#f97316' : '#94a3b8',
                ...(entry.dataKey === 'ideal' ? { borderTop: '1px dashed #94a3b8' } : {}),
              }}
            />
            <span className="text-muted-foreground text-xs">
              {entry.dataKey === 'remaining' ? '남은 태스크' : '이상적 진행'}
            </span>
            <span className="text-xs font-medium">{entry.value}개</span>
          </div>
        ))}
      </div>
    </div>
  )
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
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="remainingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="remaining"
              name="remaining-area"
              fill="url(#remainingGradient)"
              stroke="none"
              legendType="none"
              tooltipType="none"
            />
            <Line
              type="monotone"
              dataKey="ideal"
              name="이상적 진행"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="remaining"
              name="남은 태스크"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ fill: '#f97316', r: 3, strokeWidth: 0 }}
              activeDot={{ fill: '#f97316', r: 5, strokeWidth: 2, stroke: '#fff' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* 커스텀 범례 */}
      <div className="flex items-center justify-center gap-5 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-orange-500" />
          <span className="text-muted-foreground text-xs">남은 태스크</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="border-muted-foreground inline-block w-4 border-t border-dashed" />
          <span className="text-muted-foreground text-xs">이상적 진행</span>
        </div>
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
      태스크가 없습니다
    </div>
  )
}
