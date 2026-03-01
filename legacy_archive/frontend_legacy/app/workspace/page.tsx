'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Trash2, Download, Search, Tag } from 'lucide-react'
import { getSavedItems, deleteItem, SavedItem } from '@/lib/storage'

export default function WorkspacePage() {
  const [items, setItems] = useState<SavedItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = () => {
    setItems(getSavedItems())
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItem(id)
      loadItems()
    }
  }

  const handleExport = (item: SavedItem) => {
    const blob = new Blob([item.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.title.replace(/[^a-z0-9]/gi, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !selectedTag || item.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const allTags = Array.from(new Set(items.flatMap(item => item.tags)))

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Workspace
        </h1>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search saved items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  selectedTag === null
                    ? 'bg-ap-yellow text-gray-900'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    selectedTag === tag
                      ? 'bg-ap-yellow text-gray-900'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Tag size={14} />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {items.length === 0 ? 'No saved items yet. Save content from chat responses!' : 'No items match your search.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-lg bg-ap-yellow/20 text-ap-yellow"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport(item)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="Export"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto">
                    {item.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
