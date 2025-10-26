'use client'

import { useState, useEffect } from 'react'
import { DictionaryCache } from '@/lib/dictionary-cache'

export function VocabularyPanel() {
  const [stats, setStats] = useState(DictionaryCache.getStats())

  useEffect(() => {
    // Cleanup expired entries on mount
    DictionaryCache.cleanup()

    // Schedule periodic cleanup (every 24 hours)
    const interval = setInterval(() => {
      DictionaryCache.cleanup()
      setStats(DictionaryCache.getStats())
    }, 24 * 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

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
      <h2 className="text-2xl font-serif text-sepia-900">Your Vocabulary</h2>

      {/* Dictionary Cache Section */}
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

      {/* Vocabulary Entries Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-sepia-200 min-h-96">
        <h3 className="font-semibold text-sepia-800 mb-4">Saved Words</h3>
        <p className="text-sepia-600 text-center py-12">
          No vocabulary entries yet. Click on words while reading to add them to your vocabulary.
        </p>
      </div>
    </div>
  )
}
