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
  const { id } = await req.json()
  const headers = { 'Cache-Control': 'private, no-store' }
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ id }, { headers })
  const db = supabaseServer ?? supabaseForRequest(req)
  if (!db) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503, headers })
  const { data, error } = await db
    .from('sessions')
    .insert({ id, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers })
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
