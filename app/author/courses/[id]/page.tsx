import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CourseDetailView } from '@/components/author/CourseDetailView'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', id)
    .single()

  return {
    title: course ? `${course.title} | Interlinear` : 'Course | Interlinear',
    description: 'Manage course details and lessons',
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch course details
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (courseError || !course) {
    notFound()
  }

  // Fetch ordered lessons for this course
  const { data: orderings, error: orderError } = await supabase
    .from('lesson_course_ordering')
    .select(`
      lesson_id,
      display_order,
      lesson:lessons!inner(id, title, status, overview)
    `)
    .eq('course_id', id)
    .order('display_order', { ascending: true })

  if (orderError) {
    console.error('Failed to fetch course lessons:', orderError)
    return <div>Error loading course lessons</div>
  }

  // Transform: Supabase returns lesson as array, we need single object
  const lessons = (orderings || []).map((item: any) => ({
    lesson_id: item.lesson_id,
    display_order: item.display_order,
    lesson: Array.isArray(item.lesson) ? item.lesson[0] : item.lesson,
  }))

  // Fetch all available lessons for this user (not in this course)
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, title, status')
    .eq('author_id', user.id)
    .order('title', { ascending: true })

  const courseLessonIds = new Set(lessons.map((o) => o.lesson_id))
  const availableLessons = (allLessons || []).filter(
    (lesson) => !courseLessonIds.has(lesson.id)
  )

  return (
    <CourseDetailView
      course={course}
      lessons={lessons}
      availableLessons={availableLessons}
    />
  )
}
