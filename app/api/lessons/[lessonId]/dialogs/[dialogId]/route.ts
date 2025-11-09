import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/lessons/:lessonId/dialogs/:dialogId
 * Story 3.6: Update dialog and exchanges
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; dialogId: string }> }
) {
  try {
    const { lessonId, dialogId } = await params
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

    // Update dialog metadata
    if (body.context !== undefined || body.setting !== undefined) {
      const { error: dialogError } = await supabase
        .from('lesson_dialogs')
        .update({
          context: body.context,
          setting: body.setting,
        })
        .eq('id', dialogId)
        .eq('lesson_id', lessonId)

      if (dialogError) throw dialogError
    }

    // Handle exchange updates if provided
    if (body.exchanges && Array.isArray(body.exchanges)) {
      // Delete existing exchanges (simple approach - could be optimized)
      await supabase.from('dialog_exchanges').delete().eq('dialog_id', dialogId)

      // Insert new exchanges
      const exchanges = body.exchanges.map((exchange: any, index: number) => ({
        dialog_id: dialogId,
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

    // Return updated dialog with exchanges
    const { data: fullDialog } = await supabase
      .from('lesson_dialogs')
      .select(`
        *,
        exchanges:dialog_exchanges(*)
      `)
      .eq('id', dialogId)
      .single()

    return NextResponse.json(fullDialog)
  } catch (error) {
    console.error('Error updating dialog:', error)
    return NextResponse.json(
      { error: 'Failed to update dialog' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/lessons/:lessonId/dialogs/:dialogId
 * Story 3.6: Delete dialog (cascades to exchanges via FK)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; dialogId: string }> }
) {
  try {
    const { lessonId, dialogId } = await params
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

    // Delete dialog (cascades to exchanges)
    const { error } = await supabase
      .from('lesson_dialogs')
      .delete()
      .eq('id', dialogId)
      .eq('lesson_id', lessonId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting dialog:', error)
    return NextResponse.json(
      { error: 'Failed to delete dialog' },
      { status: 500 }
    )
  }
}
