'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, Info } from 'lucide-react'
import { Confetti } from '@/components/Confetti'

export default function CompletePage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [level, setLevel] = useState<string>('')
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [recommendedCourse, setRecommendedCourse] = useState<any>(null)

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

        // Fetch all courses
        const coursesResponse = await fetch('/api/courses')
        if (!coursesResponse.ok) {
          throw new Error('Failed to fetch courses')
        }
        const { courses: allCourses } = await coursesResponse.json()

        // Get top 3 courses
        const topCourses = (allCourses || []).slice(0, 3)
        setCourses(topCourses)

        // Find recommended course (vibras puras in title for now)
        const recommended = allCourses.find((course: any) =>
          course.title.toLowerCase().includes('vibras puras') ||
          course.title.toLowerCase().includes('vibras') ||
          course.title.toLowerCase().includes('puras')
        )
        setRecommendedCourse(recommended)

        setStatus('success')

        // Trigger confetti after a brief delay to let the page render
        setTimeout(() => {
          setShowConfetti(true)
        }, 500)

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

  const handleEnrollInCourse = async (course: any) => {
    setEnrollingCourseId(course.id)
    try {
      // Enroll in selected course
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
      setEnrollingCourseId(null)
    }
  }

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center p-6">
      {/* Confetti Animation */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

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

        {/* Available Courses */}
        <div className="bg-gradient-to-br from-sepia-50 to-amber-50 rounded-lg border-2 border-sepia-300 p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-sepia-700 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-white">📚</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-serif text-sepia-900 mb-2">
                Available Courses
              </h3>
              <p className="text-sm text-sepia-600 mb-4">
                Based on your {level} level assessment, we think you might be interested in these courses
                {recommendedCourse ? (
                  <>...and especially <strong>{recommendedCourse.title}</strong>!</>
                ) : (
                  '!'
                )}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {courses.map((course) => {
              const isRecommended = recommendedCourse && course.id === recommendedCourse.id
              return (
                <div
                  key={course.id}
                  className={`bg-white rounded-lg border-2 p-6 transition-all ${
                    isRecommended
                      ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50'
                      : 'border-sepia-200 hover:border-sepia-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-xl font-serif text-sepia-900">
                          {course.title}
                        </h4>
                        {isRecommended && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sepia-700 mb-3">
                        {course.description || 'Explore this course to enhance your language skills.'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-sepia-600">
                        <span>📖 {course.lesson_count || 0} Lessons</span>
                        <span>🌐 {course.language.charAt(0).toUpperCase() + course.language.slice(1)}</span>
                        <span>🎯 {course.difficulty_level}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEnrollInCourse(course)}
                    disabled={enrollingCourseId === course.id}
                    className={`w-full px-6 py-3 text-lg font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      isRecommended
                        ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
                        : 'bg-sepia-700 text-white hover:bg-sepia-800 hover:shadow-lg'
                    }`}
                  >
                    {enrollingCourseId === course.id ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Enrolling...</span>
                      </>
                    ) : (
                      <span>Start This Course</span>
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {courses.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sepia-600 mb-4">No courses available at the moment.</p>
              <button
                onClick={() => router.push('/courses')}
                className="text-sepia-700 hover:text-sepia-900 font-medium underline"
              >
                Browse Course Catalog
              </button>
            </div>
          )}

          {/* Helpful hint */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> After enrolling, you'll see your course lessons.
              Click any lesson to start learning! You can always access your courses
              from the "Courses" link in the navigation bar.
            </p>
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
