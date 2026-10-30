'use client'

import { useMemo } from 'react'
import type { InferenceLogRow } from '@/lib/supabase/types'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

interface Props {
  logs: InferenceLogRow[]
}

export default function LatencyChart({ logs }: Props) {
  const { data, chartConfig } = useMemo(() => {
    const validLogs = logs.filter(l => Boolean(l.model))
    const sorted = [...validLogs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const recent = sorted.slice(-50)
    const config: ChartConfig = {
      latency: { label: 'Latency', color: '#7db7ff' },
    }

    const points = recent.map(l => ({
      time: new Date(l.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      model: l.model,
      latency: l.latency_ms,
    }))

    return { data: points.length === 1 ? [points[0], { ...points[0] }] : points, chartConfig: config }
  }, [logs])

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-3">Latency over time</h3>
      <ChartContainer config={chartConfig} className="h-[240px] w-full">
        <LineChart data={data} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
          <defs>
            <filter id="latency-line-shadow" x="-20%" y="-20%" width="140%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="var(--foreground)" floodOpacity="0.28" />
            </filter>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            fontSize={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={v => `${v}ms`}
            fontSize={10}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
          <Line
            dataKey="latency"
            type="monotone"
            stroke="var(--color-latency)"
            strokeWidth={2.5}
            strokeLinecap="round"
            filter="url(#latency-line-shadow)"
            dot={{ r: 3, fill: 'var(--color-latency)', strokeWidth: 0, fillOpacity: 1 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
