import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CourseCard from '@/components/courses/CourseCard'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import StatsWidget from '@/components/dashboard/StatsWidget'
import MobileStatsChart from '@/components/dashboard/MobileStatsChart'
import TrainingGroundCTA from '@/components/dashboard/TrainingGroundCTA'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user profile for gamification stats
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('xp, streak, level')
    .eq('user_id', user.id)
    .single()

  // Convert text level to numeric for charts
  const levelMap: Record<string, number> = {
    'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
  }

  const userStats = {
    xp: profile?.xp || 0,       // Real XP from database
    streak: profile?.streak || 0,   // Real streak from database
    level: levelMap[profile?.level || 'A1'] || 1      // Convert text level to numeric
  }

  // Get total completed lessons count
  const { data: allCompletions } = await supabase
    .from('lesson_completions')
    .select('id')
    .eq('user_id', user.id)

  const completedLessonsCount = allCompletions?.length || 8

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

  const enrolledCourses = (enrollments?.map((e: any) => e.courses) || []).filter((c: any) => c !== null)

  // For each enrolled course, get lesson count and progress
  const coursesWithProgress = await Promise.all(
    enrolledCourses.map(async (course: any) => {
      // Get total lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, sequence_order')
        .eq('course_id', course.id)
        .order('sequence_order', { ascending: true })

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

      // Find next uncompleted lesson
      const completedLessonIds = new Set(completions?.map(c => c.lesson_id) || [])
      const nextLesson = lessons?.find(lesson => !completedLessonIds.has(lesson.id))

      return {
        ...course,
        lessonCount: totalLessons,
        progress,
        nextLesson
      }
    })
  )

  // Find the current course with highest progress for CTA
  const currentCourse = coursesWithProgress
    .filter(course => course.progress > 0 && course.progress < 100)
    .sort((a, b) => b.progress - a.progress)[0]

  // Get next lesson from current course, or first course if no current
  const nextLessonData = currentCourse?.nextLesson
    ? {
        id: currentCourse.nextLesson.id,
        title: currentCourse.nextLesson.title,
        courseId: currentCourse.id
      }
    : coursesWithProgress[0]?.nextLesson
      ? {
          id: coursesWithProgress[0].nextLesson.id,
          title: coursesWithProgress[0].nextLesson.title,
          courseId: coursesWithProgress[0].id
        }
      : null

  return (
    <div className="min-h-screen bg-parchment">
      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <Navigation />
      </div>

      {/* Desktop Hero + Stats */}
      <div className="hidden md:block">
        <div className="bg-gradient-to-br from-sepia-50 to-amber-50 border-b border-sepia-200">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-serif text-sepia-900 mb-4">
              Dashboard
            </h1>
            <p className="text-lg text-sepia-700">
              Track your progress and continue learning
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <StatsWidget
            xp={userStats.xp}
            streak={userStats.streak}
            level={userStats.level}
            completedLessons={completedLessonsCount}
          />
        </div>
      </div>

      {/* Mobile Gaming Dashboard */}
      <div className="md:hidden bg-gradient-to-br from-desert-sand via-sepia-50 to-desert-warm min-h-screen overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-sunset-gold/5 via-transparent to-sunset-red/5 pointer-events-none" />

        <div className="relative px-6 py-8 space-y-8">
          {/* Mobile Stats Chart */}
          <MobileStatsChart
            xp={userStats.xp}
            streak={userStats.streak}
            level={userStats.level}
            completedLessons={completedLessonsCount}
            nextLesson={nextLessonData}
            className="animate-fade-in"
          />

          {/* Training Ground CTA */}
          <TrainingGroundCTA
            currentCourse={currentCourse ? {
              id: currentCourse.id,
              title: currentCourse.title,
              progress: currentCourse.progress
            } : null}
            nextLesson={nextLessonData}
            className="animate-slide-in-from-top-2"
          />
        </div>
      </div>

      {/* Courses grid - Desktop only */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 pb-12">
        {coursesWithProgress && coursesWithProgress.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {coursesWithProgress.map((course: any) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  level={course.difficulty_level}
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
