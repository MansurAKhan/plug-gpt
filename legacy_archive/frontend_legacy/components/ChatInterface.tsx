'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, Copy, Save, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { sendMessage, ChatMessage } from '@/lib/api'
import { saveItem } from '@/lib/storage'

interface ChatInterfaceProps {
  subject?: string
  initialMode?: string
}

export function ChatInterface({ subject = 'general', initialMode = 'chat' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentMode, setCurrentMode] = useState(initialMode)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await sendMessage({
        message: userMessage.content,
        subject,
        mode: currentMode,
        context: messages.length > 0 ? messages[messages.length - 1].content : '',
      })

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleSave = (content: string) => {
    const title = content.substring(0, 50) + (content.length > 50 ? '...' : '')
    saveItem({
      title,
      content,
      subject,
      tags: [subject, currentMode],
      mode: currentMode,
    })
    alert('Saved to workspace!')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-ap-yellow mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Start a conversation
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Ask me anything about {subject}
              </p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-3xl rounded-2xl p-4 shadow-lg
                ${message.role === 'user'
                  ? 'bg-ap-yellow/30 text-gray-900'
                  : 'bg-ap-light-card dark:bg-gray-800 text-gray-900 dark:text-white'
                }
              `}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-ap-yellow" />
                  <span className="font-bold text-ap-yellow">PlugGPT</span>
                </div>
              )}

              <div className="markdown-content">
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>

              {message.role === 'assistant' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleCopy(message.content)}
                    className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                  <button
                    onClick={() => handleSave(message.content)}
                    className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Save size={14} />
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-ap-light-card dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-ap-yellow" />
                <span className="font-bold text-ap-yellow">PlugGPT</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto flex gap-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 rounded-xl border-2 border-ap-yellow focus:outline-none focus:ring-2 focus:ring-ap-yellow bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
            rows={1}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-ap-yellow text-gray-900 rounded-xl hover:bg-ap-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
