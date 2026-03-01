export interface SavedItem {
  id: string
  title: string
  content: string
  subject?: string
  tags: string[]
  timestamp: string
  mode?: string
}

const STORAGE_KEY = 'pluggpt_saved_items'

export function saveItem(item: Omit<SavedItem, 'id' | 'timestamp'>): SavedItem {
  const savedItems = getSavedItems()
  const newItem: SavedItem = {
    ...item,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  }
  
  savedItems.unshift(newItem)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItems))
  return newItem
}

export function getSavedItems(): SavedItem[] {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export function deleteItem(id: string): void {
  const items = getSavedItems().filter(item => item.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getItemsByTag(tag: string): SavedItem[] {
  return getSavedItems().filter(item => item.tags.includes(tag))
}
