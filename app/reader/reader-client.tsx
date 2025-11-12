'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
  const readingId = searchParams.get('readingId')
  const tabParam = searchParams.get('tab')
  const lessonId = searchParams.get('lessonId')
  const courseId = searchParams.get('courseId')
  const tabsRef = useRef<HTMLDivElement>(null)

  const [mode, setMode] = useState<Mode>('input')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState<'es' | 'la'>('es')
  const [currentLibraryId, setCurrentLibraryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [vocabKey, setVocabKey] = useState(0)

  // Enable horizontal scroll with mouse wheel
  useEffect(() => {
    const tabsElement = tabsRef.current
    if (!tabsElement) return

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        tabsElement.scrollLeft += e.deltaY
      }
    }

    tabsElement.addEventListener('wheel', handleWheel, { passive: false })
    return () => tabsElement.removeEventListener('wheel', handleWheel)
  }, [])

  // Load reading if readingId present
  useEffect(() => {
    if (readingId) {
      loadReadingText(readingId)
    } else if (libraryId) {
      loadLibraryText(libraryId)
    }
  }, [readingId, libraryId])

  // Switch to tab if specified in URL
  useEffect(() => {
    if (tabParam && ['input', 'render', 'vocabulary', 'tutor', 'flashcards'].includes(tabParam)) {
      setMode(tabParam as Mode)
    }
  }, [tabParam])

  const loadReadingText = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/readings/${id}`)
      if (!response.ok) {
        throw new Error('Failed to load reading')
      }
      const data = await response.json()
      setText(data.content)
      setTitle(data.title)
      setCurrentLibraryId(data.id)
      // Only set mode to 'render' if no tab param specified
      if (!tabParam) {
        setMode('render')
      }
    } catch (err) {
      console.error('Failed to load reading:', err)
      alert('Failed to load reading from database')
    } finally {
      setLoading(false)
    }
  }

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
            language: language,
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

      {/* Back to Lesson link (if coming from a lesson) */}
      {lessonId && courseId && (
        <div className="mb-4">
          <Link
            href={`/courses/${courseId}/lessons/${lessonId}`}
            className="inline-flex items-center gap-2 text-sepia-600 hover:text-sepia-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Lesson</span>
          </Link>
        </div>
      )}

      {/* Title (if viewing library text) */}
      {title && currentLibraryId && (
        <div className="mb-4">
          <h2 className="text-2xl font-serif text-sepia-900">{title}</h2>
        </div>
      )}

      {/* Language Selector */}
      <div className="mb-4 flex items-center gap-3 px-2">
        <label htmlFor="language-select" className="text-sm font-medium text-sepia-700">
          Language:
        </label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'es' | 'la')}
          className="px-3 py-2 border border-sepia-300 rounded-md text-sm bg-white text-sepia-900 focus:outline-none focus:ring-2 focus:ring-sepia-500"
        >
          <option value="es">Spanish</option>
          <option value="la">Latin</option>
        </select>
      </div>

      {/* Mode Switcher - Horizontal Scrolling Tabs */}
      <div className="relative mb-6 border-b border-sepia-300">
        {/* Scrollable tab container */}
        <div ref={tabsRef} className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory">
          <button
            onClick={() => setMode('input')}
            className={`px-6 py-3 font-serif transition-colors whitespace-nowrap flex-shrink-0 snap-start ${
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
            className={`px-6 py-3 font-serif transition-colors whitespace-nowrap flex-shrink-0 snap-start ${
              mode === 'render'
                ? 'border-b-2 border-sepia-700 text-sepia-900'
                : 'text-sepia-600 hover:text-sepia-800 disabled:opacity-50'
            }`}
          >
            Read
          </button>
          <button
            onClick={() => {
              setMode('vocabulary')
              setVocabKey(prev => prev + 1) // Force remount to reload data
            }}
            className={`px-6 py-3 font-serif transition-colors whitespace-nowrap flex-shrink-0 snap-start ${
              mode === 'vocabulary'
                ? 'border-b-2 border-sepia-700 text-sepia-900'
                : 'text-sepia-600 hover:text-sepia-800'
            }`}
          >
            Vocabulary
          </button>
          <button
            onClick={() => setMode('tutor')}
            className={`px-6 py-3 font-serif transition-colors whitespace-nowrap flex-shrink-0 snap-start ${
              mode === 'tutor'
                ? 'text-sepia-900 border-b-2 border-sepia-700'
                : 'text-sepia-600 hover:text-sepia-800'
            }`}
          >
            Tutor
          </button>
          <button
            onClick={() => setMode('flashcards')}
            className={`px-6 py-3 font-serif transition-colors whitespace-nowrap flex-shrink-0 snap-start ${
              mode === 'flashcards'
                ? 'text-sepia-900 border-b-2 border-sepia-700'
                : 'text-sepia-600 hover:text-sepia-800'
            }`}
          >
            Flashcards
          </button>
        </div>
      </div>

      {/* Content Panel */}
      <div className="transition-opacity duration-200">
        {mode === 'input' && (
          <TextInputPanel
            text={text}
            language={language}
            onTextChange={setText}
            onRenderClick={handleRenderClick}
          />
        )}
        {mode === 'render' && text && (
          <TextRenderPanel
            text={text}
            language={language}
            onEditClick={() => setMode('input')}
            libraryId={currentLibraryId}
          />
        )}
        {mode === 'vocabulary' && <VocabularyPanel key={vocabKey} textId={currentLibraryId} />}
        {mode === 'tutor' && <TutorPanel textId={currentLibraryId} language={language} />}
        {mode === 'flashcards' && <FlashcardsPanel textId={currentLibraryId} textTitle={title} courseId={courseId} />}
      </div>
    </div>
  )
}
