'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle } from 'lucide-react'

export default function CompletePage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [level, setLevel] = useState<string>('')

  useEffect(() => {
    const completeOnboarding = async () => {
      try {
        // Get goals and assessment from sessionStorage
        const goalsData = sessionStorage.getItem('onboardingGoals')
        const assessmentData = sessionStorage.getItem('onboardingAssessment')

        if (!goalsData || !assessmentData) {
          throw new Error('Missing onboarding data')
        }

        const goals = JSON.parse(goalsData)
        const assessment = JSON.parse(assessmentData)

        // Get timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

        // Create profile
        const response = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessed_level: assessment.level,
            goals: goals.selectedGoals,
            customGoal: goals.customGoal,
            timezone
          })
        })

        if (!response.ok) {
          throw new Error('Failed to complete onboarding')
        }

        setLevel(assessment.level)
        setStatus('success')

        // Clear sessionStorage
        sessionStorage.removeItem('onboardingGoals')
        sessionStorage.removeItem('onboardingAssessment')

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } catch (error) {
        console.error('Complete onboarding error:', error)
        setStatus('error')
      }
    }

    completeOnboarding()
  }, [router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-sepia-700" />
          <p className="text-lg text-sepia-700">Creating your profile...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-4xl font-serif text-sepia-900 mb-4">
            Oops! Something went wrong
          </h1>
          <p className="text-lg text-sepia-700 mb-8">
            We couldn't complete your onboarding. Please try again.
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="px-6 py-3 bg-sepia-700 text-white rounded-lg hover:bg-sepia-800 transition-colors"
          >
            Restart Onboarding
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-24 w-24 text-green-600" />
        </div>
        <h1 className="text-4xl font-serif text-sepia-900 mb-4">
          ¡Felicidades!
        </h1>
        <p className="text-lg text-sepia-700 mb-4">
          Your profile has been created successfully!
        </p>
        <div className="bg-white rounded-lg border border-sepia-200 p-8 mb-8">
          <p className="text-sepia-700 mb-4">
            <strong>Assessed Level:</strong> {level}
          </p>
          <p className="text-sm text-sepia-600">
            Redirecting you to your dashboard...
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sepia-300"></div>
          <div className="w-3 h-3 rounded-full bg-sepia-300"></div>
          <div className="w-3 h-3 rounded-full bg-sepia-700"></div>
        </div>
        <p className="text-center text-sm text-sepia-600 mt-2">
          Step 3 of 3: Complete
        </p>
      </div>
    </div>
  )
}
