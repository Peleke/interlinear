import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LessonEditor } from '@/components/author/LessonEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LessonEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch lesson with all components
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select(`
      *,
      course:courses(id, title),
      dialogs:lesson_dialogs(
        *,
        exchanges:dialog_exchanges(*)
      ),
      vocabulary:lesson_vocabulary(
        *,
        vocabulary_item:lesson_vocabulary_items(*)
      ),
      grammar:lesson_grammar_concepts(
        *,
        grammar_concept:grammar_concepts(*)
      ),
      exercises:lesson_exercises(*),
      readings:lesson_readings(*)
    `)
    .eq('id', id)
    .eq('author_id', user.id)
    .single()

  if (error || !lesson) {
    redirect('/author/lessons')
  }

  return <LessonEditor lesson={lesson} userId={user.id} />
}
