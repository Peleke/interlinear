'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Star, Trophy, Zap, CheckCircle, XCircle, ArrowRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FillBlankPractice from './exercises/FillBlankPractice'
import TranslationPractice from './exercises/TranslationPractice'
import MultipleChoicePractice from './exercises/MultipleChoicePractice'
import ChallengeScreen from './ChallengeScreen'
import { Confetti } from '@/components/Confetti'

interface Exercise {
  id: string
  type: 'fill_blank' | 'translation' | 'multiple_choice'
  prompt: string
  answer: string
  choices?: string[]
  spanish_text?: string
  english_text?: string
}

interface PracticeSessionProps {
  exercises: Exercise[]
  onComplete: (xpEarned: number) => void
  onExit: () => void
  lesson: {
    id: string
    title: string
    slug?: string
    overview?: string
    description?: string
  }
}

export default function PracticeSession({
  exercises,
  onComplete,
  onExit,
  lesson
}: PracticeSessionProps) {
  const [showChallenge, setShowChallenge] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lives, setLives] = useState(4)
  const [xp, setXP] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showResult, setShowResult] = useState<'correct' | 'incorrect' | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [sessionStats, setSessionStats] = useState({
    totalQuestions: exercises.length,
    correctAnswers: 0,
    incorrectAnswers: 0
  })

  const progress = ((currentIndex + 1) / exercises.length) * 100
  const maxXP = exercises.length * 15 // 15 XP per exercise
  const xpProgress = (totalXP / maxXP) * 100

  const currentExercise = exercises[currentIndex]

  // Debug: Log the current exercise to help troubleshoot
  useEffect(() => {
    console.log('Practice Session - Current Exercise:', currentExercise)
    console.log('All exercises:', exercises)
  }, [currentIndex, currentExercise, exercises])

  // Haptics function
  const triggerHaptics = useCallback((pattern: 'success' | 'error' | 'complete') => {
    if ('vibrate' in navigator) {
      switch (pattern) {
        case 'success':
          navigator.vibrate([100]) // Short buzz
          break
        case 'error':
          navigator.vibrate([200, 100, 200]) // Two buzzes
          break
        case 'complete':
          navigator.vibrate([100, 50, 100, 50, 300]) // Celebration pattern
          break
      }
    }
  }, [])

  const playSound = useCallback((type: 'correct' | 'incorrect' | 'complete') => {
    // Create audio context and play different tones
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Set frequencies and patterns for different sounds
      switch (type) {
        case 'correct':
          // Happy ascending chime
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
          oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
          break

        case 'incorrect':
          // Sad descending tone
          oscillator.frequency.setValueAtTime(392.00, audioContext.currentTime) // G4
          oscillator.frequency.setValueAtTime(329.63, audioContext.currentTime + 0.15) // E4
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
          break

        case 'complete':
          // Victory fanfare
          oscillator.frequency.setValueAtTime(261.63, audioContext.currentTime) // C4
          oscillator.frequency.setValueAtTime(329.63, audioContext.currentTime + 0.1) // E4
          oscillator.frequency.setValueAtTime(392.00, audioContext.currentTime + 0.2) // G4
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.3) // C5
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.5)
          break
      }
    } catch (error) {
      console.log(`Audio not supported, but would play ${type} sound`)
    }
  }, [])

  const handleAnswer = useCallback((isCorrect: boolean) => {
    setShowResult(isCorrect ? 'correct' : 'incorrect')

    if (isCorrect) {
      const xpGained = 10 + (streak * 2) // Bonus XP for streak
      setXP(xpGained)
      setTotalXP(prev => prev + xpGained)
      setStreak(prev => prev + 1)
      setSessionStats(prev => ({ ...prev, correctAnswers: prev.correctAnswers + 1 }))

      // Trigger confetti for each correct answer!
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)

      // Audio and haptics feedback
      playSound('correct')
      triggerHaptics('success')
    } else {
      setLives(prev => prev - 1)
      setStreak(0)
      setSessionStats(prev => ({ ...prev, incorrectAnswers: prev.incorrectAnswers + 1 }))

      // Audio and haptics feedback
      playSound('incorrect')
      triggerHaptics('error')
    }

    // Show result for 1.5 seconds
    setTimeout(() => {
      setShowResult(null)
      setXP(0)

      if (!isCorrect && lives <= 1) {
        // Game over
        setIsCompleted(true)
        return
      }

      if (currentIndex + 1 >= exercises.length) {
        // Session completed
        setIsCompleted(true)
        playSound('complete')
        triggerHaptics('complete')

        // BIG confetti celebration for completion!
        setShowConfetti(true)
        return
      }

      setCurrentIndex(prev => prev + 1)
    }, 1500)
  }, [currentIndex, exercises.length, lives, streak, playSound])

  const restartSession = useCallback(() => {
    setCurrentIndex(0)
    setLives(4)
    setXP(0)
    setTotalXP(0)
    setStreak(0)
    setShowResult(null)
    setIsCompleted(false)
    setSessionStats({
      totalQuestions: exercises.length,
      correctAnswers: 0,
      incorrectAnswers: 0
    })
  }, [exercises.length])

  const handleComplete = useCallback(() => {
    onComplete(totalXP)
  }, [onComplete, totalXP])

  if (isCompleted) {
    const accuracy = Math.round((sessionStats.correctAnswers / sessionStats.totalQuestions) * 100)
    const isSuccess = lives > 0 && sessionStats.correctAnswers > 0

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-gradient-to-br from-sepia-600 via-blue-600 to-sepia-700 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center shadow-2xl"
        >
          {isSuccess ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
                className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                ¡Excelente trabajo!
              </h2>
              <p className="text-gray-600 mb-6">
                You completed the practice session!
              </p>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
                className="mx-auto w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mb-6"
              >
                <XCircle className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Keep practicing!
              </h2>
              <p className="text-gray-600 mb-6">
                Don't worry, you'll get it next time.
              </p>
            </>
          )}

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
              <span className="text-gray-600">Accuracy</span>
              <span className="font-bold text-lg">{accuracy}%</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
              <span className="text-gray-600">XP Earned</span>
              <span className="font-bold text-lg text-blue-600">+{totalXP}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
              <span className="text-gray-600">Correct Answers</span>
              <span className="font-bold text-lg text-green-600">
                {sessionStats.correctAnswers}/{sessionStats.totalQuestions}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {isSuccess && (
              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                size="lg"
              >
                Continue
              </Button>
            )}
            <Button
              onClick={restartSession}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={onExit}
              variant="ghost"
              className="w-full"
              size="lg"
            >
              Exit Practice
            </Button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <>
      {showChallenge && (
        <ChallengeScreen
          lesson={lesson}
          exercises={exercises}
          onBegin={() => setShowChallenge(false)}
          onClose={onExit}
        />
      )}

      {!showChallenge && (
        <div className="fixed inset-0 bg-gradient-to-br from-sepia-700 via-blue-700 to-sepia-800 z-50">
          {/* Confetti Animation */}
          <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm">
        <button
          onClick={onExit}
          className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 mx-6">
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Lives */}
        <div className="flex items-center space-x-1">
          {[...Array(4)].map((_, i) => (
            <Heart
              key={i}
              className={`w-6 h-6 ${
                i < lives
                  ? 'text-red-400 fill-current'
                  : 'text-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* XP Progress */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <span className="text-white font-medium">XP: {totalXP}</span>
          </div>
          {streak > 1 && (
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-white text-sm">Streak: {streak}</span>
            </div>
          )}
        </div>
        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Exercise Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {showResult ? (
            <motion.div
              key="result"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={`text-center ${
                showResult === 'correct' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", bounce: 0.6 }}
                className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
                  showResult === 'correct'
                    ? 'bg-green-500/20 border-4 border-green-400'
                    : 'bg-red-500/20 border-4 border-red-400'
                }`}
              >
                {showResult === 'correct' ? (
                  <CheckCircle className="w-12 h-12" />
                ) : (
                  <XCircle className="w-12 h-12" />
                )}
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold mb-2"
              >
                {showResult === 'correct' ? '¡Correcto!' : '¡Incorrecto!'}
              </motion.h3>

              {showResult === 'correct' && xp > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="text-yellow-400 text-xl font-bold"
                >
                  +{xp} XP
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`exercise-${currentIndex}`}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="w-full max-w-2xl"
            >
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <div className="mb-6 text-center">
                  <span className="text-sm text-gray-500 font-medium">
                    Question {currentIndex + 1} of {exercises.length}
                  </span>
                  <h2 className="text-xl font-bold text-gray-800 mt-2">
                    {lesson.title}
                  </h2>
                </div>

                {!currentExercise ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-4">No exercise found</p>
                    <button
                      onClick={onExit}
                      className="px-4 py-2 bg-gray-600 text-white rounded"
                    >
                      Exit Practice
                    </button>
                  </div>
                ) : !currentExercise.type ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-4">
                      Exercise type not specified: {JSON.stringify(currentExercise)}
                    </p>
                    <button
                      onClick={onExit}
                      className="px-4 py-2 bg-gray-600 text-white rounded"
                    >
                      Exit Practice
                    </button>
                  </div>
                ) : (
                  <>
                    {currentExercise.type === 'fill_blank' && (
                      <FillBlankPractice
                        exercise={currentExercise}
                        onAnswer={handleAnswer}
                      />
                    )}

                    {currentExercise.type === 'translation' && (
                      <TranslationPractice
                        exercise={currentExercise}
                        onAnswer={handleAnswer}
                      />
                    )}

                    {currentExercise.type === 'multiple_choice' && (
                      <MultipleChoicePractice
                        exercise={currentExercise}
                        onAnswer={handleAnswer}
                      />
                    )}

                    {!['fill_blank', 'translation', 'multiple_choice'].includes(currentExercise.type) && (
                      <div className="text-center py-8">
                        <p className="text-red-600 mb-4">
                          Unsupported exercise type: <strong>{currentExercise.type}</strong>
                        </p>
                        <p className="text-gray-600 text-sm mb-4">
                          Exercise data: {JSON.stringify(currentExercise, null, 2)}
                        </p>
                        <button
                          onClick={() => handleAnswer(false)}
                          className="px-4 py-2 bg-red-600 text-white rounded mr-2"
                        >
                          Skip Exercise
                        </button>
                        <button
                          onClick={onExit}
                          className="px-4 py-2 bg-gray-600 text-white rounded"
                        >
                          Exit Practice
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
        </div>
      )}
    </>
  )
}