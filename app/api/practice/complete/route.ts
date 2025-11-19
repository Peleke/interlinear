import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { xpEarned, exercisesCompleted, accuracy } = await request.json()

    if (!xpEarned || xpEarned <= 0) {
      return NextResponse.json({ success: true, message: 'No XP to award' })
    }

    // Get current profile first, then update XP
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('xp, level, streak')
      .eq('user_id', user.id)
      .single()

    const currentXP = currentProfile?.xp || 0
    const newTotalXp = currentXP + xpEarned

    // Update user profile with XP gain
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        xp: newTotalXp,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return NextResponse.json({ error: 'Failed to update XP' }, { status: 500 })
    }

    // Check for level up (same thresholds as other APIs)
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const xpThresholds = [0, 200, 500, 1000, 2000, 5000]

    let newLevel = currentProfile?.level || 'A1'
    let leveledUp = false

    for (let i = xpThresholds.length - 1; i >= 0; i--) {
      if (newTotalXp >= xpThresholds[i]) {
        const calculatedLevel = levels[i]
        if (calculatedLevel !== newLevel) {
          newLevel = calculatedLevel
          leveledUp = true

          // Update level in database
          await supabase
            .from('user_profiles')
            .update({ level: newLevel })
            .eq('user_id', user.id)
        }
        break
      }
    }

    return NextResponse.json({
      success: true,
      xpEarned,
      newTotalXp,
      level: newLevel,
      leveledUp,
      exercisesCompleted,
      accuracy
    })

  } catch (error) {
    console.error('Practice completion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}