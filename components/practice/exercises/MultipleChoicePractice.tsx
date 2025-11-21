'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Target, HelpCircle, Sparkles, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Exercise {
  id: string
  type: 'multiple_choice'
  prompt: string
  answer: string
  choices?: string[]
  spanish_text?: string
  english_text?: string
}

interface MultipleChoicePracticeProps {
  exercise: Exercise
  onAnswer: (isCorrect: boolean) => void
}

export default function MultipleChoicePractice({ exercise, onAnswer }: MultipleChoicePracticeProps) {
  const [selectedChoice, setSelectedChoice] = useState<string>('')
  const [showHint, setShowHint] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isListening, setIsListening] = useState(false)

  // Get choices from exercise data structure
  const getChoices = () => {
    // Handle different data structure formats
    if (exercise.choices && Array.isArray(exercise.choices) && exercise.choices.length >= 2) {
      return exercise.choices
    }
    if (exercise.options?.choices && Array.isArray(exercise.options.choices) && exercise.options.choices.length >= 2) {
      return exercise.options.choices
    }
    if (exercise.options && Array.isArray(exercise.options) && exercise.options.length >= 2) {
      return exercise.options
    }

    // If no valid choices found, create a fallback with generic options
    console.error('No valid choices found for multiple choice exercise:', exercise)

    // Create fallback choices that include the correct answer plus some generic alternatives
    const fallbackChoices = [
      exercise.answer,
      'Option A',
      'Option B',
      'Option C'
    ]

    // Remove duplicates and filter out the correct answer from generic options
    const uniqueChoices = Array.from(new Set(fallbackChoices)).filter((choice, index) => {
      if (index === 0) return true // Always include the correct answer
      return choice !== exercise.answer // Don't duplicate the correct answer
    })

    // Ensure we have at least 2 choices
    if (uniqueChoices.length < 2) {
      uniqueChoices.push('Alternative Option')
    }

    return uniqueChoices.slice(0, 4) // Limit to 4 choices max
  }

  const choices = getChoices()

  // Validate that we have enough choices for a proper multiple choice question
  if (choices.length < 2) {
    console.error('Insufficient choices for multiple choice question:', choices)
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error: This multiple choice question has insufficient answer options.</p>
        <p className="text-sm text-gray-500">Expected at least 2 choices, got {choices.length}</p>
      </div>
    )
  }

  // Debug: Log choices to help troubleshoot
  console.log('MultipleChoice - exercise.choices:', exercise.choices)
  console.log('MultipleChoice - exercise.options:', exercise.options)
  console.log('MultipleChoice - final choices:', choices)

  // Shuffle choices to randomize correct answer position
  const [shuffledChoices] = useState(() => {
    const shuffled = [...choices]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  })

  const handleSubmit = () => {
    if (!selectedChoice || isSubmitting) return

    setIsSubmitting(true)

    // Check if the selected choice matches the correct answer
    const isCorrect = selectedChoice === exercise.answer

    setTimeout(() => {
      onAnswer(isCorrect)
      setIsSubmitting(false)
    }, 300)
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

  // Choice option labels
  const choiceLabels = ['A', 'B', 'C', 'D']

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-6 pb-4">

      {/* Context Text */}
      {exercise.spanish_text && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xl text-amber-800 italic leading-relaxed">
                "{exercise.spanish_text}"
              </p>
            </div>

            {/* Audio Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={playAudio}
              className={`ml-4 p-3 rounded-full transition-colors ${
                isListening
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-amber-500 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <Volume2 className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Main Question */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-4"
      >
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <p className="text-xl text-blue-900 leading-relaxed">
            {exercise.prompt}
          </p>
        </div>
      </motion.div>

      {/* Answer Choices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >

        {shuffledChoices.map((choice, index) => (
          <motion.button
            key={choice}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            onClick={() => setSelectedChoice(choice)}
            className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 ${
              selectedChoice === choice
                ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-sepia-50 transform scale-[1.02] shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-4">
              {/* Choice Label */}
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                selectedChoice === choice
                  ? 'border-green-400 bg-green-400 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}>
                {choiceLabels[index]}
              </div>

              {/* Choice Text */}
              <span className={`text-lg ${
                selectedChoice === choice ? 'text-green-800 font-medium' : 'text-gray-700'
              }`}>
                {choice}
              </span>

              {/* Selection Indicator */}
              <AnimatePresence>
                {selectedChoice === choice && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="ml-auto"
                  >
                    <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        ))}
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
              {showHint ? 'Hide hint' : 'Show hint'}
            </Button>

            {showHint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Hint</span>
                </div>
                <p className="text-purple-800 italic">
                  💡 {exercise.english_text}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      </div>

      {/* Submit Button - Fixed at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex-shrink-0 text-center pt-4 pb-4 bg-white border-t border-gray-100"
      >
        <Button
          onClick={handleSubmit}
          disabled={!selectedChoice || isSubmitting}
          className={`px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300 ${
            selectedChoice
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transform hover:scale-105'
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
              Check Answer
            </>
          )}
        </Button>

      </motion.div>
    </div>
  )
}