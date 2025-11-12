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
    .single()

  if (lessonError || !lesson) {
    redirect(`/courses/${courseId}`)
  }

  // Get OLD structure content (lesson_content + exercises)
  const { data: oldContentBlocks } = await supabase
    .from('lesson_content')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('sequence_order', { ascending: true })

  const { data: oldExercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true })

  // Get NEW structure content (lesson_exercises + lesson_grammar_concepts)
  const { data: newExercises } = await supabase
    .from('lesson_exercises')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true })

  const { data: grammarConcepts } = await supabase
    .from('lesson_grammar_concepts')
    .select(`
      grammar_concepts (
        id,
        name,
        description,
        content
      )
    `)
    .eq('lesson_id', lessonId)

  // Get readings for this lesson
  const { data: readings } = await supabase
    .from('lesson_readings')
    .select('reading_id, library_readings(id, title, content, word_count)')
    .eq('lesson_id', lessonId)
    .order('display_order', { ascending: true })

  // Get dialog data (can have multiple dialogs per lesson)
  const { data: dialogsData } = await supabase
    .from('lesson_dialogs')
    .select(`
      id,
      context,
      setting,
      dialog_exchanges!dialog_exchanges_dialog_id_fkey (
        id,
        sequence_order,
        speaker,
        spanish,
        english
      )
    `)
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true })

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

  // Detect which structure this lesson uses
  const hasOldStructure = (oldContentBlocks && oldContentBlocks.length > 0) || (oldExercises && oldExercises.length > 0)
  const hasNewStructure = (newExercises && newExercises.length > 0) || (grammarConcepts && grammarConcepts.length > 0)

  // Transform dialog data - sort exchanges by sequence_order
  // For now, just use the first dialog if multiple exist
  const firstDialog = dialogsData?.[0]
  const dialog = firstDialog ? {
    id: firstDialog.id,
    context: firstDialog.context,
    setting: firstDialog.setting,
    exchanges: (firstDialog.dialog_exchanges || []).sort((a: any, b: any) => a.sequence_order - b.sequence_order)
  } : null

  // Transform dialogs data for new structure (multiple dialogs)
  const allDialogs = dialogsData ? dialogsData.map(dialog => ({
    id: dialog.id,
    context: dialog.context,
    setting: dialog.setting,
    exchanges: (dialog.dialog_exchanges || []).sort((a: any, b: any) => a.sequence_order - b.sequence_order)
  })) : []

  // Use appropriate data structure
  const contentBlocks = oldContentBlocks || []
  const exercises = oldExercises || []
  const grammarConceptsFlat = grammarConcepts?.map((gc: any) => gc.grammar_concepts).filter(Boolean) || []

  return (
    <LessonViewer
      lesson={lesson}
      contentBlocks={contentBlocks}
      exercises={exercises}
      readings={lessonReadings}
      dialog={dialog}
      allDialogs={allDialogs}
      newExercises={newExercises || []}
      grammarConcepts={grammarConceptsFlat}
      isNewStructure={hasNewStructure}
      courseId={courseId}
      lessonId={lessonId}
      isCompleted={isCompleted}
    />
  )
}
