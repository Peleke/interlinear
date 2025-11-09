import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/lessons/:lessonId/dialogs
 * Story 3.6: Create dialog with exchanges
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

    // Create dialog
    const { data: dialog, error: dialogError } = await supabase
      .from('lesson_dialogs')
      .insert({
        lesson_id: lessonId,
        context: body.context || null,
        setting: body.setting || null,
      })
      .select()
      .single()

    if (dialogError) throw dialogError

    // Create exchanges if provided
    if (body.exchanges && Array.isArray(body.exchanges)) {
      const exchanges = body.exchanges.map((exchange: any, index: number) => ({
        dialog_id: dialog.id,
        speaker: exchange.speaker,
        spanish_text: exchange.spanish_text,
        english_translation: exchange.english_translation || null,
        sequence_order: exchange.sequence_order ?? index,
        audio_url: exchange.audio_url || null,
      }))

      const { error: exchangesError } = await supabase
        .from('dialog_exchanges')
        .insert(exchanges)

      if (exchangesError) throw exchangesError
    }

    // Return dialog with exchanges
    const { data: fullDialog } = await supabase
      .from('lesson_dialogs')
      .select(`
        *,
        exchanges:dialog_exchanges(*)
      `)
      .eq('id', dialog.id)
      .single()

    return NextResponse.json(fullDialog, { status: 201 })
  } catch (error) {
    console.error('Error creating dialog:', error)
    return NextResponse.json(
      { error: 'Failed to create dialog' },
      { status: 500 }
    )
  }
}
