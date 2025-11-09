import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/lessons/:lessonId/vocabulary/:itemId
 * Story 3.7: Remove vocabulary from lesson (usage_count trigger auto-decrements)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; itemId: string }> }
) {
  try {
    const { lessonId, itemId } = await params
    const supabase = await createClient()

    // Verify authentication
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

    // Delete link (usage_count trigger will auto-decrement)
    const { error } = await supabase
      .from('lesson_vocabulary')
      .delete()
      .eq('id', itemId)
      .eq('lesson_id', lessonId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing vocabulary:', error)
    return NextResponse.json(
      { error: 'Failed to remove vocabulary' },
      { status: 500 }
    )
  }
}
