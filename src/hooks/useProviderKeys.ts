'use client'

import { useCallback, useState } from 'react'
import type { Provider } from '@/lib/sdk/types'

const STORAGE_KEY = 't7_byok_session_keys'

function readKeys(): Partial<Record<Provider, string>> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') as Partial<Record<Provider, string>>
  } catch {
    return {}
  }
}

export function useProviderKeys() {
  const [keys, setKeys] = useState<Partial<Record<Provider, string>>>(readKeys)

  const updateKey = useCallback((provider: Provider, key: string) => {
    const next = { ...readKeys(), ...(key.trim() ? { [provider]: key.trim() } : {}) }
    if (!key.trim()) delete next[provider]
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setKeys(next)
  }, [])

  const clearKey = useCallback((provider: Provider) => updateKey(provider, ''), [updateKey])

  return { keys, updateKey, clearKey }
}

