import type { LLMProvider, ChatMessage, ModelId, InferenceLog } from './types'
import { sendLog } from './logger'
import { redactPII } from '../pii'

export class LLMClient {
  constructor(private provider: LLMProvider) {}

  async *chat(messages: ChatMessage[], model: ModelId, sessionId: string, apiKey: string, signal?: AbortSignal) {
    const start = Date.now()
    let output = ''
    let status: InferenceLog['status'] = 'success'
    let error: string | undefined

    try {
      for await (const token of this.provider.chat(messages, model, apiKey, signal)) {
        output += token
        yield token
      }
    } catch (e) {
      status = 'error'
      error = e instanceof Error ? e.message : 'unknown'
      throw e
    } finally {
      const log: InferenceLog = {
        session_id: sessionId,
        provider: this.provider.id,
        model,
        latency_ms: Date.now() - start,
        prompt_tokens: estimateTokens(messages),
        completion_tokens: estimateTokens([{ role: 'assistant', content: output }]),
        status,
        input_preview: redactPII(messages.at(-1)?.content ?? '').slice(0, 100),
        output_preview: redactPII(output).slice(0, 100),
        error,
      }
      sendLog(log)
    }
  }
}

function estimateTokens(messages: ChatMessage[]) {
  return Math.ceil(messages.reduce((n, m) => n + m.content.length, 0) / 4)
}
