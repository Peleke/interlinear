# Story 3.4: Definition Caching Strategy

## Story
**As a** user
**I want** dictionary lookups to be cached locally
**So that** I don't wait for repeat lookups and reduce API calls

## Priority
**P1 - Day 1 PM, Hour 10**

## Acceptance Criteria
- [ ] Definitions cached in localStorage on successful lookup
- [ ] Cache check before API fetch
- [ ] Cache key format: `dict_cache_{word}`
- [ ] 7-day TTL for cached entries
- [ ] Cache size limit (100 entries max)
- [ ] LRU eviction when limit reached
- [ ] Clear cache button in vocabulary panel
- [ ] Cache metadata tracking (timestamp, access count)

## Technical Details

### Cache Schema

**Cache Entry Structure:**
```typescript
interface CachedDefinition {
  word: string
  data: DictionaryResponse
  timestamp: number
  accessCount: number
  expiresAt: number
}

interface CacheMetadata {
  totalEntries: number
  totalSize: number
  oldestEntry: number
  newestEntry: number
  lastCleanup: number
}
```

### Cache Manager (`lib/dictionary-cache.ts`)

```typescript
const CACHE_PREFIX = 'dict_cache_'
const METADATA_KEY = 'dict_cache_metadata'
const MAX_ENTRIES = 100
const TTL_DAYS = 7
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000

export class DictionaryCache {
  /**
   * Get cached definition for a word
   * Returns null if not cached or expired
   */
  static get(word: string): DictionaryResponse | null {
    try {
      const key = this.getCacheKey(word)
      const cached = localStorage.getItem(key)

      if (!cached) return null

      const entry: CachedDefinition = JSON.parse(cached)

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.remove(word)
        return null
      }

      // Update access metadata
      entry.accessCount++
      entry.timestamp = Date.now()
      localStorage.setItem(key, JSON.stringify(entry))

      return entry.data
    } catch (err) {
      console.error('Cache read error:', err)
      return null
    }
  }

  /**
   * Store definition in cache
   */
  static set(word: string, data: DictionaryResponse): void {
    try {
      const metadata = this.getMetadata()

      // Enforce size limit with LRU eviction
      if (metadata.totalEntries >= MAX_ENTRIES) {
        this.evictLRU()
      }

      const entry: CachedDefinition = {
        word,
        data,
        timestamp: Date.now(),
        accessCount: 1,
        expiresAt: Date.now() + TTL_MS,
      }

      const key = this.getCacheKey(word)
      localStorage.setItem(key, JSON.stringify(entry))

      // Update metadata
      this.updateMetadata()
    } catch (err) {
      console.error('Cache write error:', err)
      // If quota exceeded, clear old entries and retry
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        this.cleanup()
        this.set(word, data) // Retry once
      }
    }
  }

  /**
   * Remove specific word from cache
   */
  static remove(word: string): void {
    const key = this.getCacheKey(word)
    localStorage.removeItem(key)
    this.updateMetadata()
  }

  /**
   * Clear all cached definitions
   */
  static clear(): void {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX))
    keys.forEach((key) => localStorage.removeItem(key))
    localStorage.removeItem(METADATA_KEY)
  }

  /**
   * Get cache statistics
   */
  static getStats(): CacheMetadata {
    return this.getMetadata()
  }

  /**
   * Remove expired entries
   */
  static cleanup(): void {
    const now = Date.now()
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX))

    keys.forEach((key) => {
      try {
        const cached = localStorage.getItem(key)
        if (!cached) return

        const entry: CachedDefinition = JSON.parse(cached)

        if (now > entry.expiresAt) {
          localStorage.removeItem(key)
        }
      } catch (err) {
        // Remove corrupted entries
        localStorage.removeItem(key)
      }
    })

    this.updateMetadata()
  }

  /**
   * Evict least recently used entry
   */
  private static evictLRU(): void {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX))

    let oldestKey: string | null = null
    let oldestTime = Infinity

    keys.forEach((key) => {
      try {
        const cached = localStorage.getItem(key)
        if (!cached) return

        const entry: CachedDefinition = JSON.parse(cached)

        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp
          oldestKey = key
        }
      } catch (err) {
        // Skip corrupted entries
      }
    })

    if (oldestKey) {
      localStorage.removeItem(oldestKey)
    }
  }

  /**
   * Update cache metadata
   */
  private static updateMetadata(): void {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX))

    let totalSize = 0
    let oldestEntry = Infinity
    let newestEntry = 0

    keys.forEach((key) => {
      try {
        const cached = localStorage.getItem(key)
        if (!cached) return

        totalSize += cached.length

        const entry: CachedDefinition = JSON.parse(cached)

        if (entry.timestamp < oldestEntry) {
          oldestEntry = entry.timestamp
        }

        if (entry.timestamp > newestEntry) {
          newestEntry = entry.timestamp
        }
      } catch (err) {
        // Skip corrupted entries
      }
    })

    const metadata: CacheMetadata = {
      totalEntries: keys.length,
      totalSize,
      oldestEntry: oldestEntry === Infinity ? 0 : oldestEntry,
      newestEntry,
      lastCleanup: Date.now(),
    }

    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata))
  }

  /**
   * Get cache metadata
   */
  private static getMetadata(): CacheMetadata {
    try {
      const meta = localStorage.getItem(METADATA_KEY)

      if (!meta) {
        return {
          totalEntries: 0,
          totalSize: 0,
          oldestEntry: 0,
          newestEntry: 0,
          lastCleanup: 0,
        }
      }

      return JSON.parse(meta)
    } catch (err) {
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: 0,
        newestEntry: 0,
        lastCleanup: 0,
      }
    }
  }

  /**
   * Generate cache key for word
   */
  private static getCacheKey(word: string): string {
    return `${CACHE_PREFIX}${word.toLowerCase().trim()}`
  }
}
```

