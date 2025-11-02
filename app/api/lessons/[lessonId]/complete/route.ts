import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

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

    // Mark as complete
    const { data: completion, error: completionError } = await supabase
      .from('lesson_completions')
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        completed_at: new Date().toISOString()
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
