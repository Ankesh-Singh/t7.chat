'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics'
import LatencyChart from '@/components/dashboard/LatencyChart'
import ThroughputChart from '@/components/dashboard/ThroughputChart'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import ThemeToggle from '@/components/chat/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { FALLBACK_MODELS, PROVIDERS } from '@/constants/models'

export default function DashboardPage() {
  const auth = useAuth()
  const { logs: rawLogs, loading } = useRealtimeMetrics(auth.user?.id, auth.loading)
  const [modelFilter, setModelFilter] = useState<string>('all')
  const [providerFilter, setProviderFilter] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('all')
  const [page, setPage] = useState(0)

  const [now] = useState(() => Date.now())
  const filteredByTime = rawLogs.filter(l => {
    if (timeRange === 'all') return true
    const logTime = new Date(l.created_at).getTime()
    const hours = { '1h': 1, '6h': 6, '24h': 24, '7d': 24 * 7, '30d': 24 * 30 }[timeRange] || 24
    return (now - logTime) <= hours * 60 * 60 * 1000
  })

  const logs = filteredByTime.filter(l => Boolean(l.model && l.model.trim() !== ''))
  const providerLogs = providerFilter === 'all' ? logs : logs.filter(l => l.provider === providerFilter)
  const catalogModels = FALLBACK_MODELS
    .filter(model => providerFilter === 'all' || model.provider === providerFilter)
    .map(model => model.id)
  const uniqueModels = [...new Set([...catalogModels, ...providerLogs.filter(l => l.model).map(l => l.model)])]
  const modelLabels = new Map(FALLBACK_MODELS.map(model => [model.id, model.label]))
  const activeModelFilter = modelFilter !== 'all' && uniqueModels.includes(modelFilter) ? modelFilter : 'all'
  const filtered = activeModelFilter === 'all' ? providerLogs : providerLogs.filter(l => l.model === activeModelFilter)

  const avgLatency = filtered.length > 0
    ? Math.round(filtered.reduce((s, l) => s + l.latency_ms, 0) / filtered.length)
    : 0
  const totalTokens = filtered.reduce((s, l) => s + l.prompt_tokens + l.completion_tokens, 0)
  const totalRequests = filtered.length
  const modelsUsed = [...new Set(filtered.map(l => l.model))].length
  const requestsPerModel = modelsUsed > 0 ? (totalRequests / modelsUsed).toFixed(1) : '0'

  const half = Math.floor(filtered.length / 2)
  const newAvg = half > 0 ? filtered.slice(0, half).reduce((s, l) => s + l.latency_ms, 0) / half : 0
  const oldAvg = half > 0 ? filtered.slice(half).reduce((s, l) => s + l.latency_ms, 0) / (filtered.length - half) : 0
  const latDiff = Math.round(newAvg - oldAvg)
  const latTrend = isNaN(latDiff) || latDiff === 0 ? 'Stable' : latDiff > 0 ? `↑ ${latDiff}ms` : `↓ ${Math.abs(latDiff)}ms`
  const latColor = latDiff > 0 ? 'text-destructive' : 'text-green-500'

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors" aria-label="Back to chat">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-3">
            <Image src="/applogo.png" alt="T7 Chat" width={28} height={28} className="h-7 w-7 rounded-lg object-cover" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
              <p className="text-xs text-muted-foreground/60">Inference monitoring</p>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-end gap-2 sm:ml-auto sm:w-auto sm:gap-3">
          <ThemeToggle />
          <FilterGroup label="Time range"><FilterMenu value={timeRange} onChange={setTimeRange} options={[['1h', 'Last 1 hour'], ['6h', 'Last 6 hours'], ['24h', 'Last 24 hours'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['all', 'All time']]} /></FilterGroup>
          <FilterGroup label="Provider"><FilterMenu value={providerFilter} onChange={setProviderFilter} options={[['all', 'All providers'], ...PROVIDERS.map(provider => [provider.id, provider.label] as [string, string])]} /></FilterGroup>
          <FilterGroup label="Model"><FilterMenu value={activeModelFilter} onChange={setModelFilter} options={[['all', 'All models'], ...uniqueModels.map(model => [model, modelLabels.get(model) ?? model] as [string, string])]} /></FilterGroup>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 pb-8 sm:px-6 sm:pb-10">
        {loading ? (
          <div className="max-w-6xl mx-auto space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1,2].map(i => <div key={i} className="h-[280px] rounded-xl bg-card border border-border animate-pulse" />)}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
            <SectionCard title="Overview" description="A quick read on your selected inference window.">
              <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
                <StatCard label="Avg Latency" value={`${avgLatency}ms`} sub={latTrend} subColor={latColor} />
                <StatCard label="Total Requests" value={String(totalRequests)} sub={`${modelsUsed} model${modelsUsed > 1 ? 's' : ''}`} />
                <StatCard label="Total Tokens" value={totalTokens.toLocaleString()} sub="prompt + completion" />
                <StatCard label="Requests / Model" value={requestsPerModel} sub="average across selected models" />
              </div>
            </SectionCard>

            <SectionCard title="Inference performance" description="Latency, throughput, and request health across models.">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                <LatencyChart logs={filtered} />
                <ThroughputChart logs={filtered} />
              </div>
            </SectionCard>

            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <h3 className="text-sm font-semibold">Recent inference logs</h3>
                  <p className="mt-1 text-xs text-muted-foreground">The latest requests recorded for this workspace.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-green-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPage(p => Math.max(0, p - 1))} 
                      disabled={page === 0}
                      className="px-2 py-1 text-[11px] border border-border rounded disabled:opacity-50 hover:bg-muted transition-colors"
                    >Prev</button>
                    <button 
                      onClick={() => setPage(p => p + 1)} 
                      disabled={(page + 1) * 10 >= filtered.length}
                      className="px-2 py-1 text-[11px] border border-border rounded disabled:opacity-50 hover:bg-muted transition-colors"
                    >Next</button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[680px] w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Time</th>
                      <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Session</th>
                      <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Model</th>
                      <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Latency</th>
                      <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Tokens</th>
                      <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(page * 10, (page + 1) * 10).map((log, i) => {
                      const latMs = log.latency_ms
                      const latClass = latMs < 300 ? 'text-green-500' : latMs < 800 ? 'text-amber-500' : 'text-destructive'
                      return (
                        <tr key={i} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </td>
                          <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">{log.session_id?.slice(0, 8) ?? '—'}</td>
                          <td className="px-5 py-2.5 text-xs">{log.model}</td>
                          <td className={`px-5 py-2.5 text-xs font-medium ${latClass}`}>{latMs}ms</td>
                          <td className="px-5 py-2.5 text-xs text-muted-foreground">{log.prompt_tokens + log.completion_tokens}</td>
                          <td className="px-5 py-2.5">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              log.status === 'success'
                                ? 'text-green-400 bg-green-500/10'
                                : 'text-destructive bg-destructive/10'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-xs text-muted-foreground">No requests in this window.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

function FilterMenu({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: [string, string][] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const label = options.find(option => option[0] === value)?.[1] ?? value

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  return (
    <div ref={ref} className="relative min-w-0 flex-1 sm:flex-none">
      <button type="button" onClick={() => setOpen(current => !current)} className="flex h-9 w-full items-center justify-between gap-3 rounded-lg bg-card/70 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted sm:min-w-32 sm:text-sm" aria-expanded={open}>
        <span className="truncate">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+0.4rem)] z-50 min-w-full overflow-hidden rounded-xl border border-border/70 bg-popover/95 p-1 shadow-xl backdrop-blur-xl">
          {options.map(([option, optionLabel]) => (
            <button key={option} type="button" onClick={() => { onChange(option); setOpen(false) }} className={`block w-full rounded-lg px-3 py-2 text-left text-xs transition-colors sm:text-sm ${value === option ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}`}>
              {optionLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-none"><span className="px-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</span>{children}</div>
}

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/70 p-3 shadow-sm sm:p-4">
      <div className="mb-3 px-1 sm:mb-4">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

function StatCard({ label, value, sub, subColor, valueColor }: {
  label: string
  value: string
  sub: string
  subColor?: string
  valueColor?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-3 sm:p-4">
      <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-1.5 ${valueColor || ''}`}>{value}</p>
      <p className={`text-xs mt-1 ${subColor || 'text-muted-foreground/50'}`}>{sub}</p>
    </div>
  )
}
