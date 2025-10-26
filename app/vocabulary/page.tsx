'use client'

import { useState, useEffect } from 'react'
import { VocabularyService } from '@/lib/vocabulary'
import type { VocabularyEntry, VocabularyStats } from '@/types'
import { VocabularyList } from '@/components/vocabulary/VocabularyList'
import { VocabularyStatsDisplay } from '@/components/vocabulary/VocabularyStats'

export default function VocabularyPage() {
  const [entries, setEntries] = useState<VocabularyEntry[]>([])
  const [stats, setStats] = useState<VocabularyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadVocabulary()
  }, [])

  const loadVocabulary = async () => {
    setLoading(true)
    setError(null)
    try {
      const [vocabData, statsData] = await Promise.all([
        VocabularyService.getAll(),
        VocabularyService.getStats()
      ])
      setEntries(vocabData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vocabulary')
      console.error('Failed to load vocabulary:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await VocabularyService.deleteWord(id)
      await loadVocabulary()
    } catch (err) {
      console.error('Failed to delete word:', err)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all vocabulary? This cannot be undone.')) {
      return
    }

    try {
      await VocabularyService.clearAll()
      await loadVocabulary()
    } catch (err) {
      console.error('Failed to clear vocabulary:', err)
    }
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <a
              href="/reader"
              className="text-sepia-700 hover:text-sepia-900 transition-colors inline-flex items-center gap-2"
            >
              <span>←</span> Back to Reader
            </a>
          </div>
          <h1 className="text-4xl font-serif text-sepia-900 mb-2">My Vocabulary</h1>
          <p className="text-sepia-600">Words you've encountered in your reading</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sepia-700" />
            <span className="ml-3 text-sepia-600">Loading vocabulary...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
            <p className="font-medium">Error loading vocabulary</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats */}
            {stats && <VocabularyStatsDisplay stats={stats} />}

            {/* Vocabulary List */}
            <VocabularyList
              entries={entries}
              onDelete={handleDelete}
              onClearAll={handleClearAll}
            />
          </>
        )}
      </div>
    </div>
  )
}
