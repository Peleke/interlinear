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

  // Fetch lessons for this course using direct course_id foreign key
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title, status, overview, sequence_order')
    .eq('course_id', id)
    .eq('author_id', user.id)
    .order('sequence_order', { ascending: true })

  if (lessonsError) {
    console.error('Failed to fetch course lessons:', lessonsError)
    return <div>Error loading course lessons</div>
  }

  // Transform to match expected format
  const transformedLessons = (lessons || []).map((lesson) => ({
    lesson_id: lesson.id,
    display_order: lesson.sequence_order,
    lesson: lesson,
  }))

  // Fetch all available lessons for this user (not in this course)
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, title, status')
    .eq('author_id', user.id)
    .is('course_id', null) // Only lessons not assigned to any course
    .order('title', { ascending: true })

  return (
    <CourseDetailView
      course={course}
      lessons={transformedLessons}
      availableLessons={allLessons || []}
    />
  )
}
