'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

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

Write EXACTLY 2 sentences:
1. First sentence: What they'll learn in this lesson
2. Second sentence: UNHINGED, EXCESSIVELY EXCITED call-to-action about dominating the challenge

NO hashtags, NO bullet points, NO extra formatting. Just 2 sentences of pure hype! Make it feel like an overly excited game show host!`

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
        `You're about to master **${lesson.title}** through ${exercises.length} killer challenges. Time to show this lesson who's *BOSS* and rack up those XP points!`,
        `Get ready to **DEMOLISH** language barriers with "${lesson.title}" exercises. You've got 4 lives and unlimited potential - let's become a *LANGUAGE WARRIOR*!`,
        `"${lesson.title}" is about to get **CRUSHED** by your unstoppable brain power. ${exercises.length} challenges stand between you and *TOTAL DOMINATION* - LET'S GO!`
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
        <div className="text-blue-800 text-sm leading-relaxed">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2">{children}</p>,
              strong: ({ children }) => <strong className="font-bold text-blue-900">{children}</strong>,
              em: ({ children }) => <em className="font-semibold text-blue-700">{children}</em>
            }}
          >
            You're about to master **{lesson.title}** through {exercises.length} challenges. Time to show this lesson who's *BOSS*!
          </ReactMarkdown>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <h4 className="font-bold text-blue-900 mb-3 flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-600" />
        Challenge Overview
      </h4>
      <div className="text-blue-800 text-sm leading-relaxed">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2">{children}</p>,
            strong: ({ children }) => <strong className="font-bold text-blue-900">{children}</strong>,
            em: ({ children }) => <em className="font-semibold text-blue-700">{children}</em>
          }}
        >
          {summary}
        </ReactMarkdown>
      </div>
    </div>
  )
}