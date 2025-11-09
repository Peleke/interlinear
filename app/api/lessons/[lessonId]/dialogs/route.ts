import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/lessons/[id]/dialogs
 * Fetch all dialogs for a lesson with their exchanges
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .eq('lesson_id', id)
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
 * PUT /api/lessons/[id]/dialogs
 * Replace all dialogs for a lesson (bulk update)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Delete all existing dialogs (cascade will delete exchanges)
    await supabase.from('lesson_dialogs').delete().eq('lesson_id', id)

    // Insert new dialogs and exchanges
    for (const dialog of dialogs) {
      const { data: newDialog, error: dialogError } = await supabase
        .from('lesson_dialogs')
        .insert({
          lesson_id: id,
          context: dialog.context,
          setting: dialog.setting,
        })
        .select()
        .single()

      if (dialogError) {
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
