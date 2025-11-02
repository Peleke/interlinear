'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, Info } from 'lucide-react'

export default function CompletePage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [level, setLevel] = useState<string>('')
  const [isEnrolling, setIsEnrolling] = useState(false)

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

        // DON'T auto-redirect - let user choose their path
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

  const handleStartJourney = async () => {
    setIsEnrolling(true)
    try {
      // Fetch A1 course (hard-coded level for now)
      const courseResponse = await fetch('/api/courses?level=A1')
      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course')
      }

      const { courses } = await courseResponse.json()
      if (!courses || courses.length === 0) {
        throw new Error('No A1 course found')
      }

      const course = courses[0]

      // Auto-enroll in A1 course
      const enrollResponse = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id })
      })

      if (!enrollResponse.ok) {
        throw new Error('Failed to enroll in course')
      }

      // Redirect to course page
      router.push(`/courses/${course.id}`)
    } catch (error) {
      console.error('Enrollment error:', error)
      setStatus('error')
      setIsEnrolling(false)
    }
  }

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-20 w-20 text-green-600" />
          </div>
          <h1 className="text-4xl font-serif text-sepia-900 mb-2">
            ¡Felicidades!
          </h1>
          <p className="text-lg text-sepia-700">
            Your assessment is complete
          </p>
        </div>

        {/* Assessment Results */}
        <div className="bg-white rounded-lg border border-sepia-200 p-8 mb-8">
          <h2 className="text-2xl font-serif text-sepia-900 mb-6">
            Your Results
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-sepia-600 mb-1">Assessed Level</p>
              <p className="text-3xl font-bold text-sepia-900">{level}</p>
            </div>
            <div>
              <p className="text-sm text-sepia-600 mb-1">Next Steps</p>
              <p className="text-lg text-sepia-900">Begin with fundamentals</p>
            </div>
          </div>

          {/* Store reasoning if available */}
          {(() => {
            const assessmentData = typeof window !== 'undefined'
              ? sessionStorage.getItem('onboardingAssessment')
              : null
            const reasoning = assessmentData
              ? JSON.parse(assessmentData).reasoning
              : null

            return reasoning ? (
              <div className="border-t border-sepia-200 pt-6">
                <p className="text-sm text-sepia-600 mb-2">Assessment Notes</p>
                <p className="text-sepia-700 leading-relaxed">{reasoning}</p>
              </div>
            ) : null
          })()}
        </div>

        {/* Course Recommendation */}
        <div className="bg-gradient-to-br from-sepia-50 to-amber-50 rounded-lg border-2 border-sepia-300 p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-sepia-700 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-white">📚</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-serif text-sepia-900 mb-2">
                Recommended for You
              </h3>
              <p className="text-sm text-sepia-600 mb-4">
                Based on your {level} level assessment
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-sepia-200 p-6 mb-6">
            <h4 className="text-2xl font-serif text-sepia-900 mb-2">
              A1 Spanish Fundamentals
            </h4>
            <p className="text-sepia-700 mb-4">
              Master the basics of Spanish through immersive interlinear reading.
              Build your foundation with essential vocabulary, grammar, and conversational skills.
            </p>
            <div className="flex items-center gap-4 text-sm text-sepia-600">
              <span>📖 3 Lessons</span>
              <span>⏱️ ~2 hours</span>
              <span>🎯 Beginner</span>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleStartJourney}
              disabled={isEnrolling}
              className="w-full px-8 py-4 bg-sepia-700 text-white text-lg font-medium rounded-lg hover:bg-sepia-800 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isEnrolling ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Enrolling...</span>
                </>
              ) : (
                <span>Start This Course</span>
              )}
            </button>

            {/* Helpful hint */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> After enrolling, you'll see your course lessons.
                Click any lesson to start learning! You can always access your courses
                from the "Courses" link in the navigation bar.
              </p>
            </div>

            {/* Browse alternative */}
            <div className="text-center pt-4 border-t border-sepia-200">
              <p className="text-sm text-sepia-600 mb-3">
                Want to explore other courses first?
              </p>
              <button
                onClick={() => router.push('/courses')}
                className="text-sepia-700 hover:text-sepia-900 font-medium text-sm underline"
              >
                Browse All Courses
              </button>
            </div>
          </div>
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
