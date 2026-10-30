import { NextRequest, NextResponse } from 'next/server'
import { supabaseForRequest, supabaseServer } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  const headers = { 'Cache-Control': 'private, no-store' }
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401, headers })
  const db = supabaseServer ?? supabaseForRequest(request)
  if (!db) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503, headers })
  const { data, error } = await db
    .from('sessions')
    .select('id, user_id, created_at, last_active, cancelled, messages(id, session_id, role, content, created_at)')
    .eq('user_id', user.id)
    .eq('cancelled', false)
    .order('last_active', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers })
  return NextResponse.json(data ?? [], { headers })
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { id?: string; messages?: Array<{ role?: string; content?: string }> }
  const id = body.id
  const headers = { 'Cache-Control': 'private, no-store' }
  if (!id || typeof id !== 'string') return NextResponse.json({ error: 'Session ID is required.' }, { status: 400, headers })
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ id }, { headers })
  const db = supabaseServer ?? supabaseForRequest(req)
  if (!db) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503, headers })
  const existing = await db.from('sessions').select('user_id').eq('id', id).maybeSingle()
  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500, headers })
  if (existing.data && existing.data.user_id !== user.id) return NextResponse.json({ error: 'This session belongs to another account.' }, { status: 409, headers })
  const { data, error } = await db
    .from('sessions')
    .upsert({ id, user_id: user.id, last_active: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers })
  const messages = (body.messages ?? [])
    .filter(message => (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string' && message.content.length <= 100_000)
    .map(message => ({ session_id: id, role: message.role as 'user' | 'assistant', content: message.content as string }))
  if (messages.length) {
    const existingMessage = await db.from('messages').select('id').eq('session_id', id).limit(1)
    if (!existingMessage.error && (existingMessage.data?.length ?? 0) === 0) {
      const messageResult = await db.from('messages').insert(messages)
      if (messageResult.error) return NextResponse.json({ error: messageResult.error.message }, { status: 500, headers })
    }
  }
  return NextResponse.json(data, { headers })
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json()
  const headers = { 'Cache-Control': 'private, no-store' }
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ ok: true }, { headers })
  const db = supabaseServer ?? supabaseForRequest(req)
  if (!db) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503, headers })
  const { error } = await db
    .from('sessions')
    .update({ cancelled: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers })
  return NextResponse.json({ ok: true }, { headers })
}
