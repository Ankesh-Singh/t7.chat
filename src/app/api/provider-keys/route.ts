import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { encryptProviderKey, decryptProviderKey } from '@/lib/security/crypto'
import { supabaseServer } from '@/lib/supabase/server'
import type { Provider } from '@/lib/sdk/types'

const providers: Provider[] = ['openai', 'anthropic', 'google', 'groq', 'mistral', 'xai', 'openrouter']

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  if (!user || !supabaseServer) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  try {
    const { data, error } = await supabaseServer.from('provider_keys').select('provider, encrypted_key, iv').eq('user_id', user.id)
    if (error) throw error
    const keys: Partial<Record<Provider, string>> = {}
    for (const row of data ?? []) {
      if (providers.includes(row.provider as Provider)) keys[row.provider as Provider] = await decryptProviderKey(row.encrypted_key, row.iv)
    }
    return NextResponse.json({ keys })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load provider keys.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  if (!user || !supabaseServer) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const body = await request.json() as { provider?: Provider; key?: string }
  if (!body.provider || !providers.includes(body.provider) || !body.key?.trim()) return NextResponse.json({ error: 'Provider and key are required.' }, { status: 400 })
  try {
    const encrypted = await encryptProviderKey(body.key.trim())
    const { error } = await supabaseServer.from('provider_keys').upsert({ user_id: user.id, provider: body.provider, encrypted_key: encrypted.ciphertext, iv: encrypted.iv, updated_at: new Date().toISOString() }, { onConflict: 'user_id,provider' })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save provider key.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  if (!user || !supabaseServer) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const body = await request.json() as { provider?: Provider }
  if (!body.provider || !providers.includes(body.provider)) return NextResponse.json({ error: 'Provider is required.' }, { status: 400 })
  const { error } = await supabaseServer.from('provider_keys').delete().eq('user_id', user.id).eq('provider', body.provider)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
