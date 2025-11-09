import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/lessons/:lessonId/exercises/:exerciseId
 * Story 3.8: Update exercise
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; exerciseId: string }> }
) {
  try {
    const { lessonId, exerciseId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify lesson ownership
    const { data: lesson } = await supabase
      .from('lessons')
      .select('author_id')
      .eq('id', lessonId)
      .single()

    if (!lesson || lesson.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to modify this lesson' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('lesson_exercises')
      .update({
        exercise_type: body.exercise_type,
        question_text: body.question_text,
        correct_answer: body.correct_answer,
        options: body.options,
        explanation: body.explanation,
        sequence_order: body.sequence_order,
      })
      .eq('id', exerciseId)
      .eq('lesson_id', lessonId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating exercise:', error)
    return NextResponse.json(
      { error: 'Failed to update exercise' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/lessons/:lessonId/exercises/:exerciseId
 * Story 3.8: Delete exercise
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; exerciseId: string }> }
) {
  try {
    const { lessonId, exerciseId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify lesson ownership
    const { data: lesson } = await supabase
      .from('lessons')
      .select('author_id')
      .eq('id', lessonId)
      .single()

    if (!lesson || lesson.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to modify this lesson' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('lesson_exercises')
      .delete()
      .eq('id', exerciseId)
      .eq('lesson_id', lessonId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting exercise:', error)
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    )
  }
}
