# Story 4.4: Audio Caching & Optimization

## Story
**As a** user
**I want** synthesized audio to be cached locally
**So that** I don't re-synthesize the same text and save API quota

## Priority
**P1 - Day 2 AM, Hour 4**

## Acceptance Criteria
- [ ] Audio cached in IndexedDB after synthesis
- [ ] Cache check before calling TTS API
- [ ] Cache key based on text content hash
- [ ] 7-day TTL for cached audio
- [ ] Cache size limit (50MB max)
- [ ] LRU eviction when limit reached
- [ ] Cache statistics in UI
- [ ] Manual cache clear option

## Technical Details

### Why IndexedDB Over localStorage?

**localStorage limitations:**
- 5-10MB size limit (too small for audio)
- Synchronous API (blocks main thread)
- String-only storage (requires base64 encoding)

**IndexedDB advantages:**
- 50MB+ storage per origin
- Asynchronous API (non-blocking)
- Native Blob storage (efficient)

### Implementation (`lib/audio-cache.ts`)

```typescript
interface CachedAudio {
  hash: string
  text: string
  audioBlob: Blob
  timestamp: number
  accessCount: number
  expiresAt: number
}

interface CacheMetadata {
  totalEntries: number
  totalSize: number
  oldestEntry: number
  lastCleanup: number
}

const DB_NAME = 'interlinear_audio_cache'
const STORE_NAME = 'audio'
const METADATA_KEY = 'cache_metadata'
const TTL_DAYS = 7
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000
const MAX_CACHE_SIZE = 50 * 1024 * 1024 // 50MB

class AudioCacheDB {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'hash' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async get(text: string): Promise<Blob | null> {
    await this.init()
    if (!this.db) return null

    const hash = await this.hashText(text)

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(hash)

      request.onsuccess = () => {
        const entry: CachedAudio | undefined = request.result

        if (!entry) {
          resolve(null)
          return
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
          store.delete(hash)
          resolve(null)
          return
        }

        // Update access metadata
        entry.accessCount++
        entry.timestamp = Date.now()
        store.put(entry)

        resolve(entry.audioBlob)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async set(text: string, audioBlob: Blob): Promise<void> {
    await this.init()
    if (!this.db) return

    const hash = await this.hashText(text)
    const metadata = await this.getMetadata()

    // Check size limit and evict if needed
    const blobSize = audioBlob.size
    if (metadata.totalSize + blobSize > MAX_CACHE_SIZE) {
      await this.evictLRU(blobSize)
    }

    const entry: CachedAudio = {
      hash,
      text,
      audioBlob,
      timestamp: Date.now(),
      accessCount: 1,
      expiresAt: Date.now() + TTL_MS,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(entry)

      request.onsuccess = () => {
        this.updateMetadata().then(resolve).catch(reject)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async clear(): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async cleanup(): Promise<void> {
    await this.init()
    if (!this.db) return

    const now = Date.now()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result

        if (cursor) {
          const entry: CachedAudio = cursor.value

          if (now > entry.expiresAt) {
            cursor.delete()
          }

          cursor.continue()
        } else {
          this.updateMetadata().then(resolve).catch(reject)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  async getStats(): Promise<CacheMetadata> {
    return await this.getMetadata()
  }

  private async evictLRU(requiredSpace: number): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('timestamp')
      const request = index.openCursor()

      let freedSpace = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result

        if (cursor && freedSpace < requiredSpace) {
          const entry: CachedAudio = cursor.value
          freedSpace += entry.audioBlob.size
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  private async getMetadata(): Promise<CacheMetadata> {
    await this.init()
    if (!this.db) {
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: 0,
        lastCleanup: 0,
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.openCursor()

      let totalEntries = 0
      let totalSize = 0
      let oldestEntry = Infinity

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result

        if (cursor) {
          const entry: CachedAudio = cursor.value
          totalEntries++
          totalSize += entry.audioBlob.size

          if (entry.timestamp < oldestEntry) {
            oldestEntry = entry.timestamp
          }

          cursor.continue()
        } else {
          resolve({
            totalEntries,
            totalSize,
            oldestEntry: oldestEntry === Infinity ? 0 : oldestEntry,
            lastCleanup: Date.now(),
          })
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  private async updateMetadata(): Promise<void> {
    // Metadata is calculated on-demand, no persistent storage needed
  }

  private async hashText(text: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }
}

export const AudioCache = new AudioCacheDB()
```

