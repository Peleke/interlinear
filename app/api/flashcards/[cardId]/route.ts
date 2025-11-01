import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/flashcards/[cardId] - Update card
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data: card, error } = await supabase
      .from('flashcards')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', cardId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ card })
  } catch (error) {
    console.error('Update card error:', error)
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    )
  }
}

// DELETE /api/flashcards/[cardId] - Delete card
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', cardId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete card error:', error)
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    )
  }
}
