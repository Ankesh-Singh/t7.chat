import { NextRequest } from 'next/server'
import { supabaseForRequest, supabaseServer } from '@/lib/supabase/server'

export async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const client = supabaseForRequest(request) ?? supabaseServer
  if (!client) return null
  const { data } = await client.auth.getUser(token)
  return data.user ?? null
}
