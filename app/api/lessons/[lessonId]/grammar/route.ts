import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/lessons/:lessonId/grammar
 * Story 3.8: Link grammar concept to lesson
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
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
      .from('lesson_grammar')
      .insert({
        lesson_id: lessonId,
        concept_name: body.concept_name,
        description: body.description || null,
        example_usage: body.example_usage || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error linking grammar:', error)
    return NextResponse.json(
      { error: 'Failed to link grammar concept' },
      { status: 500 }
    )
  }
}
