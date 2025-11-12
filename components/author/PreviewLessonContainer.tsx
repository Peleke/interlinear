'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import FillBlankExercise from '@/components/exercises/FillBlankExercise'
import MultipleChoiceExercise from '@/components/exercises/MultipleChoiceExercise'
import TranslationExercise from '@/components/exercises/TranslationExercise'
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

interface GrammarConcept {
  id: string
  name: string
  description?: string | null
  content: string
}

interface LessonViewerProps {
  lesson: {
    id: string
    title: string
    overview?: string | null
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
  dialogs: Dialog[] // Changed from single dialog to array
  grammarConcepts: GrammarConcept[] // Added grammar concepts
  courseId: string
  previewMode?: boolean // Flag to indicate preview mode
}

export function LessonViewer({
  lesson,
  contentBlocks,
  exercises,
  readings,
  dialogs,
  grammarConcepts,
  courseId,
  previewMode = false
}: LessonViewerProps) {
  const [exercisesExpanded, setExercisesExpanded] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [grammarExpanded, setGrammarExpanded] = useState<Record<string, boolean>>({})
  const [vocabularyExpanded, setVocabularyExpanded] = useState<Record<string, boolean>>({})
  const [dialogsExpanded, setDialogsExpanded] = useState<Record<string, boolean>>({})

  // Preview mode simulated completion states
  const [previewCompletedExercises, setPreviewCompletedExercises] = useState<Set<string>>(new Set())

  // Utility function to format grammar concept names
  const formatConceptName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

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
    <div className="min-h-screen bg-parchment">
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

      {/* Lesson content - matches LessonViewer exactly */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title section - exact match */}
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
            <div className="text-lg text-sepia-700 leading-relaxed prose prose-sepia max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {lesson.overview}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Dialogs Section - Collapsible like in reference screen */}
        {dialogs && dialogs.length > 0 && (
          <div className="space-y-8 mb-12">
            <h2 className="text-2xl font-serif text-sepia-900 mb-4">
              💬 Dialogs
            </h2>
            {dialogs.map((dialog, index) => (
              <div
                key={dialog.id}
                className="bg-purple-50 rounded-lg border border-purple-200"
              >
                <button
                  onClick={() => setDialogsExpanded(prev => ({ ...prev, [dialog.id]: !prev[dialog.id] }))}
                  className="w-full flex items-center justify-between p-4 hover:bg-purple-100 transition-colors rounded-t-lg"
                >
                  <h3 className="text-lg font-semibold text-sepia-900">
                    💬 Dialog {index + 1}: {dialog.context}
                  </h3>
                  {dialogsExpanded[dialog.id] ? (
                    <ChevronUp className="h-5 w-5 text-sepia-700" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-sepia-700" />
                  )}
                </button>
                {dialogsExpanded[dialog.id] && (
                  <div className="p-4">
                    <DialogViewer
                      dialogId={dialog.id}
                      context={dialog.context}
                      setting={dialog.setting || undefined}
                      exchanges={dialog.exchanges}
                      previewMode={previewMode}
                    />
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

        {/* Grammar Concepts Section */}
        {grammarConcepts && grammarConcepts.length > 0 && (
          <div className="space-y-8 mb-12">
            <h2 className="text-2xl font-serif text-sepia-900 mb-4">
              📝 Grammar Concepts
            </h2>
            {grammarConcepts.map((concept) => (
              <div
                key={concept.id}
                className="bg-green-50 rounded-lg border border-green-200"
              >
                <button
                  onClick={() => setGrammarExpanded(prev => ({ ...prev, [concept.id]: !prev[concept.id] }))}
                  className="w-full flex items-center justify-between p-4 hover:bg-green-100 transition-colors rounded-t-lg"
                >
                  <h3 className="text-lg font-semibold text-sepia-900">
                    📝 {formatConceptName(concept.name)}
                  </h3>
                  {grammarExpanded[concept.id] ? (
                    <ChevronUp className="h-5 w-5 text-sepia-700" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-sepia-700" />
                  )}
                </button>
                {grammarExpanded[concept.id] && (
                  <div className="px-6 pb-6">
                    {concept.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {concept.description}
                      </p>
                    )}
                    <div className="prose prose-sepia max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {concept.content || ''}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Exercises Section - Collapsible like in reference screen */}
        {exercises && exercises.length > 0 && (
          <div className="space-y-8 mb-12">
            <h2 className="text-2xl font-serif text-sepia-900 mb-4">
              ✏️ Exercises
            </h2>
            <div className="bg-white rounded-lg border-2 border-sepia-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-serif text-sepia-900">
                    Practice Exercises
                  </h3>
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
                {previewMode && (
                  <div className="px-4 py-2 bg-blue-100 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      🔍 Preview Mode - Progress Not Saved
                    </p>
                  </div>
                )}
              </div>
              {exercisesExpanded && (
                <div className="space-y-6">
                  {exercises.map((exercise, index) => {
                    // Determine exercise type - handle both old and new structure
                    const exerciseType = exercise.type || exercise.exercise_type || 'fill_blank'

                    // Render appropriate exercise component based on type
                    switch (exerciseType) {
                      case 'fill_blank':
                        return (
                          <FillBlankExercise
                            key={exercise.id}
                            exerciseId={exercise.id}
                            prompt={exercise.prompt}
                            correctAnswer={exercise.answer}
                            spanishText={exercise.spanish_text || undefined}
                            englishText={exercise.english_text || undefined}
                            previewMode={previewMode}
                            onComplete={() => handlePreviewExerciseComplete(exercise.id)}
                          />
                        )
                      case 'multiple_choice':
                        return (
                          <MultipleChoiceExercise
                            key={exercise.id}
                            exerciseId={exercise.id}
                            prompt={exercise.prompt}
                            choices={exercise.options?.choices || exercise.options || []}
                            correctAnswer={exercise.answer}
                            spanishText={exercise.spanish_text || undefined}
                            englishText={exercise.english_text || undefined}
                            previewMode={previewMode}
                            onComplete={(isCorrect: boolean, xpEarned: number) => handlePreviewExerciseComplete(exercise.id)}
                          />
                        )
                      case 'translation':
                        return (
                          <TranslationExercise
                            key={exercise.id}
                            exerciseId={exercise.id}
                            prompt={exercise.prompt}
                            correctAnswer={exercise.answer}
                            spanishText={exercise.spanish_text || undefined}
                            englishText={exercise.english_text || undefined}
                            direction={exercise.direction}
                            previewMode={previewMode}
                            onComplete={(isCorrect: boolean, xpEarned: number) => handlePreviewExerciseComplete(exercise.id)}
                          />
                        )
                      default:
                        // Fallback for unknown exercise types
                        return (
                          <div key={exercise.id || index} className="border border-sepia-200 rounded-lg p-4">
                            <h3 className="font-semibold text-sepia-900 mb-2">
                              Exercise {index + 1} - Type: {exerciseType} (Unsupported)
                            </h3>
                            <p className="text-sm text-amber-600">
                              This exercise type is not yet supported in preview mode.
                            </p>
                          </div>
                        )
                    }
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Practice Resources Section - Now below exercises */}
        {readings.length > 0 && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-serif text-sepia-900 mb-4">
              📚 Interactive Readings
            </h2>
            <div className="space-y-2">
              {readings.map((reading) => (
                <div
                  key={reading.id}
                  className="block p-3 bg-white rounded border border-blue-300 cursor-not-allowed opacity-75"
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sepia-900">
                      {reading.title}
                    </p>
                    {previewMode && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        Preview Mode - Links Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-sepia-600">
                    {reading.word_count} words
                  </p>
                </div>
              ))}
            </div>
          </div>
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