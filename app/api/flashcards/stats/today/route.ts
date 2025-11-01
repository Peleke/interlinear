import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get today's date range (start and end of day in user's timezone)
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    // Count reviews from today
    const { count, error } = await supabase
      .from('card_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('reviewed_at', startOfDay.toISOString())
      .lte('reviewed_at', endOfDay.toISOString())

    if (error) {
      console.error('Stats query error details:', JSON.stringify(error))
      throw error
    }

    return NextResponse.json({
      reviewed_count: count || 0,
      date: now.toISOString().split('T')[0]
    })
  } catch (error) {
    console.error('Get today stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}
