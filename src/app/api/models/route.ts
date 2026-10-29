import { NextRequest, NextResponse } from 'next/server'
import { providerConfig, FALLBACK_MODELS } from '@/constants/models'
import type { ModelOption, Provider } from '@/lib/sdk/types'

function isChatModel(id: string) {
  return !/(embedding|moderation|whisper|transcri|tts|realtime|image|audio|search-preview)/i.test(id)
}

function headersFor(provider: Provider, apiKey: string): Record<string, string> {
  if (provider === 'google') return { 'x-goog-api-key': apiKey }
  if (provider === 'anthropic') return { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
  return { Authorization: `Bearer ${apiKey}` }
}

export async function POST(req: NextRequest) {
  let body: { provider?: Provider; apiKey?: string }
  try {
    body = await req.json() as { provider?: Provider; apiKey?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const provider = body.provider
  const apiKey = body.apiKey?.trim()
  const config = provider && providerConfig(provider)
  if (!provider || !config || !apiKey) return NextResponse.json({ error: 'Provider and API key are required.' }, { status: 400 })

  try {
    const response = await fetch(config.modelsUrl, {
      headers: { ...headersFor(provider, apiKey), Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) {
      const detail = await response.text()
      return NextResponse.json({ error: `Could not load ${config.label} models (${response.status}). ${detail.slice(0, 180)}` }, { status: response.status })
    }
    const payload = await response.json() as Record<string, unknown>
    const raw = (payload.data ?? payload.models ?? []) as Record<string, unknown>[]
    const models: ModelOption[] = raw
      .map(item => {
        const rawId = String(item.id ?? item.name ?? '')
        const id = rawId.replace(/^models\//, '')
        const capabilities = Array.isArray(item.supportedGenerationMethods) ? item.supportedGenerationMethods.map(String) : []
        return { id, label: id, provider, description: String(item.owned_by ?? item.displayName ?? config.description), contextWindow: Number(item.context_window ?? item.inputTokenLimit ?? 0) || undefined, capabilities, isDynamic: true }
      })
      .filter(model => isChatModel(model.id) && (provider !== 'google' || model.capabilities.length === 0 || model.capabilities.includes('generateContent')))
      .slice(0, 200)
    return NextResponse.json({ provider, models })
  } catch (error) {
    const fallback = FALLBACK_MODELS.filter(model => model.provider === provider)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not reach provider.', models: fallback }, { status: 502 })
  }
}

