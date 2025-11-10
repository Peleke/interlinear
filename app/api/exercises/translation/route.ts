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
    const {
      lessonId,
      prompt,
      spanishText,
      englishText,
      direction, // 'es_to_en' or 'en_to_es'
      xpValue = 10
    } = body

    // Validate required fields
    if (!lessonId || !prompt || !spanishText || !englishText || !direction) {
      return NextResponse.json(
        { error: 'Missing required fields: lessonId, prompt, spanishText, englishText, direction' },
        { status: 400 }
      )
    }

    // Validate direction
    if (direction !== 'es_to_en' && direction !== 'en_to_es') {
      return NextResponse.json(
        { error: 'Invalid direction: must be "es_to_en" or "en_to_es"' },
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

    // Answer is based on direction
    const answer = direction === 'es_to_en' ? englishText : spanishText

    // Create translation exercise
    const { data: exercise, error: insertError } = await supabase
      .from('lesson_exercises')
      .insert({
        lesson_id: lessonId,
        exercise_type: 'translation',
        prompt,
        answer,
        spanish_text: spanishText,
        english_text: englishText,
        direction,
        xp_value: xpValue,
        sequence_order: nextOrder,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating translation exercise:', insertError)
      return NextResponse.json(
        { error: 'Failed to create exercise', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ exercise })

  } catch (error) {
    console.error('Unexpected error in translation API:', error)
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
      .eq('exercise_type', 'translation')
      .order('sequence_order', { ascending: true })

    if (error) {
      console.error('Error fetching translation exercises:', error)
      return NextResponse.json(
        { error: 'Failed to fetch exercises' },
        { status: 500 }
      )
    }

    return NextResponse.json({ exercises })

  } catch (error) {
    console.error('Unexpected error in translation GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
