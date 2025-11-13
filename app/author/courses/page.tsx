import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MyCoursesDashboard } from '@/components/author/MyCoursesDashboard'

export const metadata = {
  title: 'My Courses | Interlinear',
  description: 'Manage your course content',
}

export default async function MyCoursesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's courses with lesson counts using direct foreign key
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      *,
      lessons(count)
    `)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch courses:', error)
    return <div>Error loading courses</div>
  }

  // Transform lesson count from direct foreign key relationship
  const coursesWithCount = (courses || []).map((course) => ({
    ...course,
    lesson_count: course.lessons?.[0]?.count || 0,
  }))

  return <MyCoursesDashboard courses={coursesWithCount} userId={user.id} />
}
