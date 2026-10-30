'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Provider } from '@/lib/sdk/types'
import { getSupabaseBrowser } from '@/lib/supabase/client'

const STORAGE_KEY = 't7_byok_session_keys'

function readKeys(): Partial<Record<Provider, string>> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') as Partial<Record<Provider, string>>
  } catch {
    return {}
  }
}

export function useProviderKeys(userId?: string) {
  const [keys, setKeys] = useState<Partial<Record<Provider, string>>>(readKeys)
  const previousUserId = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!userId) {
      if (previousUserId.current) {
        sessionStorage.removeItem(STORAGE_KEY)
        setKeys({})
      } else {
        setKeys(readKeys())
      }
      previousUserId.current = undefined
      return
    }
    previousUserId.current = userId
    const load = async () => {
      const client = getSupabaseBrowser()
      const { data } = client ? await client.auth.getSession() : { data: { session: null } }
      if (!data.session) return
      const response = await fetch('/api/provider-keys', { headers: { Authorization: `Bearer ${data.session.access_token}` } })
      if (!response.ok) return
      const body = await response.json() as { keys?: Partial<Record<Provider, string>> }
      const next = body.keys ?? {}
      setKeys(next)
    }
    void load()
  }, [userId])

  const updateKey = useCallback(async (provider: Provider, key: string) => {
    const next = { ...keys, ...(key.trim() ? { [provider]: key.trim() } : {}) }
    if (!key.trim()) delete next[provider]
    if (userId && key.trim()) {
      const client = getSupabaseBrowser()
      const { data } = client ? await client.auth.getSession() : { data: { session: null } }
      if (!data.session) throw new Error('Your session expired. Please sign in again.')
      const response = await fetch('/api/provider-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ provider, key }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(body?.error || `Unable to save provider key (${response.status}).`)
      }
    }
    if (!userId) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setKeys(next)
  }, [keys, userId])

  const clearKey = useCallback(async (provider: Provider) => {
    if (userId) {
      const client = getSupabaseBrowser()
      const { data } = client ? await client.auth.getSession() : { data: { session: null } }
      if (!data.session) throw new Error('Your session expired. Please sign in again.')
      const response = await fetch('/api/provider-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ provider }),
      })
      if (!response.ok) throw new Error((await response.json() as { error?: string }).error || 'Unable to remove provider key.')
    }
    await updateKey(provider, '')
  }, [updateKey, userId])

  return { keys, updateKey, clearKey }
}

