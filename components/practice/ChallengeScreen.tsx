'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Target, Clock, Trophy, Play, BookOpen, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import GameSummary from './GameSummary'

interface Exercise {
  id: string
  type?: string
  exercise_type?: string
  prompt: string
  answer: string
  choices?: string[]
  options?: any
  spanish_text?: string
  english_text?: string
}

interface ChallengeScreenProps {
  lesson: {
    id: string
    title: string
    slug?: string
    overview?: string
    description?: string
  }
  exercises: Exercise[]
  onBegin: () => void
  onClose: () => void
}

export default function ChallengeScreen({ lesson, exercises, onBegin, onClose }: ChallengeScreenProps) {
  // Count exercise types
  const exerciseTypes = exercises.reduce((acc, exercise) => {
    const type = exercise.type || exercise.exercise_type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const typeIcons: Record<string, JSX.Element> = {
    'multiple_choice': <Target className="w-4 h-4" />,
    'translation': <BookOpen className="w-4 h-4" />,
    'fill_blank': <Zap className="w-4 h-4" />,
  }

  const typeLabels: Record<string, string> = {
    'multiple_choice': 'Multiple Choice',
    'translation': 'Translation',
    'fill_blank': 'Fill in the Blank',
  }

  const maxXP = exercises.length * 10 // Base XP calculation
  const estimatedTime = exercises.length * 1.5 // Rough estimate in minutes

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-sepia-700 text-white p-8 text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
            <h1 className="text-3xl font-bold mb-2">Challenge Mode</h1>
            <p className="text-blue-100 text-lg">{lesson.title}</p>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Challenge Stats */}
          <div className="grid grid-cols-3 gap-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center p-4 bg-gradient-to-br from-blue-50 to-sepia-50 rounded-lg border border-blue-200"
            >
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-gray-900">{exercises.length}</div>
              <div className="text-sm text-gray-600">Exercises</div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200"
            >
              <Trophy className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-gray-900">{maxXP}</div>
              <div className="text-sm text-gray-600">Max XP</div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200"
            >
              <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-gray-900">{Math.ceil(estimatedTime)}m</div>
              <div className="text-sm text-gray-600">Est. Time</div>
            </motion.div>
          </div>

          {/* Exercise Types */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">What's Inside</h3>
            <div className="space-y-3">
              {Object.entries(exerciseTypes).map(([type, count], index) => (
                <motion.div
                  key={type}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      {typeIcons[type] || <Target className="w-4 h-4" />}
                    </div>
                    <span className="font-medium text-gray-900">
                      {typeLabels[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">{count}x</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* LLM-Generated Game Summary */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-r from-blue-50 to-sepia-50 rounded-lg p-6 border border-blue-200"
          >
            <GameSummary lesson={lesson} exercises={exercises} />
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="p-8 pt-0 flex gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            Maybe Later
          </Button>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex-2"
          >
            <Button
              onClick={onBegin}
              className="w-full text-lg font-bold py-4 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <Play className="w-5 h-5 mr-2" />
              Begin
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}