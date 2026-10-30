import { NextRequest, NextResponse } from 'next/server'
import { supabaseForRequest, supabaseServer } from '@/lib/supabase/server'
import { redactPII } from '@/lib/pii'
import { getAuthenticatedUser } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const user = await getAuthenticatedUser(req)
    const db = supabaseServer ?? supabaseForRequest(req)
    if (!db) return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
    const { session_id, provider, model, latency_ms, prompt_tokens, completion_tokens, status, error: logErrorInput } = body

    if (!session_id || !provider || !model || model === 'EMPTY') {
      return NextResponse.json({ ok: true })
    }

    const payload = {
      session_id,
      user_id: user?.id ?? null,
      provider,
      model,
      latency_ms,
      prompt_tokens,
      completion_tokens,
      status,
      input_preview: redactPII(body.input_preview ?? ''),
      output_preview: redactPII(body.output_preview ?? ''),
    }

    const { error } = await db.from('inference_logs').insert(payload)

    if (error) {
      await db.from('failed_logs').insert({
        payload: { ...payload, error: typeof logErrorInput === 'string' ? redactPII(logErrorInput).slice(0, 500) : null },
        error: error.message,
      })
    }
  } catch {
    // intentionally silent
  }

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
