import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('xp, streak, last_activity_date, level, onboarding_completed')
      .eq('user_id', user.id)
      .single()

    const now = new Date()
    const today = now.toISOString().split('T')[0] // YYYY-MM-DD format

    // Calculate streak based on last activity
    let newStreak = profile?.streak || 0
    let streakAction = 'maintain' // maintain, increment, reset

    if (profile?.last_activity_date) {
      const lastActivity = new Date(profile.last_activity_date)
      const lastActivityDate = lastActivity.toISOString().split('T')[0]
      const daysDifference = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

      if (lastActivityDate === today) {
        // Already active today, maintain streak
        streakAction = 'maintain'
      } else if (daysDifference === 1) {
        // Yesterday was last activity, increment streak
        newStreak = (profile.streak || 0) + 1
        streakAction = 'increment'
      } else if (daysDifference > 1) {
        // Gap > 1 day: reset streak to 1 (they're logging in today)
        newStreak = 1
        streakAction = 'reset'
      }
    } else {
      // No previous activity, start streak at 1
      newStreak = 1
      streakAction = 'start'
    }

    // Update profile with streak check (but only update date if needed)
    let shouldUpdateProfile = false
    const updates: any = {
      user_id: user.id,
      xp: profile?.xp || 0,
      streak: newStreak,
      level: profile?.level || 'A1',
      onboarding_completed: profile?.onboarding_completed || true
    }

    // Only update last_activity_date if it's a different day
    if (!profile?.last_activity_date ||
        new Date(profile.last_activity_date).toISOString().split('T')[0] !== today) {
      updates.last_activity_date = now.toISOString()
      shouldUpdateProfile = true
    }

    // Update if streak changed or date needs updating
    if (streakAction !== 'maintain' || shouldUpdateProfile) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(updates, {
          onConflict: 'user_id'
        })

      if (profileError) {
        console.error('Profile update error:', profileError)
        return NextResponse.json(
          { error: 'Failed to update streak' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      streak: newStreak,
      action: streakAction,
      xp: updates.xp,
      level: updates.level
    })
  } catch (error) {
    console.error('Streak check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}