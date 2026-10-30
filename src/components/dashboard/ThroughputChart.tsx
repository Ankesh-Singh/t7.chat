'use client'

import { useMemo } from 'react'
import type { InferenceLogRow } from '@/lib/supabase/types'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

interface Props {
  logs: InferenceLogRow[]
}

export default function ThroughputChart({ logs }: Props) {
  const { data, chartConfig } = useMemo(() => {
    const counts: Record<string, number> = {}
    logs.forEach(l => {
      counts[l.model] = (counts[l.model] || 0) + 1
    })
    const chartConfig: ChartConfig = { requests: { label: 'Requests', color: 'var(--chart-2)' } }
    const data = Object.entries(counts).map(([model, requests]) => ({ model, requests }))
    return { data, chartConfig }
  }, [logs])

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-center h-[280px]">
        <p className="text-xs text-muted-foreground">No data yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-3">Requests by Model</h3>
      <ChartContainer config={chartConfig} className="h-[240px] w-full">
        <LineChart data={data} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="model" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Line dataKey="requests" type="monotone" stroke="var(--color-requests)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-requests)', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
