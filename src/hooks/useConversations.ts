'use client'

import { useCallback, useEffect, useState } from 'react'
import { CONVERSATIONS_EVENT, CONVERSATIONS_KEY, type StoredConversation } from './useChat'
import type { ChatMessage } from '@/lib/sdk/types'
import { getAuthHeaders } from '@/lib/auth/client'

function readConversations(): StoredConversation[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]') as StoredConversation[]
  } catch {
    return []
  }
}

export function useConversations(userId?: string) {
  const [sessions, setSessions] = useState<StoredConversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!userId) {
        sync()
        setLoading(false)
        return
      }
      try {
        const headers = await getAuthHeaders()
        const response = await fetch('/api/sessions', { headers })
        if (!response.ok) throw new Error('Could not load sessions')
        const rows = await response.json() as Array<{ id: string; last_active: string; messages?: ChatMessage[] }>
        if (!active) return
        setSessions(rows.map(row => {
          const messages = row.messages ?? []
          const firstUser = messages.find(message => message.role === 'user')?.content.trim()
          return { id: row.id, title: firstUser?.slice(0, 54) || 'New conversation', updatedAt: row.last_active, messages }
        }))
      } catch {
        if (active) sync()
      } finally {
        if (active) setLoading(false)
      }
    }
    const sync = () => { if (userId) void load(); else setSessions(readConversations()) }
    void load()
    window.addEventListener(CONVERSATIONS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      active = false
      window.removeEventListener(CONVERSATIONS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [userId])

  const resume = useCallback(async (id: string): Promise<ChatMessage[]> => {
    return sessions.find(session => session.id === id)?.messages ?? readConversations().find(session => session.id === id)?.messages ?? []
  }, [sessions])

  const cancel = useCallback(async (id: string) => {
    const next = sessions.filter(session => session.id !== id)
    if (!userId) localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(next))
    setSessions(next)
    void getAuthHeaders().then(authHeaders => fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ id }),
    }))
  }, [sessions, userId])

  const rename = useCallback((id: string, title: string) => {
    const next = readConversations().map(session => session.id === id ? { ...session, title } : session)
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(next))
    setSessions(next)
  }, [])

  return { sessions, loading, resume, cancel, rename }
}
