'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { GraduationCap, FileText, Brain, Target } from 'lucide-react'
import { api } from '@/lib/api'

export default function IBToolsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleIBTool = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const tool = formData.get('tool') as string
    const topic = formData.get('topic') as string
    const subject = formData.get('subject') as string

    try {
      const response = await api.post('/tools/ib-tool', { tool, topic, subject })
      setResult(response.data.result)
    } catch (error) {
      setResult('Error: Could not generate guidance.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          IB Tools
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* IA Helper */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-ap-yellow" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">IA Helper</h2>
            </div>
            <form onSubmit={handleIBTool} className="space-y-4">
              <input type="hidden" name="tool" value="ia" />
              <input
                type="text"
                name="topic"
                placeholder="IA Topic..."
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                name="subject"
                placeholder="Subject (e.g., Biology, Math)..."
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-ap-yellow text-gray-900 rounded-xl hover:bg-ap-yellow/90 disabled:opacity-50 transition-all"
              >
                Get IA Guidance
              </button>
            </form>
          </div>

          {/* TOK Helper */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-ap-yellow" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">TOK Helper</h2>
            </div>
            <form onSubmit={handleIBTool} className="space-y-4">
              <input type="hidden" name="tool" value="tok" />
              <input
                type="text"
                name="topic"
                placeholder="TOK Topic/Area (e.g., Essay, Exhibition)..."
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                name="subject"
                placeholder="Area of Knowledge (optional)..."
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-ap-yellow text-gray-900 rounded-xl hover:bg-ap-yellow/90 disabled:opacity-50 transition-all"
              >
                Get TOK Guidance
              </button>
            </form>
          </div>

          {/* CAS Helper */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-ap-yellow" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">CAS Helper</h2>
            </div>
            <form onSubmit={handleIBTool} className="space-y-4">
              <input type="hidden" name="tool" value="cas" />
              <input
                type="text"
                name="topic"
                placeholder="CAS Area or Project Idea (optional)..."
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                name="subject"
                value=""
                readOnly
                className="hidden"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-ap-yellow text-gray-900 rounded-xl hover:bg-ap-yellow/90 disabled:opacity-50 transition-all"
              >
                Get CAS Help
              </button>
            </form>
          </div>

          {/* EE Helper */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="w-6 h-6 text-ap-yellow" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">EE Helper</h2>
            </div>
            <form onSubmit={handleIBTool} className="space-y-4">
              <input type="hidden" name="tool" value="ee" />
              <input
                type="text"
                name="topic"
                placeholder="Extended Essay Topic..."
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                name="subject"
                placeholder="Subject (e.g., History, Biology)..."
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-ap-yellow text-gray-900 rounded-xl hover:bg-ap-yellow/90 disabled:opacity-50 transition-all"
              >
                Get EE Guidance
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
