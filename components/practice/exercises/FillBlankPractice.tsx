'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, HelpCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Exercise {
  id: string
  type: 'fill_blank'
  prompt: string
  answer: string
  spanish_text?: string
  english_text?: string
}

interface FillBlankPracticeProps {
  exercise: Exercise
  onAnswer: (isCorrect: boolean) => void
}

export default function FillBlankPractice({ exercise, onAnswer }: FillBlankPracticeProps) {
  const [userAnswer, setUserAnswer] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSubmit = () => {
    if (!userAnswer.trim() || isSubmitting) return

    setIsSubmitting(true)

    // Simple answer checking - in real app, this would be more sophisticated
    const isCorrect = userAnswer.trim().toLowerCase() === exercise.answer.toLowerCase()

    setTimeout(() => {
      onAnswer(isCorrect)
      setIsSubmitting(false)
    }, 300)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  // Parse the prompt to find the blank
  const parts = exercise.prompt.split('_____')
  const hasBlank = parts.length > 1

  return (
    <div className="space-y-6">

      {/* Context Text */}
      {exercise.spanish_text && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200"
        >
          <p className="text-lg text-gray-800 font-medium mb-2">Spanish Text:</p>
          <p className="text-xl text-amber-800 italic">"{exercise.spanish_text}"</p>
        </motion.div>
      )}

      {/* Main Prompt */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-4"
      >

        {hasBlank ? (
          <div className="flex flex-wrap items-center justify-center gap-3 text-xl leading-relaxed">
            {parts.map((part, index) => (
              <React.Fragment key={index}>
                <span className="text-gray-800">{part}</span>
                {index < parts.length - 1 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="relative"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type here..."
                      className="border-b-3 border-blue-400 bg-transparent text-center font-bold text-blue-600 placeholder-blue-300 focus:outline-none focus:border-blue-600 transition-colors min-w-[120px] px-2 py-1"
                      style={{ width: `${Math.max(userAnswer.length * 12 + 40, 120)}px` }}
                    />
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: userAnswer ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xl text-gray-800">{exercise.prompt}</p>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative max-w-md mx-auto"
            >
              <input
                ref={inputRef}
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer..."
                className="w-full p-4 text-lg text-center border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none transition-colors"
              />
            </motion.div>
          </div>
        )}
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
                className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600"
              >
                💡 <em>"{exercise.english_text}"</em>
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
              Check Answer
            </>
          )}
        </Button>
      </motion.div>
    </div>
  )
}