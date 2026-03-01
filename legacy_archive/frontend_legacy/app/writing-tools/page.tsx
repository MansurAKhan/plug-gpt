'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { PenTool, RefreshCw, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'

export default function WritingToolsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleRewrite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const text = formData.get('text') as string
    const style = formData.get('style') as string

    try {
      const response = await api.post('/tools/rewrite', { text, style })
      setResult(response.data.result)
    } catch (error) {
      setResult('Error: Could not rewrite text.')
    } finally {
      setLoading(false)
    }
  }

  const handleGrammarFix = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const text = formData.get('text') as string

    try {
      const response = await api.post('/tools/grammar-fix', { text })
      setResult(response.data.result)
    } catch (error) {
      setResult('Error: Could not fix grammar.')
    } finally {
      setLoading(false)
    }
  }

  const handleEssayBuilder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const type = formData.get('type') as string
    const topic = formData.get('topic') as string

    try {
      const response = await api.post('/tools/essay-builder', { type, topic })
      setResult(response.data.result)
    } catch (error) {
      setResult('Error: Could not build essay component.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Writing Tools
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Rewrite Mode */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-6 h-6 text-ap-yellow" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rewrite Mode</h2>
            </div>
            <form onSubmit={handleRewrite} className="space-y-4">
              <textarea
                name="text"
                placeholder="Enter text to rewrite..."
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={4}
              />
              <select
                name="style"
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="neutral">Neutral</option>
                <option value="formal">Formal</option>
                <option value="simplified">Simplified</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-ap-yellow text-gray-900 rounded-xl hover:bg-ap-yellow/90 disabled:opacity-50 transition-all"
              >
                Rewrite
              </button>
            </form>
          </div>

          {/* Grammar Fixer */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-ap-yellow" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Grammar & Clarity Fixer</h2>
            </div>
            <form onSubmit={handleGrammarFix} className="space-y-4">
              <textarea
                name="text"
                placeholder="Enter text to fix..."
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={4}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-ap-yellow text-gray-900 rounded-xl hover:bg-ap-yellow/90 disabled:opacity-50 transition-all"
              >
                Fix Grammar
              </button>
            </form>
          </div>

          {/* Essay Builder */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <PenTool className="w-6 h-6 text-ap-yellow" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Essay Builder</h2>
            </div>
            <form onSubmit={handleEssayBuilder} className="space-y-4">
              <input
                type="text"
                name="topic"
                placeholder="Essay topic..."
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <select
                name="type"
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="thesis">Thesis Statement</option>
                <option value="outline">Outline</option>
                <option value="hook">Hook/Introduction</option>
                <option value="conclusion">Conclusion</option>
                <option value="paragraph">Paragraph Framework (PEEL/CER)</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-ap-yellow text-gray-900 rounded-xl hover:bg-ap-yellow/90 disabled:opacity-50 transition-all"
              >
                Generate
              </button>
            </form>
          </div>
        </div>

        {/* Result Display */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        )}

        {result && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-gray-900 dark:text-white">{result}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
