# Story 5.3: Vocabulary List Page

## Story
**As a** user
**I want** to view all my saved vocabulary
**So that** I can review and manage my learned words

## Priority
**P0 - Day 2 PM, Hour 7**

## Acceptance Criteria
- [ ] Dedicated `/vocabulary` page route
- [ ] Display all saved words in list/grid format
- [ ] Show word, definition preview, click count, last seen date
- [ ] Sort options (recent, alphabetical, most clicked)
- [ ] Search/filter functionality
- [ ] Delete individual words
- [ ] Clear all vocabulary (with confirmation)
- [ ] Pagination or infinite scroll for large lists
- [ ] Empty state for new users
- [ ] Responsive design (mobile/desktop)

## Technical Details

### Page Route

**File**: `app/vocabulary/page.tsx`

```typescript
import { VocabularyList } from '@/components/vocabulary/VocabularyList'

export const metadata = {
  title: 'My Vocabulary | Interlinear',
  description: 'Review and manage your saved Spanish vocabulary',
}

export default function VocabularyPage() {
  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-sepia-900">My Vocabulary</h1>
        </div>

        <VocabularyList />
      </div>
    </div>
  )
}
```

### VocabularyList Component

**File**: `components/vocabulary/VocabularyList.tsx`

```typescript
'use client'

import { useState, useEffect, useMemo } from 'react'
import { VocabularyService } from '@/lib/vocabulary'
import { VocabularyCard } from './VocabularyCard'
import { VocabularyStats } from './VocabularyStats'
import type { VocabularyEntry } from '@/types'

type SortOption = 'recent' | 'alphabetical' | 'clicks'

export function VocabularyList() {
  const [entries, setEntries] = useState<VocabularyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadVocabulary()
  }, [])

  const loadVocabulary = async () => {
    try {
      setLoading(true)
      const data = await VocabularyService.getAll()
      setEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vocabulary')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this word from your vocabulary?')) return

    try {
      await VocabularyService.deleteWord(id)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      alert('Failed to delete word')
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Delete ALL vocabulary? This cannot be undone.')) return

    try {
      await VocabularyService.clearAll()
      setEntries([])
    } catch (err) {
      alert('Failed to clear vocabulary')
    }
  }

  // Filter and sort entries
  const filteredAndSorted = useMemo(() => {
    let filtered = entries

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.word.includes(query) ||
        entry.definition?.definitions?.some(def =>
          def.meanings.some(m => m.toLowerCase().includes(query))
        )
      )
    }

    // Sort
    const sorted = [...filtered]
    switch (sortBy) {
      case 'recent':
        sorted.sort((a, b) =>
          new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
        )
        break
      case 'alphabetical':
        sorted.sort((a, b) => a.word.localeCompare(b.word))
        break
      case 'clicks':
        sorted.sort((a, b) => b.click_count - a.click_count)
        break
    }

    return sorted
  }, [entries, searchQuery, sortBy])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-sepia-600">Loading vocabulary...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadVocabulary}
          className="mt-2 text-red-800 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-sepia-200 p-12 text-center">
        <h2 className="text-xl font-serif text-sepia-900 mb-2">
          No vocabulary yet
        </h2>
        <p className="text-sepia-600 mb-4">
          Start reading and click on words to build your vocabulary
        </p>
        <a
          href="/reader"
          className="inline-block px-4 py-2 bg-sepia-700 text-white rounded-md hover:bg-sepia-800 transition-colors"
        >
          Start Reading
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <VocabularyStats entries={entries} />

      {/* Controls */}
      <div className="bg-white rounded-lg border border-sepia-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search vocabulary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-sepia-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sepia-500"
            />
          </div>

          {/* Sort */}
          <div className="flex gap-2 items-center">
            <label className="text-sm text-sepia-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-sepia-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sepia-500"
            >
              <option value="recent">Most Recent</option>
              <option value="alphabetical">A-Z</option>
              <option value="clicks">Most Clicked</option>
            </select>
          </div>

          {/* Clear All */}
          <button
            onClick={handleClearAll}
            className="px-3 py-2 text-sm text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-sepia-600">
        Showing {filteredAndSorted.length} of {entries.length} words
      </div>

      {/* Vocabulary grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAndSorted.map((entry) => (
          <VocabularyCard
            key={entry.id}
            entry={entry}
            onDelete={() => handleDelete(entry.id)}
          />
        ))}
      </div>
    </div>
  )
}
```

