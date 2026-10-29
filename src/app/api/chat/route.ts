import { NextRequest } from 'next/server'
import { LLMClient } from '@/lib/sdk'
import { byokProviders } from '@/lib/sdk/providers/byok'
import { PROVIDERS } from '@/constants/models'
import type { ChatMessage, Provider, ReasoningEffort } from '@/lib/sdk/types'
import { supabaseServer } from '@/lib/supabase/server'
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

  if (supabaseServer && user) {
    await supabaseServer.from('sessions').upsert({ id: sessionId, user_id: user.id, last_active: new Date().toISOString() })
    await supabaseServer.from('messages').insert({ session_id: sessionId, role: 'user', content: messages.at(-1)?.content ?? '' })
  }

  const client = new LLMClient(byokProviders[provider])
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let fullOutput = ''
      try {
        for await (const token of client.chat(messages, model, sessionId, apiKey, { signal: req.signal, reasoningEffort })) {
          fullOutput += token
          controller.enqueue(encoder.encode(event({ text: token })))
        }
        if (supabaseServer && user && fullOutput) {
          await supabaseServer.from('messages').insert({ session_id: sessionId, role: 'assistant', content: fullOutput })
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
