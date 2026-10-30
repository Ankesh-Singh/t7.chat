import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { encryptProviderKey, decryptProviderKey } from '@/lib/security/crypto'
import { supabaseForRequest, supabaseServer } from '@/lib/supabase/server'
import type { Provider } from '@/lib/sdk/types'
import { validateProviderKey } from '@/lib/security/provider-key'

const providers: Provider[] = ['openai', 'anthropic', 'google', 'groq', 'mistral', 'xai', 'openrouter']

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return fallback
}

export async function GET(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: 'Provider key storage is not configured on the server.' }, { status: 503 })
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: 'Authentication required. Sign in again before loading provider keys.' }, { status: 401 })
  const db = supabaseForRequest(request) ?? supabaseServer
  if (!db) return NextResponse.json({ error: 'Provider key storage is not configured on the server.' }, { status: 503 })
  try {
    const { data, error } = await db.from('provider_keys').select('provider, encrypted_key, iv').eq('user_id', user.id)
    if (error) throw error
    const keys: Partial<Record<Provider, string>> = {}
    for (const row of data ?? []) {
      if (providers.includes(row.provider as Provider)) keys[row.provider as Provider] = await decryptProviderKey(row.encrypted_key, row.iv)
    }
    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Provider key load failed:', error)
    return NextResponse.json({ error: errorMessage(error, 'Unable to load provider keys.') }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: 'Provider key storage is not configured on the server.' }, { status: 503 })
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: 'Authentication required. Sign in again before saving a provider key.' }, { status: 401 })
  const db = supabaseForRequest(request) ?? supabaseServer
  if (!db) return NextResponse.json({ error: 'Provider key storage is not configured on the server.' }, { status: 503 })
  const body = await request.json() as { provider?: Provider; key?: string }
  if (!body.provider || !body.key) return NextResponse.json({ error: 'Provider and key are required.' }, { status: 400 })
  const validation = validateProviderKey(body.provider, body.key)
  if (!validation.valid) return NextResponse.json({ error: validation.message }, { status: 400 })
  try {
    const encrypted = await encryptProviderKey(validation.value)
    const record = { user_id: user.id, provider: body.provider, encrypted_key: encrypted.ciphertext, iv: encrypted.iv, updated_at: new Date().toISOString() }
    const existing = await db.from('provider_keys').select('id').eq('user_id', user.id).eq('provider', body.provider).maybeSingle()
    if (existing.error) throw existing.error
    const result = existing.data
      ? await db.from('provider_keys').update(record).eq('id', existing.data.id)
      : await db.from('provider_keys').insert(record)
    if (result.error) throw result.error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Provider key save failed:', error)
    return NextResponse.json({ error: errorMessage(error, 'Unable to save provider key.') }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: 'Provider key storage is not configured on the server.' }, { status: 503 })
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: 'Authentication required. Sign in again before removing a provider key.' }, { status: 401 })
  const db = supabaseForRequest(request) ?? supabaseServer
  if (!db) return NextResponse.json({ error: 'Provider key storage is not configured on the server.' }, { status: 503 })
  const body = await request.json() as { provider?: Provider }
  if (!body.provider || !providers.includes(body.provider)) return NextResponse.json({ error: 'Provider is required.' }, { status: 400 })
  const { error } = await db.from('provider_keys').delete().eq('user_id', user.id).eq('provider', body.provider)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
