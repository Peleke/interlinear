import { ProfessorOverview } from '@/lib/tutor-tools'

interface CacheEntry {
  overview: ProfessorOverview
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const TTL = 24 * 60 * 60 * 1000 // 24 hours

export function getCachedOverview(textId: string): ProfessorOverview | null {
  const entry = cache.get(textId)
  if (!entry) return null

  const isExpired = Date.now() - entry.timestamp > TTL
  if (isExpired) {
    cache.delete(textId)
    return null
  }

  return entry.overview
}

export function setCachedOverview(textId: string, overview: ProfessorOverview): void {
  cache.set(textId, {
    overview,
    timestamp: Date.now()
  })
}

// Periodic cleanup (run every hour)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > TTL) {
        cache.delete(key)
      }
    }
  }, 60 * 60 * 1000)
}
