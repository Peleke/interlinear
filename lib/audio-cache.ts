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

      request.onsuccess = () => resolve()
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
          resolve()
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

  private async hashText(text: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }
}

export const AudioCache = new AudioCacheDB()
