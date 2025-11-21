'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Volume2, HelpCircle, Languages, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Exercise {
  id: string
  type: 'translation'
  prompt: string
  answer: string
  spanish_text?: string
  english_text?: string
}

interface TranslationPracticeProps {
  exercise: Exercise
  onAnswer: (isCorrect: boolean) => void
}

export default function TranslationPractice({ exercise, onAnswer }: TranslationPracticeProps) {
  const [userAnswer, setUserAnswer] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Focus textarea when component mounts
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleSubmit = () => {
    if (!userAnswer.trim() || isSubmitting) return

    setIsSubmitting(true)

    // Simple answer checking - in real app, this would be more sophisticated
    const normalizedAnswer = userAnswer.trim().toLowerCase().replace(/[.,!?;]/g, '')
    const normalizedCorrect = exercise.answer.toLowerCase().replace(/[.,!?;]/g, '')
    const isCorrect = normalizedAnswer === normalizedCorrect

    setTimeout(() => {
      onAnswer(isCorrect)
      setIsSubmitting(false)
    }, 300)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const playAudio = () => {
    setIsListening(true)
    // In a real app, you'd implement text-to-speech here
    console.log('Playing audio for:', exercise.spanish_text || exercise.prompt)

    // Simulate audio playing
    setTimeout(() => {
      setIsListening(false)
    }, 2000)
  }

  // Determine source text (what to translate)
  const sourceText = exercise.spanish_text || exercise.prompt.replace(/^Translate to [^:]+:\s*/, '').replace(/^["']|["']$/g, '')
  const isSpanishToEnglish = exercise.spanish_text && exercise.english_text

  return (
    <div className="space-y-6">


      {/* Source Text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-lg font-bold text-blue-900 mb-2">
              Translate:
            </p>
            <p className="text-xl text-blue-800 leading-relaxed">
              "{sourceText}"
            </p>
          </div>

          {/* Audio Button */}
          {exercise.spanish_text && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={playAudio}
              className={`ml-4 p-3 rounded-full transition-colors ${
                isListening
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-blue-500 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              <Volume2 className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Translation Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your English translation here..."
            rows={4}
            className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition-colors resize-none"
          />

          {/* Character counter */}
          <div className="absolute bottom-2 right-3 text-xs text-gray-400">
            {userAnswer.length} characters
          </div>
        </div>

        {/* Progress indicator */}
        <motion.div
          className="h-1 bg-gray-100 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: userAnswer ? 1 : 0 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((userAnswer.length / 50) * 100, 100)}%` }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </motion.div>

      {/* Hint Section */}
      <AnimatePresence>
        {exercise.english_text && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-center"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className="text-gray-500 hover:text-gray-700"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              {showHint ? 'Hide expected answer' : 'Show expected answer'}
            </Button>

            {showHint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">Expected Translation</span>
                </div>
                <p className="text-amber-800 italic">
                  "{exercise.english_text}"
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center pt-6 pb-4"
      >
        <Button
          onClick={handleSubmit}
          disabled={!userAnswer.trim() || isSubmitting}
          className={`px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300 ${
            userAnswer.trim()
              ? 'bg-gradient-to-r from-blue-600 to-sepia-700 hover:from-blue-700 hover:to-sepia-800 text-white shadow-lg transform hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Check Translation
            </>
          )}
        </Button>

        {userAnswer.trim() && !isSubmitting && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500 mt-2"
          >
            Press Enter to submit, or Shift+Enter for new line
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}