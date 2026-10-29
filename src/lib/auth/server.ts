import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function getAuthenticatedUser(request: NextRequest) {
  if (!supabaseServer) return null
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const { data } = await supabaseServer.auth.getUser(token)
  return data.user ?? null
}
