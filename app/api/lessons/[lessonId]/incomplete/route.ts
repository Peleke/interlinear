import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await context.params

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the course_id from the lesson first
    const { data: lesson } = await supabase
      .from('lessons')
      .select('course_id')
      .eq('id', lessonId)
      .single()

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Check if user is enrolled in the course
    const { data: enrollment } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', lesson.course_id)
      .single()

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You must be enrolled in the course to modify lesson completion' },
        { status: 403 }
      )
    }

    // Delete the completion record (for debugging purposes)
    console.log('[Incomplete] Attempting DELETE for user:', user.id, 'lesson:', lessonId)

    const { data: deleteData, error: deleteError } = await supabase
      .from('lesson_completions')
      .delete()
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .select()

    console.log('[Incomplete] DELETE result:', { deleteData, deleteError })

    if (deleteError) {
      console.error('Deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to mark lesson as incomplete' },
        { status: 500 }
      )
    }

    if (!deleteData || deleteData.length === 0) {
      console.warn('[Incomplete] No rows were deleted - completion might not exist')
    }

    // Revalidate ALL related pages
    console.log('[Incomplete] Revalidating paths for course:', lesson?.course_id, 'lesson:', lessonId)

    // Revalidate with 'page' type for specific paths with actual IDs
    if (lesson?.course_id) {
      revalidatePath(`/courses/${lesson.course_id}`, 'page')
      revalidatePath(`/courses/${lesson.course_id}/lessons/${lessonId}`, 'page')
      console.log('[Incomplete] Revalidated:', `/courses/${lesson.course_id}`)
      console.log('[Incomplete] Revalidated:', `/courses/${lesson.course_id}/lessons/${lessonId}`)
    }
    revalidatePath('/courses', 'page')

    return NextResponse.json({
      message: 'Lesson marked as incomplete successfully'
    })
  } catch (error) {
    console.error('Incomplete lesson API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
