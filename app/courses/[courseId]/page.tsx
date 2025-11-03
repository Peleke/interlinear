import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LessonCard from '@/components/courses/LessonCard'
import { BookOpen, Target, Clock } from 'lucide-react'
import { Navigation } from '@/components/Navigation'

export default async function CoursePage({
  params
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const supabase = await createClient()

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get course details
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    redirect('/courses')
  }

  // Get lessons for this course
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('sequence_order', { ascending: true })

  if (lessonsError) {
    console.error('Failed to fetch lessons:', lessonsError)
  }

  // Get lesson completions
  const { data: completions } = await supabase
    .from('lesson_completions')
    .select('lesson_id')
    .eq('user_id', user.id)

  const completedLessonIds = new Set(
    completions?.map((c) => c.lesson_id) || []
  )

  // Calculate progress
  const totalLessons = lessons?.length || 0
  const completedLessons = lessons?.filter((l) =>
    completedLessonIds.has(l.id)
  ).length || 0
  const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

  return (
    <div className="min-h-screen bg-parchment">
      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <Navigation />
      </div>

      {/* Hero section */}
      <div className="bg-gradient-to-br from-sepia-50 to-amber-50 border-b border-sepia-200">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-white text-sepia-700 rounded border border-sepia-200">
              {course.level}
            </span>
            <span className="inline-block px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded border border-green-200">
              Enrolled
            </span>
          </div>

          <h1 className="text-4xl font-serif text-sepia-900 mb-4">
            {course.title}
          </h1>

          <p className="text-lg text-sepia-700 mb-8 leading-relaxed">
            {course.description}
          </p>

          {/* Course meta */}
          <div className="flex flex-wrap items-center gap-6 text-sepia-600 mb-8">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <span>{totalLessons} Lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <span>{course.level} Level</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>~{Math.ceil((totalLessons * 30) / 60)} hours</span>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm text-sepia-700 mb-2">
              <span className="font-medium">Your Progress</span>
              <span>
                {completedLessons} of {totalLessons} complete ({Math.round(progress)}%)
              </span>
            </div>
            {progress > 0 ? (
              <div className="h-3 bg-white rounded-full overflow-hidden border border-sepia-200">
                <div
                  className="h-full bg-gradient-to-r from-sepia-600 to-sepia-700 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : (
              <p className="text-sm text-sepia-600 italic">
                Ready to begin? Start with Lesson 1 below!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lessons list */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-serif text-sepia-900 mb-6">Lessons</h2>

        <div className="space-y-4">
          {lessons && lessons.length > 0 ? (
            lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                id={lesson.id}
                courseId={course.id}
                title={lesson.title}
                description={lesson.description || undefined}
                order={lesson.sequence_order}
                isCompleted={completedLessonIds.has(lesson.id)}
                isLocked={false} // For now, all lessons are unlocked
                estimatedMinutes={30} // TODO: Calculate from content
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-sepia-600">
                No lessons available yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
