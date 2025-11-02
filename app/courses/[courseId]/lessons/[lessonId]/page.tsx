import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { marked } from 'marked'
import LessonViewer from '@/components/courses/LessonViewer'

export default async function LessonPage({
  params
}: {
  params: Promise<{ courseId: string; lessonId: string }>
}) {
  const { courseId, lessonId } = await params
  const supabase = await createClient()

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get lesson details with course info
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('*, courses(title, level)')
    .eq('id', lessonId)
    .eq('course_id', courseId)
    .single()

  if (lessonError || !lesson) {
    redirect(`/courses/${courseId}`)
  }

  // Get lesson content
  const { data: contentBlocks } = await supabase
    .from('lesson_content')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('sequence_order', { ascending: true })

  // Check if completed
  const { data: completion } = await supabase
    .from('lesson_completions')
    .select('id')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .single()

  const isCompleted = !!completion

  return (
    <LessonViewer
      lesson={lesson}
      contentBlocks={contentBlocks || []}
      courseId={courseId}
      lessonId={lessonId}
      isCompleted={isCompleted}
    />
  )
}
