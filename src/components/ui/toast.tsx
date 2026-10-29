'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
type ToastItem = { id: number; message: string; kind: ToastKind }
type ToastContextValue = { toast: (message: string, kind?: ToastKind) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random()
    setItems(current => [...current, { id, message, kind }].slice(-3))
    window.setTimeout(() => setItems(current => current.filter(item => item.id !== id)), 4200)
  }, [])
  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:w-80" aria-live="polite">
        {items.map(item => {
          const Icon = item.kind === 'success' ? CheckCircle2 : item.kind === 'error' ? XCircle : Info
          return (
            <div key={item.id} className="pointer-events-auto flex w-full items-start gap-2 rounded-xl border border-border bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-xl">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${item.kind === 'success' ? 'text-emerald-500' : item.kind === 'error' ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className="min-w-0 flex-1 leading-5">{item.message}</span>
              <button type="button" onClick={() => setItems(current => current.filter(entry => entry.id !== item.id))} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss notification"><X className="h-3.5 w-3.5" /></button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
