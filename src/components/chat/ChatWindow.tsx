'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { ArrowUpRight, Braces, FileText, Lightbulb, MessageCircle } from 'lucide-react'
import type { ChatMessage, ModelOption } from '@/lib/sdk/types'
import MessageBubble from './MessageBubble'

interface Props {
  messages: ChatMessage[]
  isStreaming: boolean
  model: ModelOption
  onSuggestion: (text: string) => void
  onRetry: () => void
}
const suggestions = [
  { icon: FileText, title: 'Summarize a topic', prompt: 'Explain edge computing in a concise, practical way.' },
  { icon: Braces, title: 'Build something', prompt: 'Create a clean React component for a command palette.' },
  { icon: Lightbulb, title: 'Brainstorm ideas', prompt: 'Give me five original ideas for a useful AI side project.' },
  { icon: MessageCircle, title: 'Improve my writing', prompt: 'Help me rewrite a message so it sounds clear and confident.' },
]

export default function ChatWindow({ messages, isStreaming, model, onSuggestion, onRetry }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' })
  }, [isStreaming, messages])

  if (messages.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center py-12">
          <div className="mb-8">
            <Image src="/applogo.png" alt="T7 Chat" width={44} height={44} className="mb-5 h-11 w-11 rounded-2xl border border-border bg-card object-cover shadow-sm" />
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/65">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Private workspace</span>
              <span className="text-border">/</span>
              <span>BYOK enabled</span>
            </div>
            <h1 className="max-w-xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">What are we working on?</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              A focused workspace for writing, reasoning, coding, and everyday questions.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.map(({ icon: Icon, title, prompt }) => (
              <button key={title} onClick={() => onSuggestion(prompt)} className="suggestion-card">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{title}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            message={message}
            isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
            model={model}
            onRetry={onRetry}
          />
        ))}
        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  )
}
