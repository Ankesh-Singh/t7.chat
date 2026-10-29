import { getSupabaseBrowser } from '@/lib/supabase/client'

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const client = getSupabaseBrowser()
  if (!client) return {}
  const { data } = await client.auth.getSession()
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}
}
