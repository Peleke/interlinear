import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CourseCard from '@/components/courses/CourseCard'
import { BookOpen } from 'lucide-react'

export default async function CoursesPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get all courses
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .order('level', { ascending: true })

  if (coursesError) {
    console.error('Failed to fetch courses:', coursesError)
  }

  // Get user's enrollments
  const { data: enrollments } = await supabase
    .from('user_courses')
    .select('course_id')
    .eq('user_id', user.id)

  const enrolledCourseIds = new Set(
    enrollments?.map((e) => e.course_id) || []
  )

  // For each course, get lesson count
  const coursesWithMeta = await Promise.all(
    (courses || []).map(async (course) => {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', course.id)

      const lessonCount = lessons?.length || 0
      const isEnrolled = enrolledCourseIds.has(course.id)

      return {
        ...course,
        lessonCount,
        isEnrolled
      }
    })
  )

  return (
    <div className="min-h-screen bg-parchment">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-sepia-50 to-amber-50 border-b border-sepia-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-10 w-10 text-sepia-700" />
            <h1 className="text-4xl font-serif text-sepia-900">All Courses</h1>
          </div>
          <p className="text-lg text-sepia-700">
            Explore our complete Spanish curriculum, from beginner to advanced
          </p>
        </div>
      </div>

      {/* Courses grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {coursesWithMeta && coursesWithMeta.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesWithMeta.map((course: any) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                level={course.level}
                lessonCount={course.lessonCount}
                estimatedHours={Math.ceil((course.lessonCount * 30) / 60)}
                isEnrolled={course.isEnrolled}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="flex justify-center mb-6">
              <BookOpen className="h-20 w-20 text-sepia-300" />
            </div>
            <h2 className="text-2xl font-serif text-sepia-900 mb-4">
              No Courses Available
            </h2>
            <p className="text-lg text-sepia-600">
              Courses are being prepared. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
