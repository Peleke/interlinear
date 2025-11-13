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

    // Check if already completed
    const { data: existingCompletion } = await supabase
      .from('lesson_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single()

    if (existingCompletion) {
      return NextResponse.json({
        message: 'Lesson already completed',
        completion: existingCompletion
      })
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
        { error: 'You must be enrolled in the course to complete lessons' },
        { status: 403 }
      )
    }

    // Mark as complete
    const { data: completion, error: completionError } = await supabase
      .from('lesson_completions')
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        completed_at: new Date().toISOString(),
        xp_earned: 0 // Default to 0 XP for basic completion
      })
      .select()
      .single()

    if (completionError) {
      console.error('Completion error:', completionError)
      return NextResponse.json(
        { error: 'Failed to mark lesson as complete' },
        { status: 500 }
      )
    }

    // Revalidate the lesson page and course pages with actual courseId
    if (lesson?.course_id) {
      revalidatePath(`/courses/${lesson.course_id}/lessons/${lessonId}`, 'page')
      revalidatePath(`/courses/${lesson.course_id}`, 'page')
    }
    revalidatePath('/courses', 'page')

    return NextResponse.json({
      message: 'Lesson completed successfully',
      completion
    })
  } catch (error) {
    console.error('Complete lesson API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
