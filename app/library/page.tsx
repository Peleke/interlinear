'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/Navigation'
import { LibraryCard } from '@/components/library/LibraryCard'
import { EmptyState } from '@/components/library/EmptyState'

interface LibraryText {
  id: string
  title: string
  content: string
  language: string
  wordCount: number
  createdAt: string
  updatedAt: string
}

export default function LibraryPage() {
  const [texts, setTexts] = useState<LibraryText[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTexts()
  }, [])

  const loadTexts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/library')
      if (!response.ok) {
        throw new Error('Failed to load library')
      }
      const data = await response.json()
      setTexts(data.texts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library')
      console.error('Failed to load library:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this text? This will also remove all associated vocabulary.')) {
      return
    }

    try {
      const response = await fetch(`/api/library/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete text')
      }
      await loadTexts()
    } catch (err) {
      console.error('Failed to delete text:', err)
      alert('Failed to delete text')
    }
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation */}
        <Navigation />

        {/* Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-4xl font-serif text-sepia-900 mb-2">My Library</h1>
          <p className="text-sepia-600">Your saved texts for reading practice</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sepia-700" />
            <span className="ml-3 text-sepia-600">Loading library...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
            <p className="font-medium">Error loading library</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {texts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {texts.map((text) => (
                  <LibraryCard
                    key={text.id}
                    text={text}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
