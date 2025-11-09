import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/lessons/:lessonId/readings/:readingId
 * Story 3.8: Unlink reading from lesson
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; readingId: string }> }
) {
  try {
    const { lessonId, readingId } = await params
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
      .from('lesson_readings')
      .delete()
      .eq('id', readingId)
      .eq('lesson_id', lessonId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reading:', error)
    return NextResponse.json(
      { error: 'Failed to delete reading' },
      { status: 500 }
    )
  }
}
