'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { ChatInterface } from '@/components/ChatInterface'

function ChatContent() {
  const searchParams = useSearchParams()
  const subject = searchParams.get('subject') || 'general'
  const mode = searchParams.get('mode') || 'chat'

  return <ChatInterface subject={subject} initialMode={mode} />
}

export default function ChatPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 overflow-hidden">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">Loading...</div>}>
          <ChatContent />
        </Suspense>
      </main>
    </div>
  )
}
