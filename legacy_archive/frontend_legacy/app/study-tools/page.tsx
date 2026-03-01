'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Lightbulb, List, Calculator, BookOpen } from 'lucide-react'
import { api } from '@/lib/api'

export default function StudyToolsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const handleExplain = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setActiveTool('explain')
    const formData = new FormData(e.currentTarget)
    const topic = formData.get('topic') as string

    try {
      const response = await api.post('/tools/explain', { topic })
      setResult(response.data.result)
    } catch (error) {
      setResult('Error: Could not generate explanation.')
    } finally {
      setLoading(false)
    }
  }

  const handleBreakdown = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setActiveTool('breakdown')
    const formData = new FormData(e.currentTarget)
    const content = formData.get('content') as string

    try {
      const response = await api.post('/tools/breakdown', { content })
      setResult(response.data.result)
    } catch (error) {
      setResult('Error: Could not generate breakdown.')
    } finally {
      setLoading(false)
    }
  }

  const handleMathSolve = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setActiveTool('math')
    const formData = new FormData(e.currentTarget)
    const problem = formData.get('problem') as string
    const hideAnswer = formData.get('hideAnswer') === 'on'

    try {
      const response = await api.post('/tools/math-solve', { problem, hideAnswer })
      setResult(response.data.result)
    } catch (error) {
      setResult('Error: Could not solve problem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Study Tools
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Explain Mode */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-ap-yellow" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Explain Mode</h2>
            </div>
            <form onSubmit={handleExplain} className="space-y-4">
              <textarea
                name="topic"
                placeholder="Enter topic to explain..."
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={3}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-ap-yellow text-gray-900 rounded-xl hover:bg-ap-yellow/90 disabled:opacity-50 transition-all"
              >
                Explain
              </button>
            </form>
          </div>

          {/* Breakdown Mode */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <List className="w-6 h-6 text-ap-yellow" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Breakdown Mode</h2>
            </div>
            <form onSubmit={handleBreakdown} className="space-y-4">
              <textarea
                name="content"
                placeholder="Enter content to break down..."
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={3}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-ap-yellow text-gray-900 rounded-xl hover:bg-ap-yellow/90 disabled:opacity-50 transition-all"
              >
                Break Down
              </button>
            </form>
          </div>

          {/* Math Solver */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calculator className="w-6 h-6 text-ap-yellow" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Math Solver</h2>
            </div>
            <form onSubmit={handleMathSolve} className="space-y-4">
              <textarea
                name="problem"
                placeholder="Enter math problem..."
                required
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={3}
              />
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <input type="checkbox" name="hideAnswer" className="rounded" />
                <span>Hide final answer</span>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-ap-yellow text-gray-900 rounded-xl hover:bg-ap-yellow/90 disabled:opacity-50 transition-all"
              >
                Solve
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
