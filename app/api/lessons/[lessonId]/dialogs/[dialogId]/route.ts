import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/lessons/[id]/dialogs/[dialogId]
 * Delete a specific dialog (cascade deletes exchanges)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dialogId: string }> }
) {
  try {
    const { dialogId } = await params
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('lesson_dialogs')
      .delete()
      .eq('id', dialogId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting dialog:', error)
    return NextResponse.json(
      { error: 'Failed to delete dialog' },
      { status: 500 }
    )
  }
}