### Integration with AudioPlayer

```typescript
'use client'

import { AudioCache } from '@/lib/audio-cache'

export function AudioPlayer({ text, onPlaybackChange, onError }: AudioPlayerProps) {
  // ... existing state
  const [cacheHit, setCacheHit] = useState(false)

  const synthesizeSpeech = async () => {
    setIsLoading(true)
    setError(null)
    setCacheHit(false)

    try {
      // Check cache first
      const cachedAudio = await AudioCache.get(text)

      if (cachedAudio) {
        console.log('Cache hit for audio')
        setCacheHit(true)
        const audioUrl = URL.createObjectURL(cachedAudio)

        // ... setup audio element with cached blob
        setIsLoading(false)
        return
      }

      // Cache miss - synthesize from API
      console.log('Cache miss for audio')
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error('TTS failed')
      }

      const audioBlob = await response.blob()

      // Store in cache
      await AudioCache.set(text, audioBlob)

      const audioUrl = URL.createObjectURL(audioBlob)

      // ... setup audio element
    } catch (err) {
      // ... error handling
    } finally {
      setIsLoading(false)
    }
  }

  // ... rest of component
}
```

### Cache Management UI (`components/reader/VocabularyPanel.tsx`)

```typescript
'use client'

import { useState, useEffect } from 'react'
import { AudioCache } from '@/lib/audio-cache'

export function VocabularyPanel() {
  const [audioStats, setAudioStats] = useState({ totalEntries: 0, totalSize: 0, oldestEntry: 0, lastCleanup: 0 })

  useEffect(() => {
    loadStats()
    AudioCache.cleanup()
  }, [])

  const loadStats = async () => {
    const stats = await AudioCache.getStats()
    setAudioStats(stats)
  }

  const handleClearAudioCache = async () => {
    if (confirm('Clear all cached audio? This will require re-synthesis.')) {
      await AudioCache.clear()
      await loadStats()
    }
  }

  const handleCleanupAudio = async () => {
    await AudioCache.cleanup()
    await loadStats()
  }

  const formatBytes = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Audio Cache Section */}
      <div className="bg-white p-4 rounded-lg border border-sepia-200">
        <h3 className="font-semibold text-sepia-800 mb-3">Audio Cache</h3>

        <div className="space-y-2 text-sm text-sepia-700">
          <div className="flex justify-between">
            <span>Cached audio:</span>
            <span className="font-medium">{audioStats.totalEntries} files</span>
          </div>

          <div className="flex justify-between">
            <span>Cache size:</span>
            <span className="font-medium">{formatBytes(audioStats.totalSize)} / 50 MB</span>
          </div>

          <div className="flex justify-between">
            <span>Oldest entry:</span>
            <span className="font-medium">{formatDate(audioStats.oldestEntry)}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleCleanupAudio}
            className="px-3 py-1.5 text-sm bg-sepia-100 hover:bg-sepia-200 text-sepia-800 rounded transition-colors"
          >
            Remove Expired
          </button>

          <button
            onClick={handleClearAudioCache}
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

### Performance Benefits

**With Caching:**
- First playback: ~2-3 seconds (API synthesis)
- Subsequent playbacks: ~50-100ms (cache retrieval)
- 95%+ cache hit rate for repeated texts
- 60-80% API quota savings

**Storage Efficiency:**
- ~100-200KB per minute of audio (MP3)
- 50MB = ~250-500 minutes of cached audio
- 7-day TTL balances storage and freshness

### Browser Compatibility

**IndexedDB Support:**
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 10+)
- Opera: Full support

**Fallback Strategy:**
If IndexedDB unavailable (rare):
```typescript
if (!window.indexedDB) {
  console.warn('IndexedDB not available, audio caching disabled')
  // Skip cache, always synthesize
}
```

## Architecture References
- `/docs/architecture/caching-strategy.md` - Cache architecture
- `/docs/architecture/frontend-architecture.md` - IndexedDB usage
- `/docs/prd/user-stories.md` - US-404

## Definition of Done
- [ ] AudioCache class created with IndexedDB
- [ ] Cache integrated with AudioPlayer
- [ ] SHA-256 hashing for cache keys
- [ ] 7-day TTL enforced
- [ ] 50MB limit with LRU eviction
- [ ] Cache statistics in VocabularyPanel
- [ ] Manual cache clear button
- [ ] Automatic cleanup on mount
- [ ] TypeScript fully typed
- [ ] Browser fallback handling
