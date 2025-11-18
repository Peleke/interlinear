import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await context.params

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already completed
    const { data: existingCompletion } = await supabase
      .from('lesson_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single()

    if (existingCompletion) {
      return NextResponse.json({
        message: 'Lesson already completed',
        completion: existingCompletion
      })
    }

    // Get the course_id from the lesson first
    const { data: lesson } = await supabase
      .from('lessons')
      .select('course_id')
      .eq('id', lessonId)
      .single()

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Check if user is enrolled in the course
    const { data: enrollment } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', lesson.course_id)
      .single()

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You must be enrolled in the course to complete lessons' },
        { status: 403 }
      )
    }

    // Get current user profile for streak calculation
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('xp, streak, last_activity_date')
      .eq('user_id', user.id)
      .single()

    const now = new Date()
    const today = now.toISOString().split('T')[0] // YYYY-MM-DD format

    // Calculate new streak
    let newStreak = 1 // Default for first activity or after gap
    if (profile?.last_activity_date) {
      const lastActivity = new Date(profile.last_activity_date)
      const lastActivityDate = lastActivity.toISOString().split('T')[0]
      const daysDifference = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

      if (lastActivityDate === today) {
        // Already active today, keep current streak
        newStreak = profile.streak || 1
      } else if (daysDifference === 1) {
        // Yesterday was last activity, increment streak
        newStreak = (profile.streak || 0) + 1
      }
      // Gap > 1 day: reset to 1 (default above)
    }

    // Calculate XP earned (basic lesson completion)
    const xpEarned = 50 // Base XP for completing a lesson
    const newXP = (profile?.xp || 0) + xpEarned

    // Start transaction: mark lesson complete + update user profile
    const { data: completion, error: completionError } = await supabase
      .from('lesson_completions')
      .insert({
        user_id: user.id,
        lesson_id: lessonId,
        completed_at: now.toISOString(),
        xp_earned: xpEarned
      })
      .select()
      .single()

    if (completionError) {
      console.error('Completion error:', completionError)
      return NextResponse.json(
        { error: 'Failed to mark lesson as complete' },
        { status: 500 }
      )
    }

    // Update user profile with new XP, streak, and activity date
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        xp: newXP,
        streak: newStreak,
        last_activity_date: now.toISOString(),
        // Preserve other fields that might exist
        level: profile?.level || 'A1',
        onboarding_completed: true
      }, {
        onConflict: 'user_id'
      })

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Don't fail the request if profile update fails, lesson is still marked complete
    }

    // Revalidate the lesson page and course pages with actual courseId
    if (lesson?.course_id) {
      revalidatePath(`/courses/${lesson.course_id}/lessons/${lessonId}`, 'page')
      revalidatePath(`/courses/${lesson.course_id}`, 'page')
    }
    revalidatePath('/courses', 'page')

    return NextResponse.json({
      message: 'Lesson completed successfully',
      completion
    })
  } catch (error) {
    console.error('Complete lesson API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