### Integration with DefinitionSidebar

**Modified `components/reader/DefinitionSidebar.tsx`:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { DictionaryCache } from '@/lib/dictionary-cache'
import type { DictionaryResponse } from '@/types'

interface DefinitionSidebarProps {
  word: string | null
  onClose: () => void
}

export function DefinitionSidebar({ word, onClose }: DefinitionSidebarProps) {
  const [data, setData] = useState<DictionaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cacheHit, setCacheHit] = useState(false)

  useEffect(() => {
    if (!word) {
      setData(null)
      setError(null)
      setCacheHit(false)
      return
    }

    // Create AbortController for fetch cancellation
    const controller = new AbortController()

    const fetchDefinition = async () => {
      setLoading(true)
      setError(null)
      setCacheHit(false)

      try {
        // Check cache first
        const cached = DictionaryCache.get(word)

        if (cached) {
          console.log('Cache hit:', word)
          setData(cached)
          setCacheHit(true)
          setLoading(false)
          return
        }

        // Cache miss - fetch from API
        console.log('Cache miss:', word)
        const response = await fetch(
          `/api/dictionary/${encodeURIComponent(word)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch definition')
        }

        const result: DictionaryResponse = await response.json()
        setData(result)

        // Store in cache if successful
        if (result.found) {
          DictionaryCache.set(word, result)
        }
      } catch (err) {
        // Ignore abort errors (user clicked another word)
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchDefinition()

    // Cleanup: abort fetch if word changes before response
    return () => controller.abort()
  }, [word])

  // ... rest of component UI

  // Add cache indicator to header
  {cacheHit && (
    <div className="text-xs text-sepia-500 flex items-center gap-1">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
      </svg>
      Cached
    </div>
  )}
}
```

### Cache Management UI

**Add to VocabularyPanel (`components/reader/VocabularyPanel.tsx`):**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { DictionaryCache } from '@/lib/dictionary-cache'

export function VocabularyPanel() {
  const [stats, setStats] = useState(DictionaryCache.getStats())

  const handleClearCache = () => {
    if (confirm('Clear all cached definitions? This will require re-fetching from the API.')) {
      DictionaryCache.clear()
      setStats(DictionaryCache.getStats())
    }
  }

  const handleCleanup = () => {
    DictionaryCache.cleanup()
    setStats(DictionaryCache.getStats())
  }

  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif text-sepia-900">Vocabulary</h2>

      {/* Cache Statistics */}
      <div className="bg-white p-4 rounded-lg border border-sepia-200">
        <h3 className="font-semibold text-sepia-800 mb-3">Dictionary Cache</h3>

        <div className="space-y-2 text-sm text-sepia-700">
          <div className="flex justify-between">
            <span>Cached definitions:</span>
            <span className="font-medium">{stats.totalEntries} / 100</span>
          </div>

          <div className="flex justify-between">
            <span>Cache size:</span>
            <span className="font-medium">{formatBytes(stats.totalSize)}</span>
          </div>

          <div className="flex justify-between">
            <span>Oldest entry:</span>
            <span className="font-medium">{formatDate(stats.oldestEntry)}</span>
          </div>

          <div className="flex justify-between">
            <span>Last cleanup:</span>
            <span className="font-medium">{formatDate(stats.lastCleanup)}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleCleanup}
            className="px-3 py-1.5 text-sm bg-sepia-100 hover:bg-sepia-200 text-sepia-800 rounded transition-colors"
          >
            Remove Expired
          </button>

          <button
            onClick={handleClearCache}
            className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Cache Maintenance Strategy

**Automatic Cleanup:**
```typescript
// Run cleanup on app initialization
// Add to app/layout.tsx or reader page

'use client'

import { useEffect } from 'react'
import { DictionaryCache } from '@/lib/dictionary-cache'

export function useCacheCleanup() {
  useEffect(() => {
    // Cleanup expired entries on mount
    DictionaryCache.cleanup()

    // Schedule periodic cleanup (every 24 hours)
    const interval = setInterval(() => {
      DictionaryCache.cleanup()
    }, 24 * 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])
}
```

### Performance Benefits

**Cache Hit Scenarios:**
1. User clicks same word multiple times
2. User reviews previously looked-up words
3. Common vocabulary appears in multiple texts
4. User returns to app within 7 days

**API Call Reduction:**
- Estimated 60-80% reduction for typical usage
- 100% reduction for repeated word clicks
- Near 0ms response time for cache hits vs 200-500ms API calls

**User Experience:**
- Instant definition display on cache hit
- Visual "Cached" indicator for transparency
- Reduced API quota usage (1000/day limit)

### Edge Cases

1. **localStorage quota exceeded** → Automatic LRU eviction + retry
2. **Corrupted cache entries** → Silent removal during cleanup
3. **Cache key collisions** → Lowercase + trim normalization prevents
4. **Multiple tabs** → localStorage events sync cache across tabs
5. **Private browsing** → localStorage available but cleared on close

## Architecture References
- `/docs/architecture/caching-strategy.md` - Cache architecture
- `/docs/architecture/frontend-architecture.md` - State management
- `/docs/prd/user-stories.md` - US-303

## Definition of Done
- [ ] DictionaryCache class created
- [ ] Cache integrated with DefinitionSidebar
- [ ] 7-day TTL enforced
- [ ] 100-entry limit with LRU eviction
- [ ] Cache UI in VocabularyPanel
- [ ] Automatic cleanup on mount
- [ ] Quota exceeded handling
- [ ] TypeScript fully typed
- [ ] Cache hit indicator in sidebar
- [ ] Statistics tracking
