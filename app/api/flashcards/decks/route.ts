import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/flashcards/decks - List user's decks
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get decks
    const { data: deckData, error: deckError } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (deckError) throw deckError

    // Get card counts for each deck
    const decksWithCounts = await Promise.all(
      (deckData || []).map(async (deck) => {
        const { count: totalCount } = await supabase
          .from('flashcards')
          .select('*', { count: 'exact', head: true })
          .eq('deck_id', deck.id)

        return {
          ...deck,
          card_count: totalCount || 0
        }
      })
    )

    return NextResponse.json({ decks: decksWithCounts })
  } catch (error) {
    console.error('Get decks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch decks' },
      { status: 500 }
    )
  }
}

// POST /api/flashcards/decks - Create new deck
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Deck name is required' },
        { status: 400 }
      )
    }

    const { data: deck, error } = await supabase
      .from('flashcard_decks')
      .insert({
        user_id: user.id,
        name,
        description
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ deck })
  } catch (error) {
    console.error('Create deck error:', error)
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 }
    )
  }
}
