import type { ModelOption, Provider } from '@/lib/sdk/types'

export interface ProviderConfig {
  id: Provider
  label: string
  shortLabel: string
  description: string
  docsUrl: string
  keyUrl: string
  modelsUrl: string
}
export const PROVIDERS: ProviderConfig[] = [
  { id: 'openai', label: 'OpenAI', shortLabel: 'OA', description: 'GPT and reasoning models', docsUrl: 'https://platform.openai.com/docs', keyUrl: 'https://platform.openai.com/api-keys', modelsUrl: 'https://api.openai.com/v1/models' },
  { id: 'anthropic', label: 'Anthropic', shortLabel: 'A', description: 'Claude models', docsUrl: 'https://docs.anthropic.com', keyUrl: 'https://console.anthropic.com/settings/keys', modelsUrl: 'https://api.anthropic.com/v1/models' },
  { id: 'google', label: 'Google', shortLabel: 'G', description: 'Gemini models', docsUrl: 'https://ai.google.dev/gemini-api/docs', keyUrl: 'https://aistudio.google.com/apikey', modelsUrl: 'https://generativelanguage.googleapis.com/v1beta/models' },
  { id: 'groq', label: 'Groq', shortLabel: 'GQ', description: 'Fast open models', docsUrl: 'https://console.groq.com/docs', keyUrl: 'https://console.groq.com/keys', modelsUrl: 'https://api.groq.com/openai/v1/models' },
  { id: 'mistral', label: 'Mistral', shortLabel: 'M', description: 'Mistral and open models', docsUrl: 'https://docs.mistral.ai', keyUrl: 'https://console.mistral.ai/api-keys', modelsUrl: 'https://api.mistral.ai/v1/models' },
  { id: 'xai', label: 'xAI', shortLabel: 'xAI', description: 'Grok models', docsUrl: 'https://docs.x.ai', keyUrl: 'https://console.x.ai', modelsUrl: 'https://api.x.ai/v1/models' },
  { id: 'openrouter', label: 'OpenRouter', shortLabel: 'OR', description: 'One key for many providers', docsUrl: 'https://openrouter.ai/docs', keyUrl: 'https://openrouter.ai/settings/keys', modelsUrl: 'https://openrouter.ai/api/v1/models' },
]

export const DEFAULT_MODEL: ModelOption = {
  id: 'gpt-6.1-sol',
  label: 'GPT-6.1 Sol',
  provider: 'openai',
  description: 'Balanced intelligence, speed, and cost',
}

export const FALLBACK_MODELS: ModelOption[] = [
  DEFAULT_MODEL,
  { id: 'gpt-6-astra', label: 'GPT-6 Astra', provider: 'openai', description: 'Highest intelligence for demanding work' },
  { id: 'gpt-6.1-terra', label: 'GPT-6.1 Terra', provider: 'openai', description: 'Fast visual reasoning and clear writing' },
  { id: 'gpt-6-luna', label: 'GPT-6 Luna', provider: 'openai', description: 'Fast, focused, cost-sensitive work' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', provider: 'anthropic', description: 'Fast Claude model for everyday work' },
  { id: 'claude-opus-5', label: 'Claude Opus 5', provider: 'anthropic', description: 'Anthropic model for demanding agentic work' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', provider: 'google', description: 'Fast multimodal reasoning' },
  { id: 'gemini-3.8-pro', label: 'Gemini 3.8 Pro', provider: 'google', description: 'Advanced reasoning and long context' },
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', provider: 'groq', description: 'Large open-weight reasoning model' },
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B', provider: 'groq', description: 'Fast open-weight reasoning' },
  { id: 'mistral-large-latest', label: 'Mistral Large', provider: 'mistral', description: 'General-purpose Mistral model' },
  { id: 'grok-4', label: 'Grok 4', provider: 'xai', description: 'xAI reasoning and coding model' },
]

export function providerConfig(provider: Provider) {
  return PROVIDERS.find(item => item.id === provider)
}

export function providerLabel(provider: Provider) {
  return providerConfig(provider)?.label ?? provider
}
