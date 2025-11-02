'use client'

import { useState } from 'react'
import { marked } from 'marked'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import FillBlankExercise from '@/components/exercises/FillBlankExercise'

// Configure marked for proper rendering
marked.setOptions({
  breaks: true,
  gfm: true
})

interface LessonViewerProps {
  lesson: {
    id: string
    title: string
    description?: string | null
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
  courseId: string
  lessonId: string
  isCompleted: boolean
}

export default function LessonViewer({
  lesson,
  contentBlocks,
  exercises,
  courseId,
  lessonId,
  isCompleted: initialIsCompleted
}: LessonViewerProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted)
  const [isCompleting, setIsCompleting] = useState(false)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    new Set()
  )
  const [totalXpEarned, setTotalXpEarned] = useState(0)

  const handleExerciseComplete = (exerciseId: string, isCorrect: boolean, xpEarned: number) => {
    if (isCorrect) {
      setCompletedExercises((prev) => new Set(prev).add(exerciseId))
      setTotalXpEarned((prev) => prev + xpEarned)
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to complete lesson')
      }

      setIsCompleted(true)
      // Refresh the page to update progress in the course view
      router.refresh()
    } catch (error) {
      console.error('Complete lesson error:', error)
      alert('Failed to mark lesson as complete. Please try again.')
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-parchment">
      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <Navigation />
      </div>

      {/* Header */}
      <div className="bg-white border-b border-sepia-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/courses/${courseId}`}
              className="flex items-center gap-2 text-sepia-600 hover:text-sepia-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Course</span>
            </Link>

            {isCompleted && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lesson content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-sepia-100 text-sepia-700 rounded">
              {lesson.courses?.level}
            </span>
            <span className="text-sm text-sepia-600">
              {lesson.courses?.title}
            </span>
          </div>

          <h1 className="text-4xl font-serif text-sepia-900 mb-4">
            {lesson.title}
          </h1>

          {lesson.description && (
            <p className="text-lg text-sepia-700 leading-relaxed">
              {lesson.description}
            </p>
          )}
        </div>

        {/* Content blocks */}
        {contentBlocks && contentBlocks.length > 0 ? (
          <div className="space-y-8">
            {contentBlocks.map((block) => {
              switch (block.content_type) {
                case 'markdown':
                  return (
                    <div
                      key={block.id}
                      className="prose prose-sepia max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: marked(block.content || '')
                      }}
                    />
                  )

                case 'interlinear':
                  return (
                    <div
                      key={block.id}
                      className="bg-white rounded-lg border border-sepia-200 p-6"
                    >
                      <div className="space-y-4">
                        {/* Render interlinear content (simplified for now) */}
                        <div className="font-serif text-xl text-sepia-900">
                          {block.content}
                        </div>
                      </div>
                    </div>
                  )

                case 'vocabulary':
                  return (
                    <div
                      key={block.id}
                      className="bg-amber-50 rounded-lg border border-amber-200 p-6"
                    >
                      <h3 className="text-lg font-semibold text-sepia-900 mb-4">
                        📚 Vocabulary
                      </h3>
                      <div
                        className="prose prose-sepia max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: marked(block.content || '')
                        }}
                      />
                    </div>
                  )

                case 'grammar':
                  return (
                    <div
                      key={block.id}
                      className="bg-blue-50 rounded-lg border border-blue-200 p-6"
                    >
                      <h3 className="text-lg font-semibold text-sepia-900 mb-4">
                        ✏️ Grammar Note
                      </h3>
                      <div
                        className="prose prose-sepia max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: marked(block.content || '')
                        }}
                      />
                    </div>
                  )

                default:
                  return null
              }
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sepia-600">
              Lesson content is being prepared. Check back soon!
            </p>
          </div>
        )}

        {/* Exercises Section */}
        {exercises && exercises.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif text-sepia-900">
                Practice Exercises
              </h2>
              {totalXpEarned > 0 && (
                <div className="px-4 py-2 bg-green-100 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900">
                    +{totalXpEarned} XP earned
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-6">
              {exercises.map((exercise) => (
                <FillBlankExercise
                  key={exercise.id}
                  exerciseId={exercise.id}
                  prompt={exercise.prompt}
                  spanishText={exercise.spanish_text || undefined}
                  englishText={exercise.english_text || undefined}
                  onComplete={(isCorrect, xpEarned) =>
                    handleExerciseComplete(exercise.id, isCorrect, xpEarned)
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Complete lesson button */}
        {!isCompleted && contentBlocks && contentBlocks.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="px-8 py-3 bg-sepia-700 text-white font-medium rounded-lg hover:bg-sepia-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Completing...</span>
                </>
              ) : (
                <span>Mark as Complete</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
