'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, CheckCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import FillBlankExercise from '@/components/exercises/FillBlankExercise'
import MultipleChoiceExercise from '@/components/exercises/MultipleChoiceExercise'
import TranslationExercise from '@/components/exercises/TranslationExercise'
import DialogViewer from '@/components/dialogs/DialogViewer'
import { getOrCreateCourseDeck, type CourseDeck } from '@/lib/services/course-deck-manager'
import { toast } from 'sonner'
import { Confetti } from '@/components/Confetti'

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
  dialog: Dialog | null
  // NEW STRUCTURE PROPS
  allDialogs?: Dialog[]
  newExercises?: Array<any>
  grammarConcepts?: Array<any>
  isNewStructure?: boolean
  // END NEW STRUCTURE
  courseId: string
  lessonId: string
  isCompleted: boolean
}

export default function LessonViewer({
  lesson,
  contentBlocks,
  exercises,
  readings,
  dialog,
  allDialogs,
  newExercises,
  grammarConcepts,
  isNewStructure,
  courseId,
  lessonId,
  isCompleted: initialIsCompleted
}: LessonViewerProps) {
  const router = useRouter()

  // DEBUG: Log lesson language to verify it's being passed correctly
  console.log('[LessonViewer] lesson.language:', lesson.language, 'lesson.title:', lesson.title)

  const [isCompleted, setIsCompleted] = useState(initialIsCompleted)
  const [isCompleting, setIsCompleting] = useState(false)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    new Set()
  )
  const [totalXpEarned, setTotalXpEarned] = useState(0)
  const [exercisesExpanded, setExercisesExpanded] = useState(false)
  const [grammarExpanded, setGrammarExpanded] = useState<Record<string, boolean>>({})
  const [vocabularyExpanded, setVocabularyExpanded] = useState<Record<string, boolean>>({})
  const [dialogsExpanded, setDialogsExpanded] = useState<Record<string, boolean>>({})
  const [courseDeck, setCourseDeck] = useState<CourseDeck | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  // Auto-fetch or create course deck on mount
  useEffect(() => {
    const initCourseDeck = async () => {
      if (!lesson.courses?.title) return

      console.log('[LessonViewer] Getting course deck for courseId:', courseId)
      const deck = await getOrCreateCourseDeck(courseId, lesson.courses.title)
      console.log('[LessonViewer] Got deck:', deck)
      if (deck) {
        setCourseDeck(deck)
        console.log('[LessonViewer] Set courseDeck.id:', deck.id)
      }
    }

    initCourseDeck()
  }, [courseId, lesson.courses?.title])

  const handleExerciseComplete = (exerciseId: string, isCorrect: boolean, xpEarned: number) => {
    if (isCorrect) {
      setCompletedExercises((prev) => new Set(prev).add(exerciseId))
      setTotalXpEarned((prev) => prev + xpEarned)
    }
  }


  const handleToggleComplete = async () => {
    setIsCompleting(true)
    try {
      if (isCompleted) {
        // Mark as incomplete (for debugging)
        const response = await fetch(`/api/lessons/${lessonId}/incomplete`, {
          method: 'POST'
        })

        if (!response.ok) {
          throw new Error('Failed to mark lesson as incomplete')
        }

        setIsCompleted(false)

        // Refresh the page data to update cache
        router.refresh()

        toast.info('Lesson marked as incomplete', {
          description: 'You can complete it again for testing.',
          duration: 2000
        })
      } else {
        // Mark as complete
        const response = await fetch(`/api/lessons/${lessonId}/complete`, {
          method: 'POST'
        })

        if (!response.ok) {
          throw new Error('Failed to complete lesson')
        }

        setIsCompleted(true)

        // Trigger confetti animation
        setShowConfetti(true)

        // Show success toast
        toast.success('¡Felicidades! Lesson completed! 🎉', {
          description: 'Great job! Keep up the excellent work.',
          duration: 3000
        })

        // Navigate back to course after a short delay (after confetti)
        setTimeout(() => {
          router.push(`/courses/${courseId}`)
        }, 2500)
      }
    } catch (error) {
      console.error('Toggle lesson completion error:', error)
      toast.error(`Failed to ${isCompleted ? 'uncomplete' : 'complete'} lesson. Please try again.`)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-parchment">
      {/* Confetti Animation */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

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
              {lesson.courses?.difficulty_level}
            </span>
            <span className="text-sm text-sepia-600">
              {lesson.courses?.title}
            </span>
          </div>

          <h1 className="text-4xl font-serif text-sepia-900 mb-4">
            {lesson.title}
          </h1>

          {lesson.overview && (
            <div className="text-lg text-sepia-700 leading-relaxed">
              {isNewStructure ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {lesson.overview}
                </ReactMarkdown>
              ) : (
                <p>{lesson.overview}</p>
              )}
            </div>
          )}
        </div>

        {/* Dialog Section - Handle both old and new structures */}
        {isNewStructure ? (
          // NEW STRUCTURE: Multiple dialogs - collapsible
          allDialogs && allDialogs.length > 0 && (
            <div className="space-y-8 mb-12">
              {allDialogs.map((dialogItem, index) => (
                <div key={dialogItem.id} className="bg-blue-50 border border-blue-200 rounded-lg">
                  <button
                    onClick={() => setDialogsExpanded(prev => ({
                      ...prev,
                      [dialogItem.id]: !prev[dialogItem.id]
                    }))}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <h3 className="text-lg font-semibold text-sepia-900">
                      💬 {dialogItem.context}
                    </h3>
                    {dialogsExpanded[dialogItem.id] ? (
                      <ChevronUp className="h-5 w-5 text-sepia-700" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-sepia-700" />
                    )}
                  </button>
                  {dialogsExpanded[dialogItem.id] && (
                    <div className="px-6 pb-6">
                      <DialogViewer
                        dialogId={dialogItem.id}
                        context={dialogItem.context}
                        setting={dialogItem.setting || undefined}
                        exchanges={dialogItem.exchanges}
                        courseDeckId={courseDeck?.id}
                        language={lesson.language || 'es'}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          // OLD STRUCTURE: Single dialog
          dialog && (
            <div className="mb-12">
              <DialogViewer
                dialogId={dialog.id}
                context={dialog.context}
                setting={dialog.setting || undefined}
                exchanges={dialog.exchanges}
                courseDeckId={courseDeck?.id}
                language={lesson.language || 'es'}
              />
            </div>
          )
        )}

        {/* NEW STRUCTURE: Grammar Concepts */}
        {isNewStructure && grammarConcepts && grammarConcepts.length > 0 && (
          <div className="space-y-6 mb-12">
            {grammarConcepts.map((concept, index) => (
              <div key={concept.id || index} className="bg-amber-50 border border-amber-200 rounded-lg">
                <button
                  onClick={() => setGrammarExpanded(prev => ({
                    ...prev,
                    [concept.id || index]: !prev[concept.id || index]
                  }))}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-semibold text-sepia-900">
                    ✏️ {(concept.name || concept.display_name || 'Grammar Note')
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  {grammarExpanded[concept.id || index] ? (
                    <ChevronUp className="h-5 w-5 text-sepia-700" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-sepia-700" />
                  )}
                </button>
                {grammarExpanded[concept.id || index] && (
                  <div className="px-6 pb-6">
                    <div className="prose prose-sepia max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {concept.content || concept.description || 'No content available'}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content blocks - Grammar & Vocabulary only (markdown dialog removed) */}
        {contentBlocks && contentBlocks.length > 0 && (
          <div className="space-y-8">
            {contentBlocks.map((block) => {
              // Skip markdown and interlinear content (dialog already rendered above)
              if (block.content_type === 'markdown' || block.content_type === 'interlinear') {
                return null
              }

              switch (block.content_type) {

                case 'vocabulary':
                  return (
                    <div
                      key={block.id}
                      className="bg-amber-50 rounded-lg border border-amber-200"
                    >
                      <button
                        onClick={() => setVocabularyExpanded(prev => ({ ...prev, [block.id]: !prev[block.id] }))}
                        className="w-full flex items-center justify-between p-4 hover:bg-amber-100 transition-colors rounded-t-lg"
                      >
                        <h3 className="text-lg font-semibold text-sepia-900">
                          📚 Vocabulary
                        </h3>
                        {vocabularyExpanded[block.id] ? (
                          <ChevronUp className="h-5 w-5 text-sepia-700" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-sepia-700" />
                        )}
                      </button>
                      {vocabularyExpanded[block.id] && (
                        <div className="px-6 pb-6">
                          <div className="prose prose-sepia max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {block.content || ''}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  )

                case 'grammar':
                  return (
                    <div
                      key={block.id}
                      className="bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <button
                        onClick={() => setGrammarExpanded(prev => ({ ...prev, [block.id]: !prev[block.id] }))}
                        className="w-full flex items-center justify-between p-4 hover:bg-blue-100 transition-colors rounded-t-lg"
                      >
                        <h3 className="text-lg font-semibold text-sepia-900">
                          ✏️ Grammar Note
                        </h3>
                        {grammarExpanded[block.id] ? (
                          <ChevronUp className="h-5 w-5 text-sepia-700" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-sepia-700" />
                        )}
                      </button>
                      {grammarExpanded[block.id] && (
                        <div className="px-6 pb-6">
                          <div className="prose prose-sepia max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {block.content || ''}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  )

                default:
                  return null
              }
            })}
          </div>
        )}

        {/* Exercises Section - Handle both old and new structures */}
        {isNewStructure ? (
          // NEW STRUCTURE: Different exercise format
          newExercises && newExercises.length > 0 && (
            <div className="mt-12 bg-white rounded-lg border-2 border-sepia-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif text-sepia-900">
                  ✏️ Practice Exercises
                </h2>
                <button
                  onClick={() => setExercisesExpanded(!exercisesExpanded)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sepia-700 hover:bg-sepia-800 rounded transition-colors"
                >
                  {exercisesExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span>Collapse All</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span>Expand All</span>
                    </>
                  )}
                </button>
              </div>
              {exercisesExpanded && (
                <div className="space-y-6">
                  {newExercises.map((exercise, index) => {
                    // Render appropriate exercise component based on type
                    switch (exercise.exercise_type) {
                      case 'fill_blank':
                        return (
                          <FillBlankExercise
                            key={exercise.id || index}
                            exerciseId={exercise.id}
                            prompt={exercise.prompt || exercise.question}
                            correctAnswer={exercise.correct_answer}
                            spanishText={exercise.spanish_text}
                            englishText={exercise.english_text}
                            courseDeckId={courseDeck?.id}
                            onComplete={handleExerciseComplete}
                          />
                        )
                      case 'multiple_choice':
                        return (
                          <MultipleChoiceExercise
                            key={exercise.id || index}
                            exerciseId={exercise.id}
                            prompt={exercise.prompt || exercise.question}
                            choices={exercise.options?.choices || exercise.options || []}
                            correctAnswer={exercise.correct_answer}
                            spanishText={exercise.spanish_text}
                            englishText={exercise.english_text}
                            courseDeckId={courseDeck?.id}
                            onComplete={handleExerciseComplete}
                          />
                        )
                      case 'translation':
                        return (
                          <TranslationExercise
                            key={exercise.id || index}
                            exerciseId={exercise.id}
                            prompt={exercise.prompt || exercise.question}
                            correctAnswer={exercise.correct_answer}
                            spanishText={exercise.spanish_text}
                            englishText={exercise.english_text}
                            direction={exercise.direction}
                            courseDeckId={courseDeck?.id}
                            onComplete={handleExerciseComplete}
                          />
                        )
                      default:
                        // Fallback for unknown exercise types
                        return (
                          <div key={exercise.id || index} className="border border-sepia-200 rounded-lg p-4">
                            <h3 className="font-semibold text-sepia-900 mb-2">
                              Exercise {index + 1} - Type: {exercise.exercise_type} (Unsupported)
                            </h3>
                            <p className="text-sm text-amber-600">
                              This exercise type is not yet supported. Please contact support.
                            </p>
                          </div>
                        )
                    }
                  })}
                </div>
              )}
            </div>
          )
        ) : (
          // OLD STRUCTURE: Original exercise format
          exercises && exercises.length > 0 && (
          <div className="mt-12 bg-white rounded-lg border-2 border-sepia-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-serif text-sepia-900">
                  ✏️ Practice Exercises
                </h2>
                <button
                  onClick={() => setExercisesExpanded(!exercisesExpanded)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sepia-700 hover:bg-sepia-800 rounded transition-colors"
                >
                  {exercisesExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span>Collapse All</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span>Expand All</span>
                    </>
                  )}
                </button>
              </div>
              {totalXpEarned > 0 && (
                <div className="px-4 py-2 bg-green-100 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900">
                    +{totalXpEarned} XP earned
                  </p>
                </div>
              )}
            </div>
            {exercisesExpanded && (
              <div className="space-y-6">
                {exercises.map((exercise) => {
                  const ExerciseComponent = exercise.exercise_type === 'multiple_choice'
                    ? MultipleChoiceExercise
                    : FillBlankExercise;

                  return (
                    <ExerciseComponent
                      key={exercise.id}
                      exerciseId={exercise.id}
                      prompt={exercise.prompt}
                      spanishText={exercise.spanish_text || undefined}
                      englishText={exercise.english_text || undefined}
                      courseDeckId={courseDeck?.id}
                      onComplete={(isCorrect, xpEarned) =>
                        handleExerciseComplete(exercise.id, isCorrect, xpEarned)
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
          )
        )}

        {/* Practice Resources Section - Now below exercises */}
        {readings.length > 0 && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-serif text-sepia-900 mb-4">
              📚 Interactive Readings
            </h2>
            <div className="space-y-2">
              {readings.map((reading) => (
                <Link
                  key={reading.id}
                  href={`/reader?readingId=${reading.id}&lessonId=${lessonId}&courseId=${courseId}`}
                  className="block p-3 bg-white rounded border border-blue-300 hover:border-blue-500 hover:shadow-sm transition-all"
                >
                  <p className="font-medium text-sepia-900">
                    {reading.title}
                  </p>
                  <p className="text-sm text-sepia-600">
                    {reading.word_count} words
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Complete/Incomplete toggle button - Always visible for debugging */}
        {contentBlocks && contentBlocks.length > 0 && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleToggleComplete}
              disabled={isCompleting}
              className={`px-8 py-3 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                isCompleted
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-sepia-700 hover:bg-sepia-800 text-white'
              }`}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{isCompleted ? 'Unmarking...' : 'Completing...'}</span>
                </>
              ) : (
                <span>{isCompleted ? 'Mark as Incomplete (Debug)' : 'Mark as Complete'}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
