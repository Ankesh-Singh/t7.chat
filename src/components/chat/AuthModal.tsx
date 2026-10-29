'use client'

import { FormEvent, useState } from 'react'
import { Loader2, LogIn, ShieldCheck, UserPlus, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/toast'

interface Props {
  onClose: () => void
}

export default function AuthModal({ onClose }: Props) {
  const { user, configured, signIn, signUp, signOut } = useAuth()
  const { toast } = useToast()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (mode === 'sign-in') {
        await signIn(email.trim(), password)
        window.dispatchEvent(new Event('t7-auth-refresh'))
        toast('Signed in successfully.', 'success')
        onClose()
      } else {
        const sessionReady = await signUp(email.trim(), password)
        window.dispatchEvent(new Event('t7-auth-refresh'))
        toast(sessionReady ? 'Account created and signed in.' : 'Account created. Check your email to confirm it.', 'success')
        onClose()
      }
    } catch (cause) {
      const rawMessage = cause instanceof Error ? cause.message : 'Authentication failed.'
      const message = /rate limit|email rate/i.test(rawMessage)
        ? 'Supabase email sending is temporarily rate-limited. Wait before trying again, or disable email confirmations in Supabase Auth for local testing.'
        : rawMessage
      setError(message)
      toast(message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
        <header className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              {user ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <LogIn className="h-4 w-4 text-muted-foreground" />}
              <h2 className="text-sm font-semibold">{user ? 'Your profile' : 'Sign in to T7 Chat'}</h2>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{user ? user.email : 'Sync sessions and encrypt provider keys to your account.'}</p>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Close authentication"><X /></button>
        </header>

        {user ? (
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/45 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">{(user.email?.[0] || 'U').toUpperCase()}</span>
              <div className="min-w-0"><p className="text-sm font-medium">{user.email}</p><p className="text-xs text-muted-foreground">Authenticated workspace</p></div>
            </div>
            <button onClick={async () => { await signOut(); toast('Signed out. Local guest mode is active.', 'info'); onClose() }} className="h-9 w-full rounded-lg border border-border text-xs font-semibold hover:bg-muted">Sign out</button>
          </div>
        ) : !configured ? (
          <div className="space-y-3 p-5">
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">Authentication is not configured. Add Supabase URL and anon key to enable email/password accounts.</p>
            <button onClick={onClose} className="h-9 w-full rounded-lg bg-foreground text-xs font-semibold text-background">Continue as guest</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 p-5">
            <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
              <button type="button" onClick={() => setMode('sign-in')} className={`flex-1 rounded-md py-1.5 ${mode === 'sign-in' ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}>Sign in</button>
              <button type="button" onClick={() => setMode('sign-up')} className={`flex-1 rounded-md py-1.5 ${mode === 'sign-up' ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}>Create account</button>
            </div>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</span><input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/20" autoComplete="email" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</span><input required minLength={8} type="password" value={password} onChange={event => setPassword(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/20" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} /></label>
            {error && <p className="rounded-lg bg-destructive/10 p-2.5 text-xs leading-5 text-destructive">{error}</p>}
            <button disabled={busy} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-xs font-semibold text-background disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{mode === 'sign-in' ? 'Sign in' : 'Create account'}</button>
            <p className="flex items-center gap-1.5 text-[10px] leading-4 text-muted-foreground"><UserPlus className="h-3 w-3" /> JWT sessions are issued by Supabase Auth and stored securely by the browser client.</p>
          </form>
        )}
      </div>
    </div>
  )
}
