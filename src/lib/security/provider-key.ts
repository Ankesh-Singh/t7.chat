import type { Provider } from '@/lib/sdk/types'

const allowedProviders: Provider[] = ['openai', 'anthropic', 'google', 'groq', 'mistral', 'xai', 'openrouter']
type KeyValidation = { valid: true; value: string } | { valid: false; message: string }

export function validateProviderKey(provider: string, rawKey: string): KeyValidation {
  const key = rawKey.trim()
  if (!allowedProviders.includes(provider as Provider)) return { valid: false, message: 'Unsupported provider.' as const }
  if (!key) return { valid: false, message: 'Enter an API key.' as const }
  if (key.length < 16) return { valid: false, message: 'API keys must be at least 16 characters.' as const }
  if (key.length > 512) return { valid: false, message: 'API keys must be 512 characters or fewer.' as const }
  if (/\s/.test(key)) return { valid: false, message: 'API keys cannot contain spaces or line breaks.' as const }
  if (/^(?:https?:\/\/|www\.)/i.test(key) || /[\\/]/.test(key)) return { valid: false, message: 'Enter the API key value, not a provider URL.' as const }
  return { valid: true, value: key }
}
