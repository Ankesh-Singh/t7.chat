import type { ChatMessage, LLMProvider, ModelId, Provider } from '../types'

type JsonRecord = Record<string, unknown>

function parseSse(buffer: string) {
  return buffer.split('\n\n').map(block => block.split('\n').find(line => line.startsWith('data: '))?.slice(6)).filter(Boolean) as string[]
}

async function* streamSse(response: Response, readToken: (data: JsonRecord) => string | undefined) {
  if (!response.body) throw new Error('Provider returned an empty response.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''
    for (const data of parseSse(blocks.join('\n\n'))) {
      if (data === '[DONE]') return
      const parsed = JSON.parse(data) as JsonRecord
      if (parsed.type === 'error' || parsed.error) {
        const error = parsed.error as JsonRecord | string | undefined
        throw new Error(typeof error === 'string' ? error : String(error && (error.message || error.type) || 'Provider streaming error.'))
      }
      const token = readToken(parsed)
      if (token) yield token
    }
  }
}

async function checkedFetch(url: string, init: RequestInit) {
  const response = await fetch(url, init)
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Provider request failed (${response.status}): ${detail.slice(0, 240)}`)
  }
  return response
}

function authHeaders(apiKey: string) {
  return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
}

function openAICompatible(id: Provider, baseUrl: string): LLMProvider {
  return {
    id,
    async *chat(messages: ChatMessage[], model: ModelId, apiKey: string, signal?: AbortSignal) {
      const response = await checkedFetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: authHeaders(apiKey),
        body: JSON.stringify({ model, messages, stream: true }),
        signal,
      })
      yield* streamSse(response, data => {
        const choices = data.choices as JsonRecord[] | undefined
        const delta = choices?.[0]?.delta as JsonRecord | undefined
        return typeof delta?.content === 'string' ? delta.content : undefined
      })
    },
  }
}

export const byokProviders: Record<Provider, LLMProvider> = {
  openai: {
    id: 'openai',
    async *chat(messages, model, apiKey, signal) {
      const response = await checkedFetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: authHeaders(apiKey),
        body: JSON.stringify({ model, input: messages, stream: true }),
        signal,
      })
      yield* streamSse(response, data => data.type === 'response.output_text.delta' && typeof data.delta === 'string' ? data.delta : undefined)
    },
  },
  anthropic: {
    id: 'anthropic',
    async *chat(messages, model, apiKey, signal) {
      const response = await checkedFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 4096, messages, stream: true }),
        signal,
      })
      yield* streamSse(response, data => {
        const delta = data.delta as JsonRecord | undefined
        return data.type === 'content_block_delta' && typeof delta?.text === 'string' ? delta.text : undefined
      })
    },
  },
  google: {
    id: 'google',
    async *chat(messages, model, apiKey, signal) {
      const contents = messages.map(message => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      }))
      const response = await checkedFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
        signal,
      })
      yield* streamSse(response, data => {
        const candidates = data.candidates as JsonRecord[] | undefined
        const content = candidates?.[0]?.content as JsonRecord | undefined
        const parts = content?.parts as JsonRecord[] | undefined
        return typeof parts?.[0]?.text === 'string' ? parts[0].text : undefined
      })
    },
  },
  groq: openAICompatible('groq', 'https://api.groq.com/openai/v1'),
  mistral: openAICompatible('mistral', 'https://api.mistral.ai/v1'),
  xai: openAICompatible('xai', 'https://api.x.ai/v1'),
  openrouter: openAICompatible('openrouter', 'https://openrouter.ai/api/v1'),
}

