'use client'

import { useEffect, useState } from 'react'
import { getAuthHeaders } from '@/lib/auth/client'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import type { InferenceLogRow } from '@/lib/supabase/types'

const MAX_LOGS = 100

export function useRealtimeMetrics(userId?: string, authLoading = false) {
  const [logs, setLogs] = useState<InferenceLogRow[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (authLoading || !userId) {
      if (!userId) void Promise.resolve().then(() => { if (active) setLogs([]) })
      return
    }

    const supabase = getSupabaseBrowser()

    const load = async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await fetch('/api/metrics?limit=100', { headers, cache: 'no-store' })
        if (!response.ok) throw new Error('Could not load metrics')
        const data = await response.json() as InferenceLogRow[]
        if (active) {
          setLogs([...data].reverse())
          setLoadedFor(userId)
        }
      } catch {
        if (active) {
          setLogs([])
          setLoadedFor(userId)
        }
      }
    }
    void load()

    const refreshTimer = window.setInterval(() => void load(), 10_000)
    const channel = supabase?.channel(`inference_logs_${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inference_logs', filter: `user_id=eq.${userId}` }, payload => {
        const next = payload.new as InferenceLogRow
        setLogs(previous => previous.some(log => log.id === next.id) ? previous : [...previous, next].slice(-MAX_LOGS))
      })
      .subscribe()

    return () => {
      active = false
      window.clearInterval(refreshTimer)
      if (channel && supabase) void supabase.removeChannel(channel)
    }
  }, [authLoading, userId])

  return { logs, loading: authLoading || Boolean(userId && loadedFor !== userId) }
}
