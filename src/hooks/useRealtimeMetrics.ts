'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import type { InferenceLogRow } from '@/lib/supabase/types'

const MAX_LOGS = 100
const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export function useRealtimeMetrics() {
  const [logs, setLogs] = useState<InferenceLogRow[]>([])
  const [loading, setLoading] = useState(configured)

  useEffect(() => {
    if (!configured) return
    const supabase = getSupabaseBrowser()
    if (!supabase) return
    let active = true

    const load = async () => {
      const { data } = await supabase
        .from('inference_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(MAX_LOGS)
      if (active) {
        setLogs((data?.reverse() as InferenceLogRow[] | undefined) ?? [])
        setLoading(false)
      }
    }
    void load()

    const channel = supabase
      .channel('inference_logs_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inference_logs' }, payload => {
        setLogs(previous => [...previous, payload.new as InferenceLogRow].slice(-MAX_LOGS))
      })
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [])

  return { logs, loading }
}
