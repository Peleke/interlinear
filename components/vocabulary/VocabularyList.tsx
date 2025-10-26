'use client'

import { useState, useMemo } from 'react'
import type { VocabularyEntry } from '@/types'
import { VocabularyCard } from './VocabularyCard'

interface VocabularyListProps {
  entries: VocabularyEntry[]
  onDelete: (id: string) => Promise<void>
  onClearAll: () => Promise<void>
}

type SortOption = 'recent' | 'alphabetical' | 'most-clicked'

export function VocabularyList({ entries, onDelete, onClearAll }: VocabularyListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  // Filter and sort entries
  const filteredAndSorted = useMemo(() => {
    let filtered = entries

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = entries.filter(entry =>
        entry.word.toLowerCase().includes(query)
      )
    }

    // Apply sort
    const sorted = [...filtered]
    switch (sortBy) {
      case 'recent':
        sorted.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())
        break
      case 'alphabetical':
        sorted.sort((a, b) => a.word.localeCompare(b.word))
        break
      case 'most-clicked':
        sorted.sort((a, b) => b.click_count - a.click_count)
        break
    }

    return sorted
  }, [entries, searchQuery, sortBy])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-sepia-200 p-6">
      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search vocabulary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-sepia-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          />
        </div>

        {/* Sort and Actions */}
        <div className="flex gap-3 items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 border border-sepia-300 rounded-md text-sm text-sepia-700 focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            <option value="recent">Most Recent</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="most-clicked">Most Clicked</option>
          </select>

          {entries.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="mb-4 text-sm text-sepia-600">
          Found {filteredAndSorted.length} of {entries.length} words
        </div>
      )}

      {/* Vocabulary List */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12">
          {searchQuery ? (
            <div>
              <p className="text-sepia-600 mb-2">No words match "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-gold-600 hover:text-gold-700 text-sm"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sepia-600 mb-2">Your vocabulary is empty</p>
              <p className="text-sm text-sepia-500">Words you click while reading will appear here</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSorted.map((entry) => (
            <VocabularyCard
              key={entry.id}
              entry={entry}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
