export type Provider = 'openai' | 'anthropic' | 'google' | 'groq' | 'mistral' | 'xai' | 'openrouter'

export type ModelId = string
export type ReasoningEffort = 'low' | 'medium' | 'high'

export interface ChatOptions {
  signal?: AbortSignal
  reasoningEffort?: ReasoningEffort
  authToken?: string
}

export interface LLMProvider {
  id: Provider
  chat(messages: ChatMessage[], model: ModelId, apiKey: string, options?: ChatOptions): AsyncGenerator<string>
}
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ModelOption {
  id: ModelId
  label: string
  provider: Provider
  description?: string
  contextWindow?: number
  capabilities?: string[]
  isDynamic?: boolean
}

export interface InferenceLog {
  session_id: string
  provider: Provider
  model: ModelId
  latency_ms: number
  prompt_tokens: number
  completion_tokens: number
  status: 'success' | 'error'
  input_preview: string
  output_preview: string
  error?: string
}