### VocabularyCard Component

**File**: `components/vocabulary/VocabularyCard.tsx`

```typescript
'use client'

import { formatDistanceToNow } from 'date-fns'
import type { VocabularyEntry } from '@/types'

interface VocabularyCardProps {
  entry: VocabularyEntry
  onDelete: () => void
}

export function VocabularyCard({ entry, onDelete }: VocabularyCardProps) {
  const firstDefinition = entry.definition?.definitions?.[0]

  return (
    <div className="bg-white rounded-lg border border-sepia-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-serif text-sepia-900">{entry.word}</h3>
        <button
          onClick={onDelete}
          className="text-sepia-400 hover:text-red-600 transition-colors"
          aria-label="Delete word"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Definition preview */}
      {firstDefinition && (
        <div className="mb-3">
          <span className="text-xs text-sepia-500 italic">
            {firstDefinition.partOfSpeech}
          </span>
          <p className="text-sm text-sepia-700 mt-1">
            {firstDefinition.meanings[0]}
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-sepia-500">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {entry.click_count} {entry.click_count === 1 ? 'time' : 'times'}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDistanceToNow(new Date(entry.last_seen), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}
```

### VocabularyStats Component

**File**: `components/vocabulary/VocabularyStats.tsx`

```typescript
'use client'

import type { VocabularyEntry } from '@/types'

interface VocabularyStatsProps {
  entries: VocabularyEntry[]
}

export function VocabularyStats({ entries }: VocabularyStatsProps) {
  const totalWords = entries.length
  const totalClicks = entries.reduce((sum, e) => sum + e.click_count, 0)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentWords = entries.filter(
    e => new Date(e.last_seen) >= sevenDaysAgo
  ).length

  return (
    <div className="bg-white rounded-lg border border-sepia-200 p-6">
      <h2 className="text-lg font-serif text-sepia-900 mb-4">Statistics</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-sepia-900">{totalWords}</div>
          <div className="text-sm text-sepia-600">Total Words</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-sepia-900">{recentWords}</div>
          <div className="text-sm text-sepia-600">This Week</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-sepia-900">{totalClicks}</div>
          <div className="text-sm text-sepia-600">Total Clicks</div>
        </div>
      </div>
    </div>
  )
}
```

## Navigation Integration

**File**: `components/Navigation.tsx` (if exists)

```typescript
<nav className="bg-white border-b border-sepia-200">
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex justify-between items-center h-16">
      <Link href="/" className="font-serif text-xl text-sepia-900">
        Interlinear
      </Link>

      <div className="flex gap-6">
        <Link href="/reader" className="text-sepia-700 hover:text-sepia-900">
          Reader
        </Link>
        <Link href="/vocabulary" className="text-sepia-700 hover:text-sepia-900">
          Vocabulary
        </Link>
      </div>
    </div>
  </div>
</nav>
```

## Performance Optimization

1. **Pagination**: Implement for vocabularies >100 words
2. **Virtual scrolling**: For very large lists (1000+ words)
3. **Debounced search**: Prevent excessive re-renders
4. **Memoized sorting**: Cache sorted results

## Edge Cases

1. **Empty search results**: Show "No matches" message
2. **Very long words**: Truncate with ellipsis
3. **Missing definitions**: Show "No definition available"
4. **Delete last word**: Show empty state
5. **Simultaneous deletes**: Disable button during delete

## Architecture References
- `/docs/architecture/routing.md` - Next.js routing
- `/docs/architecture/components.md` - Component structure
- `/docs/prd/user-stories.md` - US-502

## Definition of Done
- [ ] `/vocabulary` page route created
- [ ] VocabularyList component implemented
- [ ] VocabularyCard component with delete
- [ ] VocabularyStats component
- [ ] Search functionality working
- [ ] Sort options (recent, A-Z, clicks)
- [ ] Clear all with confirmation
- [ ] Empty state for new users
- [ ] Responsive design tested
- [ ] Navigation links added
- [ ] TypeScript fully typed
- [ ] Error handling implemented
