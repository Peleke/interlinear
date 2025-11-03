'use client'

import { useState, useEffect } from 'react'
import { VocabularyService } from '@/lib/vocabulary'
import type { VocabularyEntry, VocabularyStats } from '@/types'
import { VocabularyList } from '@/components/vocabulary/VocabularyList'
import { VocabularyStatsDisplay } from '@/components/vocabulary/VocabularyStats'

interface VocabularyPanelProps {
  textId?: string | null
}

export function VocabularyPanel({ textId }: VocabularyPanelProps) {
  const [entries, setEntries] = useState<VocabularyEntry[]>([])
  const [stats, setStats] = useState<VocabularyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Always reload vocabulary when panel mounts OR textId changes
  useEffect(() => {
    loadVocabulary()
  }, [textId])

  const loadVocabulary = async () => {
    setLoading(true)
    setError(null)
    try {
      const [vocabData, statsData] = await Promise.all([
        VocabularyService.getAll(),
        VocabularyService.getStats()
      ])

      // Filter by textId if provided, but fall back to all vocab if none found
      let filteredEntries = vocabData
      if (textId) {
        const textSpecificEntries = vocabData.filter(entry => entry.source_text_id === textId)
        // If no vocab for this specific text, show all vocab instead of empty list
        filteredEntries = textSpecificEntries.length > 0 ? textSpecificEntries : vocabData
      }

      setEntries(filteredEntries)
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
    <div className="space-y-6">
      <h2 className="text-2xl font-serif text-sepia-900">
        Your Vocabulary
      </h2>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sepia-700" />
          <span className="ml-3 text-sepia-600">Loading vocabulary...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
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
  )
}
