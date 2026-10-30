export interface SessionRow {
  id: string
  user_id?: string | null
  created_at: string
  last_active: string
  cancelled: boolean
}

export interface MessageRow {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface InferenceLogRow {
  id: string
  session_id: string | null
  user_id?: string | null
  provider: string
  model: string
  latency_ms: number
  prompt_tokens: number
  completion_tokens: number
  status: string
  input_preview: string
  output_preview: string
  error?: string | null
  created_at: string
}

export interface FailedLogRow {
  id: string
  payload: Record<string, unknown>
  error: string
  created_at: string
}
