import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLessonOverview } from '@/lib/content-generation/overview-generator'

interface GenerateOverviewRequest {
  overviewType: 'general' | 'readings' | 'exercises' | 'dialogs' | 'grammar'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: GenerateOverviewRequest = await request.json()
    const { overviewType } = body

    if (!overviewType || !['general', 'readings', 'exercises', 'dialogs', 'grammar'].includes(overviewType)) {
      return NextResponse.json({ error: 'Invalid overview type' }, { status: 400 })
    }

    // Verify lesson ownership
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        *,
        readings:lesson_readings(
          *,
          library_reading:library_readings(*)
        ),
        exercises:lesson_exercises(*),
        dialogs:lesson_dialogs(
          *,
          exchanges:dialog_exchanges(*)
        ),
        grammar:lesson_grammar_concepts(
          *,
          grammar_concept:grammar_concepts(*)
        ),
        vocabulary:lesson_vocabulary(
          *,
          vocabulary_item:lesson_vocabulary_items(*)
        )
      `)
      .eq('id', lessonId)
      .eq('author_id', user.id)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Lesson not found or access denied' }, { status: 404 })
    }

    // Generate overview based on type
    const generatedOverview = await generateLessonOverview(lesson, overviewType)

    return NextResponse.json({
      overview: generatedOverview,
      overviewType
    })

  } catch (error) {
    console.error('Error generating overview:', error)
    return NextResponse.json(
      { error: 'Failed to generate overview' },
      { status: 500 }
    )
  }
}