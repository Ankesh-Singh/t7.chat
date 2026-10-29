'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowUp, Check, ChevronDown, Filter, Loader2, Search, Settings2, Square, Sparkles } from 'lucide-react'
import type { ModelOption, Provider } from '@/lib/sdk/types'
import { FALLBACK_MODELS, PROVIDERS } from '@/constants/models'
import { useToast } from '@/components/ui/toast'

const PROVIDER_LOGOS: Partial<Record<Provider, string>> = {
  openai: '/provider/openai.svg',
  anthropic: '/provider/anthropic.svg',
  google: '/provider/gemini.svg',
  groq: '/provider/groq.svg',
  mistral: '/provider/mistral.svg',
  xai: '/provider/grok.svg',
}

interface Props {
  onSend: (content: string) => void
  onStop: () => void
  isStreaming: boolean
  model: ModelOption
  setModel: (model: ModelOption) => void
  keys: Partial<Record<Provider, string>>
  onOpenSettings: () => void
}
export default function ChatInput({ onSend, onStop, isStreaming, model, setModel, keys, onOpenSettings }: Props) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [providerTab, setProviderTab] = useState<Provider>(model.provider)
  const [models, setModels] = useState<ModelOption[]>(FALLBACK_MODELS)
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null)
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const activeModel = model

  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus()
  }, [isStreaming])

  const refreshProvider = async (provider: Provider) => {
    if (!keys[provider]) return
    setLoadingProvider(provider)
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: keys[provider] }),
      })
      const data = await response.json() as { models?: ModelOption[] }
      const liveModels = data.models
      if (Array.isArray(liveModels) && liveModels.length) {
        setModels(previous => [...previous.filter(item => item.provider !== provider), ...liveModels])
      }
    } catch {
      toast(`Could not load the live ${PROVIDERS.find(item => item.id === provider)?.label} catalog. Check your key or try again.`, 'error')
    } finally {
      setLoadingProvider(null)
    }
  }

  const openPicker = () => {
    setOpen(value => !value)
    if (!open) void refreshProvider(model.provider)
  }

  const selectProvider = (provider: Provider) => {
    setProviderTab(provider)
    setQuery('')
    void refreshProvider(provider)
  }

  const visibleModels = useMemo(() => models.filter(item => item.provider === providerTab && (
    !query || item.label.toLowerCase().includes(query.toLowerCase()) || item.id.toLowerCase().includes(query.toLowerCase())
  )), [models, providerTab, query])

  const resize = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
  }

  const submit = () => {
    const content = value.trim()
    if (!content || isStreaming) return
    onSend(content)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  return (
    <div className="relative shrink-0 bg-gradient-to-t from-background via-background to-transparent px-3 pb-3 pt-2 md:px-6 md:pb-5">
      {open && (
        <div className="model-popover absolute bottom-[calc(100%-0.25rem)] left-3 right-3 z-50 mx-auto flex max-h-[min(570px,calc(100dvh-7rem))] max-w-3xl overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl md:left-6 md:right-6">
          <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-sidebar/70 py-2 sm:w-16">
            {PROVIDERS.map(provider => (
              <button
                key={provider.id}
                onClick={() => selectProvider(provider.id)}
                title={provider.label}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-[10px] font-semibold transition-colors ${providerTab === provider.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                {PROVIDER_LOGOS[provider.id] ? (
                  <Image src={PROVIDER_LOGOS[provider.id] as string} alt="" width={19} height={19} className="h-5 w-5 object-contain opacity-85" />
                ) : provider.shortLabel}
                {keys[provider.id] && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              </button>
            ))}
            <div className="mt-auto border-t border-border pt-2">
              <button onClick={onOpenSettings} className="icon-button" title="Manage API keys"><Settings2 /></button>
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            <header className="border-b border-border bg-card/50 px-4 pb-3 pt-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Choose a model</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Live catalog from {PROVIDERS.find(item => item.id === providerTab)?.label}</p>
                </div>
                <button onClick={onOpenSettings} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Settings2 className="h-3 w-3" /> API keys
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-input bg-background px-2.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search models…"
                  className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <Filter className="h-3.5 w-3.5 text-muted-foreground/60" />
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
              {!keys[providerTab] && (
                <button onClick={onOpenSettings} className="mb-2 flex w-full items-center gap-3 rounded-xl border border-dashed border-border px-3 py-3 text-left hover:bg-muted">
                  <KeyIcon />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold">Connect {PROVIDERS.find(item => item.id === providerTab)?.label}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">Add your own key to load every model available to your account.</span>
                  </span>
                  <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" />
                </button>
              )}

              {loadingProvider === providerTab && (
                <div className="flex items-center justify-center gap-2 py-12 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading live models…
                </div>
              )}

              {!loadingProvider && visibleModels.map(item => (
                <button
                  key={`${item.provider}:${item.id}`}
                  onClick={() => { setModel(item); setOpen(false) }}
                  className={`group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted ${model.id === item.id && model.provider === item.provider ? 'bg-muted' : ''}`}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border bg-card text-[9px] font-semibold text-muted-foreground">
                    {PROVIDER_LOGOS[item.provider] ? (
                      <Image src={PROVIDER_LOGOS[item.provider] as string} alt="" width={14} height={14} className="h-3.5 w-3.5 object-contain" />
                    ) : item.provider === 'openai' ? '✦' : PROVIDERS.find(provider => provider.id === item.provider)?.shortLabel}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span className="truncate">{item.label}</span>
                      {model.id === item.id && model.provider === item.provider && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-muted-foreground">{item.description || item.id}</span>
                  </span>
                  {item.contextWindow && <span className="hidden shrink-0 text-[10px] text-muted-foreground/60 sm:block">{Math.round(item.contextWindow / 1000)}k</span>}
                </button>
              ))}

              {!loadingProvider && visibleModels.length === 0 && (
                <div className="py-12 text-center text-xs text-muted-foreground">No chat models found. Add a key or refresh the provider catalog.</div>
              )}
            </div>
          </section>
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        <div className="composer">
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            maxLength={16000}
            placeholder="Ask anything…"
            aria-label="Message"
            onChange={event => { setValue(event.target.value); resize() }}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            }}
            className="max-h-[180px] min-h-12 w-full resize-none bg-transparent px-4 pb-2 pt-3.5 text-[15px] leading-6 outline-none placeholder:text-muted-foreground/70"
          />

          <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
            <button disabled={isStreaming} onClick={openPicker} className="model-trigger" aria-expanded={open}>
              <Sparkles className="h-3.5 w-3.5" />
              <span className="max-w-44 truncate">{activeModel.label}</span>
              <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] text-muted-foreground/70 sm:block">Enter to send</span>
              {isStreaming ? (
                <button onClick={onStop} className="send-button" aria-label="Stop response"><Square className="h-3.5 w-3.5 fill-current" /></button>
              ) : (
                <button onClick={submit} disabled={!value.trim()} className="send-button" aria-label="Send message"><ArrowUp className="h-4 w-4" /></button>
              )}
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground/70">Your keys stay in this browser session. Models can make mistakes.</p>
      </div>
    </div>
  )
}

function KeyIcon() {
  return <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-xs">🔑</span>
}
