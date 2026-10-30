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

async function syncLocalSessions(localSessions: StoredConversation[], remoteSessions: StoredConversation[]) {
  const remoteById = new Map(remoteSessions.map(session => [session.id, session]))
  const pending = localSessions.filter(session => {
    const remote = remoteById.get(session.id)
    return !remote || (remote.messages.length === 0 && session.messages.length > 0)
  })
  if (!pending.length) return
  const headers = await getAuthHeaders()
  await Promise.all(pending.map(session => fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ id: session.id, messages: session.messages }),
    cache: 'no-store',
  })))
}

export function useConversations(userId?: string) {
  const [sessions, setSessions] = useState<StoredConversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    let requestSerial = 0
    let refreshTimer: number | undefined
    const load = async () => {
      const requestId = ++requestSerial
      if (!userId) {
        if (active) setSessions(readConversations())
        setLoading(false)
        return
      }
      try {
        const headers = await getAuthHeaders()
        const response = await fetch('/api/sessions', { headers, cache: 'no-store' })
        if (!response.ok) throw new Error('Could not load sessions')
        const rows = await response.json() as Array<{ id: string; last_active: string; messages?: ChatMessage[] }>
        if (!active || requestId !== requestSerial) return
        const remoteSessions = rows.map(row => {
          const messages = (row.messages ?? []).map(message => ({ role: message.role, content: message.content }))
          const firstUser = messages.find(message => message.role === 'user')?.content.trim()
          return { id: row.id, title: firstUser?.slice(0, 54) || 'New conversation', updatedAt: row.last_active, messages }
        })
        const localSessions = readConversations()
        const localById = new Map(localSessions.map(session => [session.id, session]))
        const merged = remoteSessions.map(remote => {
          const local = localById.get(remote.id)
          if (!local) return remote
          return local.messages.length > remote.messages.length
            ? { ...remote, title: local.title, updatedAt: local.updatedAt, messages: local.messages }
            : remote
        })
        const remoteIds = new Set(remoteSessions.map(session => session.id))
        merged.push(...localSessions.filter(session => !remoteIds.has(session.id)))
        merged.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
        setSessions(merged)
        void syncLocalSessions(localSessions, remoteSessions)
      } catch {
        if (active && requestId === requestSerial) setSessions(readConversations())
      } finally {
        if (active && requestId === requestSerial) setLoading(false)
      }
    }
    const sync = () => {
      if (!userId) {
        setSessions(readConversations())
        return
      }
      if (refreshTimer) window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => void load(), 150)
    }
    void load()
    window.addEventListener(CONVERSATIONS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      active = false
      if (refreshTimer) window.clearTimeout(refreshTimer)
      window.removeEventListener(CONVERSATIONS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [userId])

  const resume = useCallback(async (id: string): Promise<ChatMessage[]> => {
    return sessions.find(session => session.id === id)?.messages ?? readConversations().find(session => session.id === id)?.messages ?? []
  }, [sessions])

  const cancel = useCallback(async (id: string) => {
    const next = sessions.filter(session => session.id !== id)
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(readConversations().filter(session => session.id !== id)))
    setSessions(next)
    void getAuthHeaders().then(authHeaders => fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ id }),
      cache: 'no-store',
    }))
  }, [sessions])

  const rename = useCallback((id: string, title: string) => {
    const next = readConversations().map(session => session.id === id ? { ...session, title } : session)
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(next))
    setSessions(next)
  }, [])

  return { sessions, loading, resume, cancel, rename }
}
