import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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

    // Verify lesson ownership
    const serviceClient = createServiceClient()
    const { data: lesson } = await serviceClient
      .from('lessons')
      .select('id, author_id')
      .eq('id', id)
      .maybeSingle()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    if (lesson.author_id && lesson.author_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to edit this lesson' }, { status: 403 })
    }

    // Delete all existing dialogs (cascade will delete exchanges)
    // Use service client to bypass RLS
    await serviceClient.from('lesson_dialogs').delete().eq('lesson_id', id)

    // Insert new dialogs and exchanges (use service client to bypass RLS)
    for (const dialog of dialogs) {
      const { data: newDialog, error: dialogError } = await serviceClient
        .from('lesson_dialogs')
        .insert({
          lesson_id: id,
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

        const { error: exchangesError } = await serviceClient
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
