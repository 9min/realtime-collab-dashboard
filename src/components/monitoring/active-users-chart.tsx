'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ActiveUsersChartProps {
  current: number
}

export function ActiveUsersChart({ current }: ActiveUsersChartProps) {
  const data = [
    { time: '현재', users: current },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">활성 사용자</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="hsl(var(--chart-3))"
                fill="hsl(var(--chart-3))"
                fillOpacity={0.3}
                name="활성 사용자"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
