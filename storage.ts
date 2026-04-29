import { RecordingEntry } from './types'

const STORAGE_KEY = 'k2k0_history'

export function getHistory(): RecordingEntry[] {
  if (typeof window === 'undefined') return []
  
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveHistory(entries: RecordingEntry[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch (error) {
    console.error('Failed to save history:', error)
  }
}

export function addToHistory(entry: RecordingEntry): RecordingEntry[] {
  const history = getHistory()
  const updated = [entry, ...history]
  saveHistory(updated)
  return updated
}

export function updateHistoryEntry(id: string, updates: Partial<RecordingEntry>): RecordingEntry[] {
  const history = getHistory()
  const updated = history.map(entry => 
    entry.id === id ? { ...entry, ...updates } : entry
  )
  saveHistory(updated)
  return updated
}

export function deleteFromHistory(id: string): RecordingEntry[] {
  const history = getHistory()
  const updated = history.filter(entry => entry.id !== id)
  saveHistory(updated)
  return updated
}
