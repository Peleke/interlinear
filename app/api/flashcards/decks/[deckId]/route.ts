import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/flashcards/decks/[deckId] - Update deck
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { deckId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    const { data: deck, error } = await supabase
      .from('flashcard_decks')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', deckId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ deck })
  } catch (error) {
    console.error('Update deck error:', error)
    return NextResponse.json(
      { error: 'Failed to update deck' },
      { status: 500 }
    )
  }
}

// DELETE /api/flashcards/decks/[deckId] - Delete deck
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { deckId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('flashcard_decks')
      .delete()
      .eq('id', deckId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete deck error:', error)
    return NextResponse.json(
      { error: 'Failed to delete deck' },
      { status: 500 }
    )
  }
}
