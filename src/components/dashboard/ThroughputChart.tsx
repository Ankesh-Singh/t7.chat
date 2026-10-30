'use client'

import { useMemo } from 'react'
import type { InferenceLogRow } from '@/lib/supabase/types'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

interface Props {
  logs: InferenceLogRow[]
}

export default function ThroughputChart({ logs }: Props) {
  const { data, chartConfig } = useMemo(() => {
    const counts: Record<string, number> = {}
    logs.forEach(l => {
      counts[l.model] = (counts[l.model] || 0) + 1
    })
    const chartConfig: ChartConfig = { requests: { label: 'Requests', color: '#3b82f6' } }
    const data = Object.entries(counts).map(([model, requests]) => ({ model, requests }))
    return { data, chartConfig }
  }, [logs])

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-3">Requests by Model</h3>
      <ChartContainer config={chartConfig} className="h-[240px] w-full">
        <BarChart data={data} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="model" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="requests" fill="var(--color-requests)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
