'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { Check, Copy, RefreshCw, Sparkles } from 'lucide-react'
import type { ChatMessage, ModelOption } from '@/lib/sdk/types'

interface Props {
  message: ChatMessage
  isStreaming?: boolean
  model: ModelOption
  onRetry: () => void
}
function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button onClick={copy} className="message-action" aria-label={label}>
      {copied ? <Check /> : <Copy />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  )
}
export default function MessageBubble({ message, isStreaming, model, onRetry }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <article className="mb-7 flex justify-end">
        <div className="max-w-[88%] rounded-2xl rounded-br-md bg-user px-4 py-2.5 text-[15px] leading-6 text-user-foreground sm:max-w-[78%]">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </article>
    )
  }

  return (
    <article className="group mb-8">
      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-border bg-card">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="font-medium text-foreground/80">{model.label}</span>
      </div>

      <div className="markdown-body pl-0 sm:pl-8">
        {message.content ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a>,
              pre: ({ children }) => <>{children}</>,
              code: ({ className, children, ...props }) => {
                const language = /language-(\w+)/.exec(className || '')?.[1]
                const code = String(children).replace(/\n$/, '')
                if (!language) return <code className={className} {...props}>{children}</code>
                return (
                  <span className="code-block">
                    <span className="code-header">
                      <span>{language}</span>
                      <CopyButton text={code} label="Copy code" />
                    </span>
                    <SyntaxHighlighter language={language} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, background: 'transparent', padding: '0.9rem 1rem', fontSize: '0.8rem', color: 'var(--foreground)' }} {...props}>{code}</SyntaxHighlighter>
                  </span>
                )
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          <span className="typing-indicator"><i /><i /><i /></span>
        )}
        {isStreaming && message.content && <span className="stream-cursor" />}
      </div>

      {!isStreaming && message.content && (
        <div className="mt-3 flex items-center gap-1 pl-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 sm:pl-8">
          <CopyButton text={message.content} />
          <button onClick={() => onRetry()} className="message-action" aria-label="Regenerate response">
            <RefreshCw />
            <span>Retry</span>
          </button>
        </div>
      )}
    </article>
  )
}
