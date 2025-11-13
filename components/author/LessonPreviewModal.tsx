'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LessonViewer } from './PreviewLessonContainer'

interface LessonPreviewModalProps {
  lessonId: string
  isOpen: boolean
  onClose: () => void
}

interface DialogExchange {
  id: string
  sequence_order: number
  speaker: string
  spanish: string
  english: string
}

interface Dialog {
  id: string
  context: string
  setting?: string | null
  exchanges: DialogExchange[]
}

interface LessonPreviewData {
  lesson: {
    id: string
    title: string
    overview?: string | null
    language?: 'es' | 'la'
    courses?: {
      title: string
      difficulty_level: string
    } | null
  }
  contentBlocks: Array<{
    id: string
    content_type: string
    content?: string | null
  }>
  exercises: Array<{
    id: string
    prompt: string
    type: string
    spanish_text?: string | null
    english_text?: string | null
  }>
  readings: Array<{
    id: string
    title: string
    content: string
    word_count: number
  }>
  dialogs: Dialog[]
}

export default function LessonPreviewModal({ lessonId, isOpen, onClose }: LessonPreviewModalProps) {
  const [lessonData, setLessonData] = useState<LessonPreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch lesson data for preview
  useEffect(() => {
    if (!isOpen || !lessonId) return

    const fetchLessonData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/lessons/${lessonId}/preview`)

        if (!response.ok) {
          throw new Error(`Failed to fetch lesson: ${response.statusText}`)
        }

        const data = await response.json()
        setLessonData(data)
      } catch (err) {
        console.error('Error fetching lesson preview:', err)
        setError(err instanceof Error ? err.message : 'Failed to load lesson preview')
      } finally {
        setLoading(false)
      }
    }

    fetchLessonData()
  }, [lessonId, isOpen])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const openInNewTab = () => {
    window.open(`/author/lessons/${lessonId}/preview`, '_blank')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full h-full max-w-none bg-background border shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              📱 Lesson Preview
              {lessonData?.lesson?.title && (
                <span className="text-muted-foreground font-normal ml-2">
                  - {lessonData.lesson.title}
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Hide "Open in New Tab" on mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewTab}
              className="hidden md:flex gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>

            {/* Show back arrow on mobile, X and text on desktop */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4 md:hidden" />
              <X className="hidden md:block h-4 w-4" />
              <span className="hidden md:inline">Exit Preview</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto h-[calc(100vh-5rem)]">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading lesson preview...
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-600 mb-2">⚠️ Failed to load preview</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {lessonData && !loading && !error && (
            <LessonViewer
              lesson={lessonData.lesson}
              contentBlocks={lessonData.lessonContent}
              exercises={lessonData.exercises}
              readings={lessonData.readings}
              dialogs={lessonData.dialogs || []} // Pass all dialogs
              grammarConcepts={lessonData.grammarConcepts || []} // Pass grammar concepts
              courseId="preview" // Preview mode
              previewMode={true} // Add preview mode flag
            />
          )}
        </div>
      </div>
    </div>
  )
}