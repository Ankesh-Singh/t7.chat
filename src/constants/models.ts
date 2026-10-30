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
  id: 'gpt-4.1-mini',
  label: 'GPT-4.1 Mini',
  provider: 'openai',
  description: 'Fast, economical coding and writing',
}

export const FALLBACK_MODELS: ModelOption[] = [
  DEFAULT_MODEL,
  { id: 'gpt-4.1', label: 'GPT-4.1', provider: 'openai', description: 'Strong general-purpose reasoning and coding' },
  { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', provider: 'openai', description: 'Lowest-cost GPT-4.1 for simple tasks' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', description: 'Multimodal general-purpose model' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai', description: 'Affordable multimodal everyday model' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'openai', description: 'High-capability GPT-4 model' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', provider: 'anthropic', description: 'Fast Claude model for everyday work' },
  { id: 'claude-opus-5', label: 'Claude Opus 5', provider: 'anthropic', description: 'Anthropic model for demanding agentic work' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', provider: 'anthropic', description: 'Fast, efficient Claude for high-volume work' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', provider: 'google', description: 'Fast multimodal reasoning' },
  { id: 'gemini-3.8-pro', label: 'Gemini 3.8 Pro', provider: 'google', description: 'Advanced reasoning and long context' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', provider: 'google', description: 'Cost-efficient, high-throughput responses' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite', provider: 'google', description: 'Low-cost model for everyday tasks' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', provider: 'google', description: 'Budget-friendly multimodal model' },
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', provider: 'groq', description: 'Large open-weight reasoning model' },
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B', provider: 'groq', description: 'Fast open-weight reasoning' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', provider: 'groq', description: 'Very fast, cost-efficient open model' },
  { id: 'mistral-large-latest', label: 'Mistral Large', provider: 'mistral', description: 'General-purpose Mistral model' },
  { id: 'mistral-small-latest', label: 'Mistral Small', provider: 'mistral', description: 'Efficient model for everyday tasks' },
  { id: 'ministral-8b-latest', label: 'Ministral 8B', provider: 'mistral', description: 'Small, fast, cost-efficient model' },
  { id: 'grok-4', label: 'Grok 4', provider: 'xai', description: 'xAI reasoning and coding model' },
  { id: 'grok-3-mini', label: 'Grok 3 Mini', provider: 'xai', description: 'Fast and economical reasoning model' },
  { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', provider: 'openrouter', description: 'Low-cost Gemini through OpenRouter' },
  { id: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B', provider: 'openrouter', description: 'Efficient open model through OpenRouter' },
]

export function providerConfig(provider: Provider) {
  return PROVIDERS.find(item => item.id === provider)
}

export function providerLabel(provider: Provider) {
  return providerConfig(provider)?.label ?? provider
}
