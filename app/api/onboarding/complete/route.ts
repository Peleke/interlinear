import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { assessed_level, goals, customGoal, timezone } = body

    // Check if profile already exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 400 }
      )
    }

    // Create user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        level: assessed_level,
        assessed_level,
        goals: goals || [],
        timezone: timezone || 'UTC',
        onboarding_completed: true,
        xp: 0,
        streak: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Profile creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Onboarding complete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
