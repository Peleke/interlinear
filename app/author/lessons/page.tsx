import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MyLessonsDashboard } from '@/components/author/MyLessonsDashboard'

export const metadata = {
  title: 'My Lessons | Interlinear',
  description: 'Manage your lesson content',
}

export default async function MyLessonsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's lessons with component counts
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select(`
      *,
      course:courses(id, title),
      dialogs:lesson_dialogs(count),
      vocabulary:lesson_vocabulary(count),
      grammar:lesson_grammar_concepts(count),
      exercises:lesson_exercises(count),
      readings:lesson_readings(count)
    `)
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch lessons:', error)
    return <div>Error loading lessons</div>
  }

  return <MyLessonsDashboard lessons={lessons || []} userId={user.id} />
}
