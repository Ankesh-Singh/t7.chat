'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Check, KeyRound, MessageSquare, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useConversations } from '@/hooks/useConversations'
import type { StoredConversation } from '@/hooks/useChat'
import type { ChatMessage } from '@/lib/sdk/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  currentSessionId: string
  onResume: (id: string, messages: ChatMessage[]) => void
  onNew: () => void
  onClose: () => void
  onOpenSettings: () => void
}
export default function ConversationList({ currentSessionId, onResume, onNew, onClose, onOpenSettings }: Props) {
  const { sessions, resume, cancel, rename } = useConversations()
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [pendingDelete, setPendingDelete] = useState<StoredConversation | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('')
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const filtered = sessions.filter(session => {
    if (!normalizedQuery) return true
    const messageText = session.messages.map(message => message.content).join(' ')
    return `${session.title} ${messageText}`.toLowerCase().includes(normalizedQuery)
  })

  const openConversation = async (id: string) => {
    if (editingId) return
    onResume(id, await resume(id))
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-12 items-center justify-between px-3">
        <button onClick={onNew} className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Image src="/applogo.png" alt="T7 Chat" width={28} height={28} className="h-7 w-7 rounded-lg object-cover" />
          T7 Chat
        </button>
        <button onClick={onClose} className="icon-button md:hidden" aria-label="Close sidebar"><X /></button>
      </div>

      <div className="px-3 pb-2">
        <button onClick={onNew} className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-xs font-semibold shadow-xs transition-colors hover:bg-muted">
          <Plus className="h-3.5 w-3.5" />
          New chat
          <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">Ctrl K</span>
        </button>
      </div>

      <div className="px-3 pb-2">
        <label className="flex h-8 items-center gap-2 rounded-lg border border-transparent px-2.5 text-muted-foreground transition-colors focus-within:border-border focus-within:bg-muted/70">
          <Search className="h-3.5 w-3.5" />
          <input
            ref={searchRef}
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search sessions"
            aria-label="Search sessions"
            className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query && <button type="button" onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground" aria-label="Clear session search"><X className="h-3 w-3" /></button>}
        </label>
      </div>

      <div className="flex items-center justify-between px-4 pb-2 pt-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">Recent sessions</span>
        <span className="text-[10px] tabular-nums text-muted-foreground/50">{filtered.length}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {filtered.length === 0 && (
          <div className="mx-2 mt-8 flex flex-col items-center rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <MessageSquare className="mb-2 h-5 w-5 text-muted-foreground/50" />
            <p className="text-xs font-medium">{query ? 'No matches' : 'No conversations yet'}</p>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{query ? 'Try a different search.' : 'Your chats will appear here.'}</p>
          </div>
        )}

        {filtered.map(session => (
          <div
            key={session.id}
            className={`group mb-0.5 flex items-center rounded-lg px-2.5 py-2 transition-colors ${
              session.id === currentSessionId ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/70'
            }`}
          >
            {editingId === session.id ? (
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <input
                  autoFocus
                  value={editValue}
                  onChange={event => setEditValue(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && editValue.trim()) {
                      rename(session.id, editValue.trim())
                      setEditingId(null)
                    }
                    if (event.key === 'Escape') setEditingId(null)
                  }}
                  className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-foreground/30"
                />
                <button
                  onClick={() => {
                    if (editValue.trim()) rename(session.id, editValue.trim())
                    setEditingId(null)
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Save title"
                ><Check className="h-3.5 w-3.5" /></button>
              </div>
            ) : (
              <>
                <button onClick={() => openConversation(session.id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[13px] font-medium">{session.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-md p-1.5 text-muted-foreground opacity-0 hover:bg-background group-hover:opacity-100 data-[state=open]:opacity-100" aria-label="Conversation options">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 rounded-lg">
                    <DropdownMenuItem onClick={() => {
                      setEditValue(session.title)
                      setEditingId(session.id)
                    }}>
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPendingDelete(session)} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-border/70 p-2.5">
        <button onClick={onOpenSettings} className="mb-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
          <KeyRound className="h-3.5 w-3.5" /> Connect provider keys
        </button>
        <div className="flex items-center gap-1 rounded-lg px-1">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">G</span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">Guest workspace</p>
              <p className="text-[10px] text-muted-foreground">Saved on this device</p>
            </div>
          </div>
        </div>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" role="presentation">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-session-title" className="w-full max-w-sm rounded-2xl border border-border bg-popover p-5 shadow-2xl">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></div>
            <h2 id="delete-session-title" className="text-sm font-semibold">Delete this session?</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">“{pendingDelete.title}” will be removed from this device. This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="h-8 rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted">Keep session</button>
              <button type="button" onClick={() => { void cancel(pendingDelete.id); setPendingDelete(null) }} className="h-8 rounded-lg bg-destructive px-3 text-xs font-semibold text-destructive-foreground hover:opacity-90">Delete session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
