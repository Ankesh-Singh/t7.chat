import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { redactPII } from '@/lib/pii'

export async function POST(req: NextRequest) {
  if (!supabaseServer) return NextResponse.json({ ok: true })
  try {
    const body = await req.json()
    const { session_id, provider, model, latency_ms, prompt_tokens, completion_tokens, status } = body

    if (!session_id || !provider || !model || model === 'EMPTY') {
      return NextResponse.json({ ok: true })
    }

    const payload = {
      session_id,
      provider,
      model,
      latency_ms,
      prompt_tokens,
      completion_tokens,
      status,
      input_preview: redactPII(body.input_preview ?? ''),
      output_preview: redactPII(body.output_preview ?? ''),
    }

    const { error } = await supabaseServer.from('inference_logs').insert(payload)

    if (error) {
      await supabaseServer.from('failed_logs').insert({
        payload,
        error: error.message,
      })
    }
  } catch {
    // intentionally silent
  }

  return NextResponse.json({ ok: true })
}
