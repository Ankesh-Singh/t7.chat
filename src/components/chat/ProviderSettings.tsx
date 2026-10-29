'use client'

import { useState } from 'react'
import { Check, ExternalLink, KeyRound, ShieldCheck, Trash2, X } from 'lucide-react'
import { PROVIDERS, providerConfig } from '@/constants/models'
import type { Provider } from '@/lib/sdk/types'
import { useToast } from '@/components/ui/toast'

interface Props {
  keys: Partial<Record<Provider, string>>
  onSave: (provider: Provider, key: string) => void
  onClear: (provider: Provider) => void
  onClose: () => void
}

export default function ProviderSettings({ keys, onSave, onClear, onClose }: Props) {
  const [active, setActive] = useState<Provider>('openai')
  const [draft, setDraft] = useState(keys.openai || '')
  const { toast } = useToast()
  const config = providerConfig(active)

  const selectProvider = (provider: Provider) => {
    setActive(provider)
    setDraft(keys[provider] || '')
  }

  const save = () => {
    onSave(active, draft)
    toast(`${config?.label} key connected for this browser session.`, 'success')
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
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card text-[9px]">{provider.shortLabel}</span>
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
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Keys are stored in this browser session and sent only to the selected provider request.</p>
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
                type="password"
                value={draft}
                onChange={event => setDraft(event.target.value)}
                placeholder={`Paste your ${config?.label} key`}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-foreground/35 focus:ring-2 focus:ring-ring/20"
                autoComplete="off"
              />
            </label>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>BYOK only: T7 never ships a provider key and does not persist yours on the server.</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <a href={config?.keyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                  Get a key <ExternalLink className="h-3 w-3" />
                </a>
                {keys[active] && (
                    <button onClick={() => { onClear(active); setDraft(''); toast(`${config?.label} key removed from this browser session.`, 'info') }} className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </div>
              <button onClick={save} disabled={!draft.trim()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-xs font-semibold text-background transition-opacity disabled:opacity-40">
                <Check className="h-3.5 w-3.5" /> Save key
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

