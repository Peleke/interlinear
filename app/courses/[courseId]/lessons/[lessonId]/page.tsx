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
    .select('*, courses(title, difficulty_level)')
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

  // Get exercises for this lesson
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true })

  // Get readings for this lesson
  const { data: readings } = await supabase
    .from('lesson_readings')
    .select('reading_id, library_readings(id, title, content, word_count)')
    .eq('lesson_id', lessonId)
    .order('display_order', { ascending: true })

  // Get dialog data (maybeSingle returns null if not found, single would throw error)
  const { data: dialogData } = await supabase
    .from('lesson_dialogs')
    .select(`
      id,
      context,
      setting,
      dialog_exchanges (
        id,
        sequence_order,
        speaker,
        spanish,
        english
      )
    `)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  // Check if completed
  const { data: completion } = await supabase
    .from('lesson_completions')
    .select('id')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const isCompleted = !!completion

  // Transform readings data - flatten library_readings arrays
  type ReadingData = { id: string; title: string; content: string; word_count: number }
  const lessonReadings: ReadingData[] = (readings
    ?.flatMap(r => Array.isArray(r.library_readings) ? r.library_readings : (r.library_readings ? [r.library_readings] : []))
    .filter((r): r is ReadingData => r !== null && r !== undefined) || []) as ReadingData[]

  // Transform dialog data - sort exchanges by sequence_order
  const dialog = dialogData ? {
    id: dialogData.id,
    context: dialogData.context,
    setting: dialogData.setting,
    exchanges: (dialogData.dialog_exchanges || []).sort((a: any, b: any) => a.sequence_order - b.sequence_order)
  } : null

  return (
    <LessonViewer
      lesson={lesson}
      contentBlocks={contentBlocks || []}
      exercises={exercises || []}
      readings={lessonReadings}
      dialog={dialog}
      courseId={courseId}
      lessonId={lessonId}
      isCompleted={isCompleted}
    />
  )
}
