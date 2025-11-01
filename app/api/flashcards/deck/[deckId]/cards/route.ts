import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/flashcards/deck/[deckId]/cards - Get all cards in deck
export async function GET(
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

    const { data: cards, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ cards })
  } catch (error) {
    console.error('Get cards error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}
