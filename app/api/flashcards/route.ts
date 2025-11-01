import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/flashcards - Create new flashcard
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      deck_id,
      card_type,
      front,
      back,
      cloze_text,
      extra,
      notes,
      source,
      source_id
    } = body

    // Validate card type
    if (!['basic', 'basic_reversed', 'basic_with_text', 'cloze'].includes(card_type)) {
      return NextResponse.json(
        { error: 'Invalid card type' },
        { status: 400 }
      )
    }

    // Validate required fields based on card type
    if (card_type === 'cloze') {
      if (!cloze_text) {
        return NextResponse.json(
          { error: 'Cloze text is required for cloze cards' },
          { status: 400 }
        )
      }
    } else {
      if (!front || !back) {
        return NextResponse.json(
          { error: 'Front and back are required for basic cards' },
          { status: 400 }
        )
      }
    }

    const { data: card, error } = await supabase
      .from('flashcards')
      .insert({
        deck_id,
        card_type,
        front,
        back,
        cloze_text,
        extra,
        notes,
        source,
        source_id
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ card })
  } catch (error) {
    console.error('Create card error:', error)
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    )
  }
}
