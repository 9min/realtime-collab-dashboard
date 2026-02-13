'use client'

import { useRouter } from 'next/navigation'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { MemberWorkload } from '@/types/workload'
import { WORKLOAD_THRESHOLDS, getWorkloadZone } from '@/types/workload'

interface WorkloadChartProps {
  data: MemberWorkload[]
  projectId: string
}

const PRIORITY_COLORS = {
  low: '#10b981', // emerald
  medium: '#3b82f6', // blue
  high: '#f59e0b', // amber
  urgent: '#f43f5e', // rose
}

const ZONE_COLORS = {
  green: 'rgba(16, 185, 129, 0.08)',
  yellow: 'rgba(245, 158, 11, 0.08)',
  red: 'rgba(244, 63, 94, 0.08)',
}

export function WorkloadChart({ data, projectId }: WorkloadChartProps) {
  const router = useRouter()

  const chartData = data.map((m) => ({
    name: m.userName,
    userId: m.userId,
    low: m.tasksByPriority.low,
    medium: m.tasksByPriority.medium,
    high: m.tasksByPriority.high,
    urgent: m.tasksByPriority.urgent,
    total: m.totalTasks,
    zone: getWorkloadZone(m.totalTasks),
  }))

  const handleBarClick = (userId: string) => {
    router.push(`/projects/${projectId}/board?assignee=${userId}`)
  }

  if (chartData.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        멤버 데이터가 없습니다
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(chartData.length * 50 + 40, 200)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, bottom: 5, left: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 'auto']} allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={75} />
        <ReferenceLine x={WORKLOAD_THRESHOLDS.GREEN_MAX} stroke="#10b981" strokeDasharray="4 4" />
        <ReferenceLine x={WORKLOAD_THRESHOLDS.YELLOW_MAX} stroke="#f59e0b" strokeDasharray="4 4" />
        <Tooltip
          formatter={(value: unknown, name: unknown) => {
            const labels: Record<string, string> = {
              low: '낮음',
              medium: '보통',
              high: '높음',
              urgent: '긴급',
            }
            const key = String(name ?? '')
            return [String(value), labels[key] ?? key]
          }}
          labelFormatter={(label: unknown) => String(label)}
        />
        {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
          <Bar
            key={priority}
            dataKey={priority}
            stackId="a"
            fill={PRIORITY_COLORS[priority]}
            cursor="pointer"
            onClick={(_data: unknown, index: number) => {
              const item = chartData[index]
              if (item) handleBarClick(item.userId)
            }}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.userId}
                fill={PRIORITY_COLORS[priority]}
                style={{ background: ZONE_COLORS[entry.zone] }}
              />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
