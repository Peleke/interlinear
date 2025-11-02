'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AssessmentChat } from '@/components/onboarding/AssessmentChat'
import { Loader2 } from 'lucide-react'

export default function AssessmentPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<{ selectedGoals: string[]; customGoal: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Retrieve goals from sessionStorage (set in Story 2.1)
    const stored = sessionStorage.getItem('onboardingGoals')
    if (!stored) {
      // No goals found, redirect back to welcome page
      router.push('/onboarding')
      return
    }

    try {
      const parsed = JSON.parse(stored)
      setGoals(parsed)
    } catch (error) {
      console.error('Failed to parse goals:', error)
      router.push('/onboarding')
      return
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleAssessmentComplete = async (assessment: {
    level: string
    conversationHistory: any[]
  }) => {
    // Store assessment result for Story 2.3
    sessionStorage.setItem(
      'onboardingAssessment',
      JSON.stringify({
        level: assessment.level,
        conversationHistory: assessment.conversationHistory
      })
    )

    // Navigate to profile completion (Story 2.3)
    router.push('/onboarding/complete')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="flex items-center gap-2 text-sepia-700">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading assessment...</span>
        </div>
      </div>
    )
  }

  if (!goals) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-sepia-900 mb-4">
            Level Assessment
          </h1>
          <p className="text-lg text-sepia-700">
            Let's have a brief conversation in Spanish to assess your current level.
          </p>
          <p className="text-sm text-sepia-600 mt-2">
            Respond naturally - there are no wrong answers!
          </p>
        </div>

        {/* Chat Interface */}
        <AssessmentChat
          goals={goals.selectedGoals}
          customGoal={goals.customGoal}
          onComplete={handleAssessmentComplete}
        />
      </div>
    </div>
  )
}
