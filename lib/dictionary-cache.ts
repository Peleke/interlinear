import type { DictionaryResponse } from '@/types'

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
    if (typeof window === 'undefined') return null

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
    if (typeof window === 'undefined') return

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
    if (typeof window === 'undefined') return

    const key = this.getCacheKey(word)
    localStorage.removeItem(key)
    this.updateMetadata()
  }

  /**
   * Clear all cached definitions
   */
  static clear(): void {
    if (typeof window === 'undefined') return

    const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX))
    keys.forEach((key) => localStorage.removeItem(key))
    localStorage.removeItem(METADATA_KEY)
  }

  /**
   * Get cache statistics
   */
  static getStats(): CacheMetadata {
    if (typeof window === 'undefined') {
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: 0,
        newestEntry: 0,
        lastCleanup: 0,
      }
    }

    return this.getMetadata()
  }

  /**
   * Remove expired entries
   */
  static cleanup(): void {
    if (typeof window === 'undefined') return

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
    if (typeof window === 'undefined') return

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
    if (typeof window === 'undefined') return

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
    if (typeof window === 'undefined') {
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: 0,
        newestEntry: 0,
        lastCleanup: 0,
      }
    }

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
