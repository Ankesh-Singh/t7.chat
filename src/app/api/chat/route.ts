import { NextRequest } from 'next/server'
import { LLMClient } from '@/lib/sdk'
import { byokProviders } from '@/lib/sdk/providers/byok'
import { PROVIDERS } from '@/constants/models'
import type { ChatMessage, Provider, ReasoningEffort } from '@/lib/sdk/types'
import { supabaseForRequest, supabaseServer } from '@/lib/supabase/server'
import { validateProviderKey } from '@/lib/security/provider-key'
import { getAuthenticatedUser } from '@/lib/auth/server'

type ChatBody = {
  messages?: ChatMessage[]
  model?: string
  provider?: Provider
  apiKey?: string
  sessionId?: string
  reasoningEffort?: ReasoningEffort
}
function event(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: NextRequest) {
  let body: ChatBody
  try {
    body = await req.json() as ChatBody
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { messages, model, provider, apiKey, sessionId, reasoningEffort } = body
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100 || messages.some(message => !message || typeof message.content !== 'string' || message.content.length > 100_000) || !model || !provider || !sessionId || !apiKey?.trim()) {
    return Response.json({ error: 'Choose a model and add that provider API key first.' }, { status: 400 })
  }
  if (!PROVIDERS.some(item => item.id === provider) || !byokProviders[provider]) {
    return Response.json({ error: 'Unsupported provider.' }, { status: 400 })
  }
  const validation = validateProviderKey(provider, apiKey)
  if (!validation.valid) return Response.json({ error: validation.message }, { status: 400 })
  const user = await getAuthenticatedUser(req)
  const db = supabaseServer ?? supabaseForRequest(req)

  if (db && user) {
    const sessionResult = await db.from('sessions').upsert({ id: sessionId, user_id: user.id, last_active: new Date().toISOString() })
    if (sessionResult.error) return Response.json({ error: 'Could not save the conversation session.' }, { status: 500 })
    const messageResult = await db.from('messages').insert({ session_id: sessionId, role: 'user', content: messages.at(-1)?.content ?? '' })
    if (messageResult.error) return Response.json({ error: 'Could not save the conversation message.' }, { status: 500 })
  }

  const client = new LLMClient(byokProviders[provider])
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let fullOutput = ''
      try {
        for await (const token of client.chat(messages, model, sessionId, apiKey, { signal: req.signal, reasoningEffort, authToken: req.headers.get('authorization') ?? undefined, logUrl: `${req.nextUrl.origin}/api/ingest` })) {
          fullOutput += token
          controller.enqueue(encoder.encode(event({ text: token })))
        }
        if (db && user && fullOutput) {
          const messageResult = await db.from('messages').insert({ session_id: sessionId, role: 'assistant', content: fullOutput })
          if (messageResult.error) console.error('Could not save assistant message:', messageResult.error.message)
          await db.from('sessions').update({ last_active: new Date().toISOString() }).eq('id', sessionId).eq('user_id', user.id)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error generating response.'
        controller.enqueue(encoder.encode(event({ error: message })))
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
