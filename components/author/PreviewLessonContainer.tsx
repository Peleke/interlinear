'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import FillBlankExercise from '@/components/exercises/FillBlankExercise'
import DialogViewer from '@/components/dialogs/DialogViewer'

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

interface LessonViewerProps {
  lesson: {
    id: string
    title: string
    overview?: string | null
    courses?: {
      title: string
      level: string
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
  dialog: Dialog | null
  courseId: string
  previewMode?: boolean // Flag to indicate preview mode
}

export function LessonViewer({
  lesson,
  contentBlocks,
  exercises,
  readings,
  dialog,
  courseId,
  previewMode = false
}: LessonViewerProps) {
  const [exercisesExpanded, setExercisesExpanded] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)

  // Preview mode simulated completion states
  const [previewCompletedExercises, setPreviewCompletedExercises] = useState<Set<string>>(new Set())

  // Handle exercise completion in preview mode
  const handlePreviewExerciseComplete = (exerciseId: string) => {
    if (!previewMode) return

    setPreviewCompletedExercises(prev => new Set([...prev, exerciseId]))

    // Simulate XP gain notification
    setTimeout(() => {
      // You could add a toast notification here for preview
      console.log(`Preview: Exercise ${exerciseId} completed! (+10 XP)`)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Preview Mode Indicator */}
      {previewMode && (
        <div className="sticky top-0 z-40 bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
            <Eye className="h-4 w-4" />
            <span className="font-medium">Preview Mode</span>
            <span className="text-blue-600">- Exercise interactions work but don't save progress</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {lesson.courses?.level || 'Intermediate'} • {lesson.courses?.title || 'Course'}
          </div>

          <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>

          {lesson.overview && (
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {lesson.overview}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Readings */}
        {readings && readings.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
              📖 Reading
            </h2>
            {readings.map((reading) => (
              <div key={reading.id} className="bg-white rounded-lg border p-6 shadow-sm">
                <h3 className="text-lg font-medium mb-3">{reading.title}</h3>
                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {reading.content}
                  </ReactMarkdown>
                </div>
                <div className="text-sm text-gray-500 mt-4">
                  📊 {reading.word_count} words
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Content Blocks */}
        {contentBlocks && contentBlocks.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
              📝 Lesson Content
            </h2>
            {contentBlocks.map((block) => (
              <div key={block.id} className="bg-white rounded-lg border p-6 shadow-sm">
                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {block.content || 'No content available'}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Dialog */}
        {dialog && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
              💬 Dialog Practice
            </h2>
            <DialogViewer
              dialogId={dialog.id}
              context={dialog.context}
              setting={dialog.setting}
              exchanges={dialog.exchanges}
              previewMode={previewMode}
            />
          </section>
        )}

        {/* Exercises */}
        {exercises && exercises.length > 0 && (
          <section className="space-y-4">
            <button
              onClick={() => setExercisesExpanded(!exercisesExpanded)}
              className="flex items-center gap-2 text-xl font-semibold text-gray-900 border-b pb-2 w-full hover:text-blue-600 transition-colors"
            >
              🏋️ Exercises ({exercises.length})
              {exercisesExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {exercisesExpanded && (
              <div className="space-y-6">
                {exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="bg-white rounded-lg border p-6 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        Exercise {index + 1}
                      </span>
                      {previewMode && previewCompletedExercises.has(exercise.id) && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {previewMode && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Preview
                        </span>
                      )}
                    </div>

                    {exercise.type === 'fill_blank' && (
                      <FillBlankExercise
                        exerciseId={exercise.id}
                        prompt={exercise.prompt}
                        spanishText={exercise.spanish_text || ''}
                        englishText={exercise.english_text}
                        previewMode={previewMode}
                        onComplete={() => handlePreviewExerciseComplete(exercise.id)}
                      />
                    )}

                    {exercise.type !== 'fill_blank' && (
                      <div className="text-center py-8 text-gray-500">
                        <p>Exercise type "{exercise.type}" not yet supported in preview</p>
                        <p className="text-sm">Prompt: {exercise.prompt}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Preview Mode Footer */}
        {previewMode && (
          <div className="text-center py-8 text-gray-500 border-t">
            <p className="text-sm">
              🔍 This is a preview of how learners will see this lesson
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Exercise progress is simulated and will not be saved
            </p>
          </div>
        )}
      </div>
    </div>
  )
}