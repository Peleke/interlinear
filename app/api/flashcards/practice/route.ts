import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseClozeText, renderClozeText, type PracticeCard } from '@/lib/services/flashcards'

// GET /api/flashcards/practice?deckId=[optional] - Get due cards for practice
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deckId = searchParams.get('deckId')

    const { data, error } = await supabase.rpc('get_due_flashcards', {
      p_user_id: user.id,
      p_deck_id: deckId || null,
      p_limit: 20
    })

    if (error) throw error

    // Convert raw data to PracticeCard format
    const practiceCards: PracticeCard[] = (data || []).map((row: any) => {
      if (row.card_type === 'cloze') {
        // Generate cloze practice card
        const matches = parseClozeText(row.cloze_text)
        const match = matches[row.card_index]

        if (!match) return null // Skip invalid card_index

        const prompt = renderClozeText(row.cloze_text, [match.index], true)
        const fullContent = renderClozeText(row.cloze_text, [], false)

        return {
          card_id: row.card_id,
          card_index: row.card_index,
          deck_id: row.deck_id,
          deck_name: row.deck_name,
          card_type: row.card_type,
          prompt,
          answer: match.word,
          full_content: fullContent,
          extra: row.extra,
          notes: row.notes
        }
      } else {
        // Generate basic practice card
        const isReversed = row.card_index === 1
        return {
          card_id: row.card_id,
          card_index: row.card_index,
          deck_id: row.deck_id,
          deck_name: row.deck_name,
          card_type: row.card_type,
          prompt: isReversed ? row.back : row.front,
          answer: isReversed ? row.front : row.back,
          full_content: isReversed ? row.front : row.back,
          extra: row.extra,
          notes: row.notes
        }
      }
    }).filter(Boolean) // Remove nulls

    return NextResponse.json({ cards: practiceCards })
  } catch (error) {
    console.error('Get practice cards error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch practice cards' },
      { status: 500 }
    )
  }
}
