'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

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

interface GameSummaryProps {
  lesson: {
    id: string
    title: string
    slug?: string
    overview?: string
    description?: string
  }
  exercises: Exercise[]
}

export default function GameSummary({ lesson, exercises }: GameSummaryProps) {
  const [summary, setSummary] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    generateSummary()
  }, [lesson, exercises])

  const generateSummary = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Prepare the data for the LLM
      const exerciseTypes = exercises.reduce((acc, exercise) => {
        const type = exercise.type || exercise.exercise_type || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const prompt = `You're a hyper-enthusiastic game announcer for a language learning game!

Lesson: "${lesson.title}"
${lesson.overview || lesson.description ? `Description: ${lesson.overview || lesson.description}` : ''}

Exercise breakdown:
${Object.entries(exerciseTypes).map(([type, count]) => `- ${type.replace('_', ' ')}: ${count} exercises`).join('\n')}

Total exercises: ${exercises.length}

Write a 3-5 sentence summary that:
1. Describes what content/skills the player will practice
2. Explains the game mechanics (4 lives, XP system, streaks)
3. Ends with an UNHINGED, EXCESSIVELY EXCITED call-to-action to GET PLAYING

Keep it fun, energetic, and slightly over-the-top but still informative. Use emojis sparingly. Make it feel like a game show host announcing the challenge!`

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.9
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.content || data.message || 'Ready to dive into this epic language challenge!')
    } catch (err) {
      console.error('Error generating game summary:', err)
      setError('Failed to generate summary')
      // Fallback summary with unhinged energy
      const fallbackSummaries = [
        `Get ready to absolutely DEMOLISH "${lesson.title}" through ${exercises.length} mind-bending challenges! You'll tackle everything from fill-in-the-blanks to translations, all while managing your precious 4 lives and racking up those sweet, sweet XP points. Nail consecutive answers for streak bonuses and watch your skills EXPLODE! Time to show this lesson who's BOSS!`,
        `BUCKLE UP for an epic language learning RAMPAGE! "${lesson.title}" is about to get CRUSHED by your unstoppable brain power through ${exercises.length} killer exercises. Four lives, unlimited determination, and XP gains that'll make your head SPIN! Are you ready to become a LANGUAGE WARRIOR?!`,
        `This is it - your moment to DESTROY language barriers with "${lesson.title}"! ${exercises.length} exercises stand between you and TOTAL LINGUISTIC DOMINATION. You've got 4 lives, an XP meter that's about to go WILD, and the chance to prove you're an absolute LEGEND! LET'S GOOOOOO!`
      ]
      setSummary(fallbackSummaries[Math.floor(Math.random() * fallbackSummaries.length)])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-blue-700">Generating epic challenge summary...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <h4 className="font-bold text-blue-900 mb-3 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Challenge Awaits!
        </h4>
        <p className="text-blue-800 text-sm leading-relaxed">
          Get ready to master "{lesson.title}" through {exercises.length} mind-bending challenges!
          You'll tackle everything while managing your precious 4 lives and racking up XP points.
          Time to show this lesson who's BOSS!
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <h4 className="font-bold text-blue-900 mb-3 flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-600" />
        Challenge Overview
      </h4>
      <p className="text-blue-800 text-sm leading-relaxed">
        {summary}
      </p>
    </div>
  )
}