import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/lessons/:lessonId/vocabulary
 * Story 3.7: Add vocabulary to lesson (reuse existing OR create new)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
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
      .select('author_id, language')
      .eq('id', lessonId)
      .single()

    if (!lesson || lesson.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to modify this lesson' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Check if vocab item already exists (reuse)
    let vocabItemId = body.vocab_item_id

    if (!vocabItemId) {
      // Create new vocabulary item
      const { data: newVocab, error: vocabError } = await supabase
        .from('lesson_vocabulary_items')
        .insert({
          spanish: body.spanish,
          english: body.english,
          language: body.language || lesson.language,
          usage_count: 0, // Trigger will increment this
          reusable: body.reusable ?? true,
        })
        .select()
        .single()

      if (vocabError) throw vocabError
      vocabItemId = newVocab.id
    }

    // Link to lesson (usage_count trigger will auto-increment)
    const { data: link, error: linkError } = await supabase
      .from('lesson_vocabulary')
      .insert({
        lesson_id: lessonId,
        vocab_item_id: vocabItemId,
      })
      .select(`
        id,
        vocab_item:lesson_vocabulary_items(*)
      `)
      .single()

    if (linkError) throw linkError

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    console.error('Error adding vocabulary:', error)
    return NextResponse.json(
      { error: 'Failed to add vocabulary' },
      { status: 500 }
    )
  }
}
