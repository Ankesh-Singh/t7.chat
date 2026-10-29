'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const client = getSupabaseBrowser()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(client))
  const [configured] = useState(Boolean(client))

  useEffect(() => {
    if (!client) return
    let active = true
    const refresh = () => client.auth.getSession().then(({ data }) => {
      if (active) {
        setUser(data.session?.user ?? null)
        setLoading(false)
      }
    })
    void refresh()
    const onAuthRefresh = () => { void refresh() }
    window.addEventListener('t7-auth-refresh', onAuthRefresh)
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => {
      active = false
      window.removeEventListener('t7-auth-refresh', onAuthRefresh)
      listener.subscription.unsubscribe()
    }
  }, [client])

  const signIn = async (email: string, password: string) => {
    if (!client) throw new Error('Authentication is not configured.')
    const result = await client.auth.signInWithPassword({ email, password })
    if (result.error) throw result.error
  }

  const signUp = async (email: string, password: string) => {
    if (!client) throw new Error('Authentication is not configured.')
    const result = await client.auth.signUp({ email, password })
    if (result.error) throw result.error
    return Boolean(result.data.session)
  }

  const signOut = async () => {
    if (!client) return
    const { error } = await client.auth.signOut()
    if (error) throw error
  }

  return { user, loading, configured, signIn, signUp, signOut }
}
