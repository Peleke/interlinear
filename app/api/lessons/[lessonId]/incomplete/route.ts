import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    // Delete the completion record (for debugging purposes)
    const { error: deleteError } = await supabase
      .from('lesson_completions')
      .delete()
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)

    if (deleteError) {
      console.error('Deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to mark lesson as incomplete' },
        { status: 500 }
      )
    }

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
