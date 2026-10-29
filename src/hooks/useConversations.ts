'use client'

import { useCallback, useEffect, useState } from 'react'
import { CONVERSATIONS_EVENT, CONVERSATIONS_KEY, type StoredConversation } from './useChat'
import type { ChatMessage } from '@/lib/sdk/types'

function readConversations(): StoredConversation[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]') as StoredConversation[]
  } catch {
    return []
  }
}

export function useConversations() {
  const [sessions, setSessions] = useState<StoredConversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sync = () => setSessions(readConversations())
    const timer = window.setTimeout(() => {
      sync()
      setLoading(false)
    }, 0)
    window.addEventListener(CONVERSATIONS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(CONVERSATIONS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const resume = useCallback(async (id: string): Promise<ChatMessage[]> => {
    return readConversations().find(session => session.id === id)?.messages ?? []
  }, [])

  const cancel = useCallback(async (id: string) => {
    const next = readConversations().filter(session => session.id !== id)
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(next))
    setSessions(next)
    void fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }, [])

  const rename = useCallback((id: string, title: string) => {
    const next = readConversations().map(session => session.id === id ? { ...session, title } : session)
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(next))
    setSessions(next)
  }, [])

  return { sessions, loading, resume, cancel, rename }
}
