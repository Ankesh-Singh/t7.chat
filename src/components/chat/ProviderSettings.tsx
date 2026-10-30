'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Check, Eye, EyeOff, ExternalLink, KeyRound, ShieldCheck, Trash2, X } from 'lucide-react'
import { PROVIDERS, providerConfig } from '@/constants/models'
import type { Provider } from '@/lib/sdk/types'
import type { User } from '@supabase/supabase-js'
import { useToast } from '@/components/ui/toast'
import { validateProviderKey } from '@/lib/security/provider-key'

const providerLogos: Partial<Record<Provider, string>> = {
  openai: '/provider/openai.svg', anthropic: '/provider/anthropic.svg', google: '/provider/gemini.svg',
  groq: '/provider/groq.svg', mistral: '/provider/mistral.svg', xai: '/provider/grok.svg',
}

interface Props {
  keys: Partial<Record<Provider, string>>
  onSave: (provider: Provider, key: string) => void | Promise<void>
  onClear: (provider: Provider) => void | Promise<void>
  onClose: () => void
  user?: User | null
}

export default function ProviderSettings({ keys, onSave, onClear, onClose, user }: Props) {
  const [active, setActive] = useState<Provider>('openai')
  const [draft, setDraft] = useState(keys.openai || '')
  const [showKey, setShowKey] = useState(false)
  const [validating, setValidating] = useState(false)
  const { toast } = useToast()
  const config = providerConfig(active)

  const selectProvider = (provider: Provider) => {
    setActive(provider)
    setDraft(keys[provider] || '')
    setShowKey(false)
  }

  const save = async () => {
    const validation = validateProviderKey(active, draft)
    if (!validation.valid) {
      toast(validation.message, 'error')
      return
    }
    setValidating(true)
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: active, apiKey: validation.value }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(body?.error || `The ${config?.label} key could not be verified.`)
      }
      await onSave(active, validation.value)
      toast(`${config?.label} key ${user ? 'encrypted and synced to your account' : 'connected for this browser session'}.`, 'success')
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : 'Unable to verify provider key.', 'error')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm">
      <div className="flex max-h-[min(700px,calc(100dvh-2rem))] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <aside className="hidden w-48 shrink-0 border-r border-border bg-sidebar p-2 sm:block">
          <p className="px-2.5 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Providers</p>
          {PROVIDERS.map(provider => (
            <button
              key={provider.id}
              onClick={() => selectProvider(provider.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${active === provider.id ? 'bg-sidebar-accent text-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'}`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card text-[9px]">
                {providerLogos[provider.id] ? <Image src={providerLogos[provider.id] as string} alt="" width={16} height={16} className="provider-logo h-4 w-4 object-contain" /> : provider.shortLabel}
              </span>
              <span className="min-w-0 flex-1 truncate">{provider.label}</span>
              {keys[provider.id] && <Check className="h-3.5 w-3.5 text-emerald-600" />}
            </button>
          ))}
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex items-start justify-between border-b border-border px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Connect your AI providers</h2>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{user ? 'Keys are encrypted before they are stored and scoped to your account.' : 'Keys stay in this browser session and are sent only to the selected provider request.'}</p>
            </div>
            <button onClick={onClose} className="icon-button" aria-label="Close settings"><X /></button>
          </header>

          <div className="space-y-5 overflow-y-auto p-5">
            <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden">
              {PROVIDERS.map(provider => (
                <button key={provider.id} onClick={() => selectProvider(provider.id)} className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs ${active === provider.id ? 'border-foreground/30 bg-muted font-medium' : 'border-border text-muted-foreground'}`}>
                  {provider.label}
                </button>
              ))}
            </div>

            <div>
              <p className="text-base font-semibold">{config?.label} API key</p>
              <p className="mt-1 text-sm text-muted-foreground">{config?.description}. Add your own key to unlock the live model catalog.</p>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-muted-foreground">API key</span>
              <input
                type={showKey ? 'text' : 'password'}
                value={draft}
                onChange={event => setDraft(event.target.value)}
                placeholder={`Paste your ${config?.label} key`}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-foreground/35 focus:ring-2 focus:ring-ring/20"
                autoComplete="off"
              />
              <button type="button" onClick={() => setShowKey(value => !value)} className="relative float-right -mt-8 mr-2 rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label={showKey ? 'Hide API key' : 'Show API key'}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </label>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>BYOK only: {user ? 'T7 encrypts your key before storing it and never exposes it to other users.' : 'T7 never ships a provider key or persists yours on the server.'}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <a href={config?.keyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                  Get a key <ExternalLink className="h-3 w-3" />
                </a>
                {keys[active] && (
                    <button onClick={async () => { try { await onClear(active); setDraft(''); toast(`${config?.label} key removed from this browser session.`, 'info') } catch (cause) { toast(cause instanceof Error ? cause.message : 'Unable to remove provider key.', 'error') } }} className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
              <button onClick={save} disabled={!draft.trim() || validating} className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-xs font-semibold text-background transition-opacity disabled:opacity-40">
                {validating ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background/30 border-t-background" /> : <Check className="h-3.5 w-3.5" />} {validating ? 'Checking…' : 'Save key'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

