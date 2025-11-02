import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CourseCard from '@/components/courses/CourseCard'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get enrolled courses
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('user_courses')
    .select(
      `
      id,
      enrolled_at,
      courses(*)
    `
    )
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })

  if (enrollmentsError) {
    console.error('Failed to fetch enrollments:', enrollmentsError)
  }

  const enrolledCourses = enrollments?.map((e: any) => e.courses) || []

  // For each enrolled course, get lesson count and progress
  const coursesWithProgress = await Promise.all(
    enrolledCourses.map(async (course: any) => {
      // Get total lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', course.id)

      const totalLessons = lessons?.length || 0

      // Get completed lessons
      const { data: completions } = await supabase
        .from('lesson_completions')
        .select('lesson_id')
        .eq('user_id', user.id)
        .in(
          'lesson_id',
          lessons?.map((l) => l.id) || []
        )

      const completedLessons = completions?.length || 0
      const progress =
        totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

      return {
        ...course,
        lessonCount: totalLessons,
        progress
      }
    })
  )

  return (
    <div className="min-h-screen bg-parchment">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-sepia-50 to-amber-50 border-b border-sepia-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-serif text-sepia-900 mb-4">
            My Courses
          </h1>
          <p className="text-lg text-sepia-700">
            Continue your Spanish learning journey
          </p>
        </div>
      </div>

      {/* Courses grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {coursesWithProgress && coursesWithProgress.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {coursesWithProgress.map((course: any) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  level={course.level}
                  lessonCount={course.lessonCount}
                  progress={course.progress}
                  isEnrolled={true}
                />
              ))}
            </div>

            {/* Browse more courses */}
            <div className="text-center py-12 border-t border-sepia-200">
              <h2 className="text-2xl font-serif text-sepia-900 mb-4">
                Want to explore more?
              </h2>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 bg-sepia-700 text-white rounded-lg hover:bg-sepia-800 transition-colors"
              >
                <BookOpen className="h-5 w-5" />
                <span>Browse All Courses</span>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="flex justify-center mb-6">
              <BookOpen className="h-20 w-20 text-sepia-300" />
            </div>
            <h2 className="text-2xl font-serif text-sepia-900 mb-4">
              No Courses Yet
            </h2>
            <p className="text-lg text-sepia-600 mb-8">
              Start your Spanish learning journey today!
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sepia-700 text-white rounded-lg hover:bg-sepia-800 transition-colors"
            >
              <BookOpen className="h-5 w-5" />
              <span>Browse Courses</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
