'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { ErrorTrend } from '@/types/monitoring'

interface ErrorTrendChartProps {
  data: ErrorTrend[]
}

const DATE_SLICE_START = 5

export function ErrorTrendChart({ data }: ErrorTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">에러 추이 (7일)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: string) => value.slice(DATE_SLICE_START)}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="에러 수"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
