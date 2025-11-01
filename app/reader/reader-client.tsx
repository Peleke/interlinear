'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { TextInputPanel } from '@/components/reader/TextInputPanel'
import { TextRenderPanel } from '@/components/reader/TextRenderPanel'
import { VocabularyPanel } from '@/components/reader/VocabularyPanel'
import { TutorPanel } from '@/components/reader/TutorPanel'
import { FlashcardsPanel } from '@/components/reader/FlashcardsPanel'

type Mode = 'input' | 'render' | 'vocabulary' | 'tutor' | 'flashcards'

export function ReaderClient() {
  const searchParams = useSearchParams()
  const libraryId = searchParams.get('libraryId')
  const tabParam = searchParams.get('tab')

  const [mode, setMode] = useState<Mode>('input')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [currentLibraryId, setCurrentLibraryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Load library text if libraryId present
  useEffect(() => {
    if (libraryId) {
      loadLibraryText(libraryId)
    }
  }, [libraryId])

  // Switch to tab if specified in URL
  useEffect(() => {
    if (tabParam && ['input', 'render', 'vocabulary', 'tutor', 'flashcards'].includes(tabParam)) {
      setMode(tabParam as Mode)
    }
  }, [tabParam])

  const loadLibraryText = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/library/${id}`)
      if (!response.ok) {
        throw new Error('Failed to load text')
      }
      const data = await response.json()
      setText(data.text.content)
      setTitle(data.text.title)
      setCurrentLibraryId(data.text.id)
      // Only set mode to 'render' if no tab param specified
      if (!tabParam) {
        setMode('render')
      }
    } catch (err) {
      console.error('Failed to load library text:', err)
      alert('Failed to load text from library')
    } finally {
      setLoading(false)
    }
  }

  const handleRenderClick = async () => {
    // Save to library if not already saved
    if (!currentLibraryId && text.trim()) {
      try {
        const response = await fetch('/api/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Reading ${new Date().toLocaleDateString()}`,
            content: text,
            language: 'es',
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setCurrentLibraryId(data.text.id)
          setTitle(data.text.title)
        }
      } catch (err) {
        console.error('Failed to save to library:', err)
        // Continue to render even if save fails
      }
    }

    setMode('render')
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sepia-700" />
          <span className="ml-3 text-sepia-600">Loading text...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Navigation */}
      <Navigation />

      {/* Title (if viewing library text) */}
      {title && currentLibraryId && (
        <div className="mb-4">
          <h2 className="text-2xl font-serif text-sepia-900">{title}</h2>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="flex gap-2 mb-6 border-b border-sepia-300">
        <button
          onClick={() => setMode('input')}
          className={`px-6 py-3 font-serif transition-colors ${
            mode === 'input'
              ? 'border-b-2 border-sepia-700 text-sepia-900'
              : 'text-sepia-600 hover:text-sepia-800'
          }`}
        >
          Input Text
        </button>
        <button
          onClick={() => setMode('render')}
          disabled={!text}
          className={`px-6 py-3 font-serif transition-colors ${
            mode === 'render'
              ? 'border-b-2 border-sepia-700 text-sepia-900'
              : 'text-sepia-600 hover:text-sepia-800 disabled:opacity-50'
          }`}
        >
          Read
        </button>
        <button
          onClick={() => setMode('vocabulary')}
          className={`px-6 py-3 font-serif transition-colors ${
            mode === 'vocabulary'
              ? 'border-b-2 border-sepia-700 text-sepia-900'
              : 'text-sepia-600 hover:text-sepia-800'
          }`}
        >
          Vocabulary
        </button>
        <button
          onClick={() => setMode('tutor')}
          className={`px-6 py-3 font-serif transition-colors ${
            mode === 'tutor'
              ? 'text-sepia-900 border-b-2 border-sepia-700'
              : 'text-sepia-600 hover:text-sepia-800'
          }`}
        >
          Tutor
        </button>
        <button
          onClick={() => setMode('flashcards')}
          className={`px-6 py-3 font-serif transition-colors ${
            mode === 'flashcards'
              ? 'text-sepia-900 border-b-2 border-sepia-700'
              : 'text-sepia-600 hover:text-sepia-800'
          }`}
        >
          Flashcards
        </button>
      </div>

      {/* Content Panel */}
      <div className="transition-opacity duration-200">
        {mode === 'input' && (
          <TextInputPanel
            text={text}
            onTextChange={setText}
            onRenderClick={handleRenderClick}
          />
        )}
        {mode === 'render' && text && (
          <TextRenderPanel
            text={text}
            onEditClick={() => setMode('input')}
            libraryId={currentLibraryId}
          />
        )}
        {mode === 'vocabulary' && <VocabularyPanel textId={currentLibraryId} />}
        {mode === 'tutor' && <TutorPanel textId={currentLibraryId} />}
        {mode === 'flashcards' && <FlashcardsPanel textId={currentLibraryId} textTitle={title} />}
      </div>
    </div>
  )
}
