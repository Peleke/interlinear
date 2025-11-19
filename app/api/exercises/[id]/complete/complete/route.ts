import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { exerciseId: string } }
) {
  try {
    const supabase = await createServerClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { isCorrect, xpEarned } = await request.json()

    if (!isCorrect) {
      return NextResponse.json({ success: true, message: 'Exercise marked as incorrect' })
    }

    // Get current profile first, then update XP
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('xp, level, streak')
      .eq('user_id', user.id)
      .single()

    const currentXP = currentProfile?.xp || 0
    const newXP = currentXP + xpEarned

    // Upsert user profile with XP gain
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        xp: newXP,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select('xp, level, streak')
      .single()

    if (profileError) {
      console.error('Profile upsert error:', profileError)
      return NextResponse.json({ error: 'Failed to update XP' }, { status: 500 })
    }

    // Check for level up (simple thresholds for now)
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const xpThresholds = [0, 200, 500, 1000, 2000, 5000]

    const currentLevel = profile.xp >= xpThresholds[5] ? levels[5] :
                        profile.xp >= xpThresholds[4] ? levels[4] :
                        profile.xp >= xpThresholds[3] ? levels[3] :
                        profile.xp >= xpThresholds[2] ? levels[2] :
                        profile.xp >= xpThresholds[1] ? levels[1] : levels[0]

    // Update level if changed
    if (currentLevel !== profile.level) {
      await supabase
        .from('user_profiles')
        .update({ level: currentLevel })
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      success: true,
      xp: profile.xp,
      level: currentLevel,
      leveledUp: currentLevel !== profile.level
    })

  } catch (error) {
    console.error('Exercise completion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}