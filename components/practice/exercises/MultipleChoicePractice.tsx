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
  const choices = exercise.choices || exercise.options?.choices || exercise.options || [
    exercise.answer,
    'Alternative option 1',
    'Alternative option 2',
    'Alternative option 3'
  ]

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
    <div className="space-y-6">
      {/* Exercise Type Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center"
      >
        <div className="bg-gradient-to-r from-blue-100 to-sepia-100 text-sepia-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
          <Target className="w-4 h-4" />
          Multiple choice
        </div>
      </motion.div>

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
              <p className="text-lg font-medium text-amber-900 mb-2">Spanish Text:</p>
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
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          Choose the correct answer
        </h3>

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
        <p className="text-lg font-medium text-gray-700 mb-4">
          Select your answer:
        </p>

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

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-4"
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

        {selectedChoice && !isSubmitting && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500 mt-3"
          >
            Selected: <span className="font-medium">{selectedChoice}</span>
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}