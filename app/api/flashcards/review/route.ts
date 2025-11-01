import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MockScheduler, type ReviewQuality } from '@/lib/services/flashcards'

// POST /api/flashcards/review - Record a review
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { card_id, card_index, quality } = body

    if (!card_id || card_index === undefined || quality === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: card_id, card_index, quality' },
        { status: 400 }
      )
    }

    if (![0, 1, 2, 3].includes(quality)) {
      return NextResponse.json(
        { error: 'Quality must be 0 (Again), 1 (Hard), 2 (Good), or 3 (Easy)' },
        { status: 400 }
      )
    }

    // Calculate next review using mock scheduler
    const schedule = MockScheduler.calculate(quality as ReviewQuality)

    // Insert review record
    const { error } = await supabase
      .from('card_reviews')
      .insert({
        card_id,
        user_id: user.id,
        card_index,
        quality,
        interval_days: schedule.interval_days,
        next_review_date: schedule.next_review_date.toISOString()
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Record review error:', error)
    return NextResponse.json(
      { error: 'Failed to record review' },
      { status: 500 }
    )
  }
}
