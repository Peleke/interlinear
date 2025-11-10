import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lessonId, prompt, answer, options, xpValue = 10 } = body

    // Validate required fields
    if (!lessonId || !prompt || !answer || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonId, prompt, answer, options (array with at least 2 items)' },
        { status: 400 }
      )
    }

    // Verify answer is in options
    if (!options.includes(answer)) {
      return NextResponse.json(
        { error: 'Answer must be one of the provided options' },
        { status: 400 }
      )
    }

    // Verify lesson ownership
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('author_id')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    if (lesson.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only add exercises to your own lessons' },
        { status: 403 }
      )
    }

    // Get next sequence order
    const { data: exercises } = await supabase
      .from('lesson_exercises')
      .select('sequence_order')
      .eq('lesson_id', lessonId)
      .order('sequence_order', { ascending: false })
      .limit(1)

    const nextOrder = exercises && exercises.length > 0
      ? exercises[0].sequence_order + 1
      : 0

    // Create multiple-choice exercise
    const { data: exercise, error: insertError } = await supabase
      .from('lesson_exercises')
      .insert({
        lesson_id: lessonId,
        exercise_type: 'multiple_choice',
        prompt,
        answer,
        options: { choices: options }, // Store as JSON array
        xp_value: xpValue,
        sequence_order: nextOrder,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating multiple-choice exercise:', insertError)
      return NextResponse.json(
        { error: 'Failed to create exercise', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ exercise })

  } catch (error) {
    console.error('Unexpected error in multiple-choice API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing lessonId parameter' },
        { status: 400 }
      )
    }

    const { data: exercises, error } = await supabase
      .from('lesson_exercises')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('exercise_type', 'multiple_choice')
      .order('sequence_order', { ascending: true })

    if (error) {
      console.error('Error fetching multiple-choice exercises:', error)
      return NextResponse.json(
        { error: 'Failed to fetch exercises' },
        { status: 500 }
      )
    }

    return NextResponse.json({ exercises })

  } catch (error) {
    console.error('Unexpected error in multiple-choice GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
