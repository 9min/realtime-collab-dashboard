'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { CacheStatsData } from '@/types/monitoring'

interface CacheStatsChartProps {
  data: CacheStatsData
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))']

const INNER_RADIUS = 60
const OUTER_RADIUS = 90
const PADDING_ANGLE = 5

export function CacheStatsChart({ data }: CacheStatsChartProps) {
  const chartData = [
    { name: '캐시 적중', value: data.hits },
    { name: '캐시 미스', value: data.misses },
  ]

  const isEmpty = data.hits === 0 && data.misses === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">캐시 적중률</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          {isEmpty ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm">캐시 데이터 없음</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={INNER_RADIUS}
                  outerRadius={OUTER_RADIUS}
                  paddingAngle={PADDING_ANGLE}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
