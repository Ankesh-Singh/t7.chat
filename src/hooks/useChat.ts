'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_MODEL, FALLBACK_MODELS } from '@/constants/models'
import type { ChatMessage, ModelOption, ReasoningEffort } from '@/lib/sdk/types'
import type { Provider } from '@/lib/sdk/types'
import { getAuthHeaders } from '@/lib/auth/client'

export const CONVERSATIONS_KEY = 't7_conversations'
export const CONVERSATIONS_EVENT = 't7-conversations-changed'

export type StoredConversation = {
  id: string
  title: string
  updatedAt: string
  messages: ChatMessage[]
}
function generateId() {
  return crypto.randomUUID()
}

function getInitialSession() {
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem('t7_session')
  if (existing) return existing
  const id = generateId()
  localStorage.setItem('t7_session', id)
  return id
}

function getInitialModel(): ModelOption {
  if (typeof window === 'undefined') return DEFAULT_MODEL
  const stored = localStorage.getItem('t7_model')
  if (!stored) return DEFAULT_MODEL
  const [provider, ...idParts] = stored.split(':')
  const id = idParts.join(':')
  return FALLBACK_MODELS.find(item => item.provider === provider && item.id === id) ?? DEFAULT_MODEL
}

function persistConversation(id: string, messages: ChatMessage[]) {
  if (typeof window === 'undefined' || !id) return
  let stored: StoredConversation[] = []
  try {
    stored = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]') as StoredConversation[]
  } catch {
    stored = []
  }
  const userTitle = messages.find(message => message.role === 'user')?.content.trim()
  const conversation: StoredConversation = {
    id,
    title: userTitle ? userTitle.slice(0, 54) : 'New conversation',
    updatedAt: new Date().toISOString(),
    messages,
  }
  const next = [conversation, ...stored.filter(item => item.id !== id)].slice(0, 50)
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(CONVERSATIONS_EVENT))
}

export function useChat(keys: Partial<Record<Provider, string>>) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionId, setSessionId] = useState(getInitialSession)
  const [model, setModelState] = useState<ModelOption>(DEFAULT_MODEL)
  const [reasoningEffort, setReasoningEffortState] = useState<ReasoningEffort>(() => {
    if (typeof window === 'undefined') return 'medium'
    return (localStorage.getItem('t7_reasoning_effort') as ReasoningEffort | null) ?? 'medium'
  })
  const abortRef = useRef<AbortController | null>(null)

  // Read browser-persisted model preferences after hydration to keep SSR markup deterministic.
  useEffect(() => {
    const stored = localStorage.getItem('t7_model')
    if (!stored) return
    const [provider, ...idParts] = stored.split(':')
    const saved = FALLBACK_MODELS.find(item => item.provider === provider && item.id === idParts.join(':'))
    if (saved) {
      // Hydrate browser preference after SSR; this intentionally updates state once after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModelState(saved)
    }
  }, [])

  const setModel = useCallback((next: ModelOption) => {
    setModelState(next)
    localStorage.setItem('t7_model', `${next.provider}:${next.id}`)
  }, [])

  const setReasoningEffort = useCallback((next: ReasoningEffort) => {
    setReasoningEffortState(next)
    localStorage.setItem('t7_reasoning_effort', next)
  }, [])

  const newSession = useCallback(() => {
    const id = generateId()
    localStorage.setItem('t7_session', id)
    setSessionId(id)
    setMessages([])
    void getAuthHeaders().then(authHeaders => fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ id }),
    }))
  }, [])

  const loadSession = useCallback((id: string, nextMessages: ChatMessage[]) => {
    localStorage.setItem('t7_session', id)
    setSessionId(id)
    setMessages(nextMessages)
  }, [])

  const requestResponse = useCallback(async (requestMessages: ChatMessage[], activeModel: ModelOption) => {
    if (!sessionId) return
    const apiKey = keys[activeModel.provider]
    if (!apiKey) {
      const next = [...requestMessages, { role: 'assistant', content: `**Connect ${activeModel.provider} first.** Add your API key from the key button in the sidebar, then try again.` } as ChatMessage]
      setMessages(next)
      persistConversation(sessionId, next)
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setIsStreaming(true)
    setMessages([...requestMessages, { role: 'assistant', content: '' }])

    try {
      const authHeaders = await getAuthHeaders()
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ messages: requestMessages, model: activeModel.id, provider: activeModel.provider, apiKey, sessionId, reasoningEffort }),
        signal: controller.signal,
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(body?.error || `Request failed (${response.status}).`)
      }
      if (!response.body) throw new Error('The server returned an empty response.')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let assistantContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const entry of events) {
          const data = entry.split('\n').find(line => line.startsWith('data: '))?.slice(6)
          if (!data || data === '[DONE]') continue
          const parsed = JSON.parse(data) as { text?: string; error?: string }
          if (parsed.error) throw new Error(parsed.error)
          if (parsed.text) assistantContent += parsed.text
          const next = [...requestMessages, { role: 'assistant', content: assistantContent } as ChatMessage]
          setMessages(next)
          persistConversation(sessionId, next)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      const message = error instanceof Error ? error.message : 'Failed to get a response.'
      const next = [...requestMessages, { role: 'assistant', content: `**Could not send the message.** ${message}` } as ChatMessage]
      setMessages(next)
      persistConversation(sessionId, next)
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [keys, reasoningEffort, sessionId])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming || !sessionId) return
    const next = [...messages, { role: 'user', content: content.trim() } as ChatMessage]
    setMessages(next)
    persistConversation(sessionId, next)
    await requestResponse(next, model)
  }, [isStreaming, messages, model, requestResponse, sessionId])

  const regenerate = useCallback(async (targetModel?: ModelOption) => {
    if (isStreaming || !sessionId) return
    const lastUserIndex = messages.map(message => message.role).lastIndexOf('user')
    if (lastUserIndex < 0) return
    const next = messages.slice(0, lastUserIndex + 1)
    const activeModel = targetModel ?? model
    if (targetModel) setModel(targetModel)
    await requestResponse(next, activeModel)
  }, [isStreaming, messages, model, requestResponse, sessionId, setModel])

  const stopStreaming = useCallback(() => abortRef.current?.abort(), [])

  return { messages, isStreaming, sessionId, model, setModel, reasoningEffort, setReasoningEffort, sendMessage, regenerate, stopStreaming, newSession, loadSession }
}
