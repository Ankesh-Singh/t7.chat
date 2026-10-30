import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

function isServiceRoleKey(key: string) {
  try {
    const encoded = key.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
    if (!encoded) return false
    const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')
    const claims = JSON.parse(atob(padded)) as { role?: string }
    return claims.role === 'service_role'
  } catch {
    return false
  }
}

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseServer: SupabaseClient | null = process.env.NEXT_PUBLIC_SUPABASE_URL && serviceRoleKey && isServiceRoleKey(serviceRoleKey)
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey)
  : null

export function supabaseForRequest(request: NextRequest): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!url || !anonKey || !token) return null
  return createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
}
