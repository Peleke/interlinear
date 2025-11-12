import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/lessons/[lessonId]/dialogs
 * Fetch all dialogs for a lesson with their exchanges
 */
export async function GET(
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

    // Fetch dialogs
    const { data: dialogsData, error: dialogsError } = await supabase
      .from('lesson_dialogs')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true })

    if (dialogsError) {
      throw dialogsError
    }

    // Fetch exchanges for all dialogs
    const dialogIds = dialogsData?.map((d) => d.id) || []
    const { data: exchangesData, error: exchangesError } = await supabase
      .from('dialog_exchanges')
      .select('*')
      .in('dialog_id', dialogIds)
      .order('sequence_order', { ascending: true })

    if (exchangesError) {
      throw exchangesError
    }

    // Combine dialogs with their exchanges
    const dialogs = dialogsData?.map((dialog) => ({
      ...dialog,
      exchanges:
        exchangesData?.filter((ex) => ex.dialog_id === dialog.id) || [],
    }))

    return NextResponse.json({ dialogs })
  } catch (error) {
    console.error('Error fetching dialogs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dialogs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/lessons/[lessonId]/dialogs
 * Create a single dialog with exchanges
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

    const body = await request.json()
    const { context, setting, turns } = body

    // Verify lesson ownership
    const { data: lesson } = await supabase
      .from('lessons')
      .select('id, author_id')
      .eq('id', lessonId)
      .maybeSingle()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    if (lesson.author_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to edit this lesson' }, { status: 403 })
    }

    // Insert dialog
    const { data: newDialog, error: dialogError } = await supabase
      .from('lesson_dialogs')
      .insert({
        lesson_id: lessonId,
        context: context || '',
        setting: setting || null,
      })
      .select()
      .single()

    if (dialogError) {
      console.error('Dialog insert error:', dialogError)
      throw dialogError
    }

    // Insert exchanges (turns)
    if (turns && turns.length > 0) {
      const exchangesToInsert = turns.map((turn: any, index: number) => ({
        dialog_id: newDialog.id,
        sequence_order: index + 1,
        speaker: turn.speaker,
        spanish: turn.text, // Map 'text' to 'spanish' field
        english: turn.translation, // Map 'translation' to 'english' field
      }))

      const { error: exchangesError } = await supabase
        .from('dialog_exchanges')
        .insert(exchangesToInsert)

      if (exchangesError) {
        console.error('Exchange insert error:', exchangesError)
        throw exchangesError
      }
    }

    return NextResponse.json({ success: true, dialog: newDialog })
  } catch (error) {
    console.error('Error creating dialog:', error)
    return NextResponse.json(
      { error: 'Failed to create dialog' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/lessons/[lessonId]/dialogs
 * Replace all dialogs for a lesson (bulk update)
 */
export async function PUT(
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

    const { dialogs } = await request.json()

    // Verify lesson ownership (RLS will handle access control)
    const { data: lesson } = await supabase
      .from('lessons')
      .select('id, author_id')
      .eq('id', lessonId)
      .maybeSingle()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    if (lesson.author_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to edit this lesson' }, { status: 403 })
    }

    // Delete all existing dialogs (cascade will delete exchanges)
    await supabase.from('lesson_dialogs').delete().eq('lesson_id', lessonId)

    // Insert new dialogs and exchanges
    for (const dialog of dialogs) {
      const { data: newDialog, error: dialogError } = await supabase
        .from('lesson_dialogs')
        .insert({
          lesson_id: lessonId,
          context: dialog.context,
          setting: dialog.setting,
        })
        .select()
        .single()

      if (dialogError) {
        console.error('Dialog insert error:', dialogError)
        throw dialogError
      }

      // Insert exchanges
      if (dialog.exchanges && dialog.exchanges.length > 0) {
        const exchangesToInsert = dialog.exchanges.map((ex: any) => ({
          dialog_id: newDialog.id,
          sequence_order: ex.sequence_order,
          speaker: ex.speaker,
          spanish: ex.spanish,
          english: ex.english,
        }))

        const { error: exchangesError } = await supabase
          .from('dialog_exchanges')
          .insert(exchangesToInsert)

        if (exchangesError) {
          throw exchangesError
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving dialogs:', error)
    return NextResponse.json(
      { error: 'Failed to save dialogs' },
      { status: 500 }
    )
  }
}
