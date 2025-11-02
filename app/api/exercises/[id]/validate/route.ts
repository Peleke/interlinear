import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exerciseId } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user answer from request
    const body = await request.json()
    const { user_answer } = body

    if (!user_answer) {
      return NextResponse.json(
        { error: 'user_answer is required' },
        { status: 400 }
      )
    }

    // Fetch exercise data
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('answer, xp_value, lesson_id')
      .eq('id', exerciseId)
      .single()

    if (exerciseError || !exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Normalize and validate answer (case-insensitive, trimmed)
    const userAnswerNormalized = user_answer.trim().toLowerCase()
    const correctAnswerNormalized = exercise.answer.trim().toLowerCase()
    const is_correct = userAnswerNormalized === correctAnswerNormalized

    // Calculate XP earned (10 XP per correct exercise)
    const xp_earned = is_correct ? (exercise.xp_value || 10) : 0

    // Record exercise attempt
    const { error: attemptError } = await supabase
      .from('exercise_attempts')
      .insert({
        user_id: user.id,
        exercise_id: exerciseId,
        user_answer,
        is_correct,
        xp_earned
      })

    if (attemptError) {
      console.error('Failed to record attempt:', attemptError)
      // Don't fail the request, just log
    }

    // Award XP if correct
    let new_total_xp = 0
    if (is_correct && xp_earned > 0) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('xp')
        .eq('user_id', user.id)
        .single()

      new_total_xp = (profile?.xp || 0) + xp_earned

      const { error: xpError } = await supabase
        .from('user_profiles')
        .update({ xp: new_total_xp })
        .eq('user_id', user.id)

      if (xpError) {
        console.error('Failed to award XP:', xpError)
      }
    } else {
      // Get current XP even if not correct
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('xp')
        .eq('user_id', user.id)
        .single()

      new_total_xp = profile?.xp || 0
    }

    // Return validation result
    return NextResponse.json({
      is_correct,
      correct_answer: is_correct ? undefined : exercise.answer,
      xp_earned,
      new_total_xp
    })
  } catch (error) {
    console.error('Exercise validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
