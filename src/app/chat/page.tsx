'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart3, KeyRound, Menu, PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { useProviderKeys } from '@/hooks/useProviderKeys'
import ConversationList from '@/components/chat/ConversationList'
import ChatWindow from '@/components/chat/ChatWindow'
import ChatInput from '@/components/chat/ChatInput'
import ProviderSettings from '@/components/chat/ProviderSettings'
import ThemeToggle from '@/components/chat/ThemeToggle'
import AuthModal from '@/components/chat/AuthModal'
import { useAuth } from '@/hooks/useAuth'

export default function ChatPage() {
  const auth = useAuth()
  const providerKeys = useProviderKeys(auth.user?.id)
  const chat = useChat(providerKeys.keys)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const sendMessage = (content: string) => {
    if (auth.configured && !auth.user && !providerKeys.keys[chat.model.provider]) {
      setIsAuthOpen(true)
      return
    }
    chat.sendMessage(content)
  }

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      {isSidebarOpen && (
        <>
          <button
            aria-label="Close sidebar"
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-40 flex w-[286px] border-r border-border bg-sidebar md:relative md:z-auto">
            <ConversationList
              currentSessionId={chat.sessionId}
              onResume={(id, messages) => {
                chat.loadSession(id, messages)
                setIsSidebarOpen(false)
              }}
              onNew={() => {
                chat.newSession()
                setIsSidebarOpen(false)
              }}
              onClose={() => setIsSidebarOpen(false)}
              onOpenProfile={() => setIsAuthOpen(true)}
              user={auth.user}
            />
          </aside>
        </>
      )}

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-1 px-2.5 md:px-4">
          <button
            onClick={() => setIsSidebarOpen(value => !value)}
            className="icon-button"
            aria-label="Toggle sidebar"
          >
            <span className="md:hidden">{isSidebarOpen ? <PanelLeftClose /> : <Menu />}</span>
            <span className="hidden md:block">{isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}</span>
          </button>

          {!isSidebarOpen && (
            <button onClick={chat.newSession} className="icon-button hidden md:inline-flex" aria-label="New chat">
              <Plus />
            </button>
          )}

          <div className="flex-1" />

          <ThemeToggle />

          <Link href="/dashboard" className="icon-button" aria-label="Open analytics">
            <BarChart3 />
          </Link>
          <button onClick={() => setIsSettingsOpen(true)} className="icon-button" aria-label="Manage provider API keys" title="Manage provider API keys">
            <KeyRound />
          </button>
        </header>

        <ChatWindow
          messages={chat.messages}
          isStreaming={chat.isStreaming}
          model={chat.model}
          onSuggestion={sendMessage}
          onRetry={chat.regenerate}
        />
        <ChatInput
          onSend={sendMessage}
          onStop={chat.stopStreaming}
          isStreaming={chat.isStreaming}
          model={chat.model}
          setModel={chat.setModel}
          reasoningEffort={chat.reasoningEffort}
          setReasoningEffort={chat.setReasoningEffort}
          keys={providerKeys.keys}
          onOpenSettings={() => setIsSettingsOpen(true)}
          requireAuthentication={auth.configured && !auth.user}
          onRequireAuth={() => setIsAuthOpen(true)}
        />
      </section>
      {isSettingsOpen && (
        <ProviderSettings
          keys={providerKeys.keys}
          onSave={providerKeys.updateKey}
          onClear={providerKeys.clearKey}
          onClose={() => setIsSettingsOpen(false)}
          user={auth.user}
        />
      )}
      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
    </main>
  )
}
