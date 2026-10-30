import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/server'
import { supabaseForRequest, supabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const responseHeaders = { 'Cache-Control': 'private, no-store' }

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401, headers: responseHeaders })
  const db = supabaseForRequest(request) ?? supabaseServer
  if (!db) return NextResponse.json({ error: 'Database is not configured.' }, { status: 503, headers: responseHeaders })

  const requestedLimit = Number(request.nextUrl.searchParams.get('limit') || 100)
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), 200) : 100
  const { data, error } = await db
    .from('inference_logs')
    .select('id, session_id, user_id, provider, model, latency_ms, prompt_tokens, completion_tokens, status, input_preview, output_preview, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: responseHeaders })
  return NextResponse.json(data ?? [], { headers: responseHeaders })
}
