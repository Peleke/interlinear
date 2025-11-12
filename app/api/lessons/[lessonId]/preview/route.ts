import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { lessonId } = params

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get lesson with basic info
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        overview,
        author_id,
        courses (
          title,
          level
        )
      `)
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      console.error('Lesson fetch error:', lessonError)
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Check if user is the author (for preview access control)
    if (lesson.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Only lesson authors can preview lessons' },
        { status: 403 }
      )
    }

    // Get content blocks
    const { data: contentBlocks, error: contentError } = await supabase
      .from('content_blocks')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index')

    if (contentError) {
      console.error('Content blocks fetch error:', contentError)
    }

    // Get readings
    const { data: readings, error: readingsError } = await supabase
      .from('readings')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at')

    if (readingsError) {
      console.error('Readings fetch error:', readingsError)
    }

    // Get exercises
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at')

    if (exercisesError) {
      console.error('Exercises fetch error:', exercisesError)
    }

    // Get dialogs
    const { data: dialogs, error: dialogsError } = await supabase
      .from('dialogs')
      .select(`
        id,
        context,
        setting,
        dialog_exchanges (
          id,
          sequence_order,
          speaker,
          spanish,
          english
        )
      `)
      .eq('lesson_id', lessonId)
      .order('created_at')

    if (dialogsError) {
      console.error('Dialogs fetch error:', dialogsError)
    }

    // Format dialogs with exchanges
    const formattedDialogs = (dialogs || []).map(dialog => ({
      id: dialog.id,
      context: dialog.context,
      setting: dialog.setting,
      exchanges: (dialog.dialog_exchanges || []).sort(
        (a: any, b: any) => a.sequence_order - b.sequence_order
      )
    }))

    // Get grammar concepts
    const { data: grammarConcepts, error: grammarError } = await supabase
      .from('lesson_grammar_concepts')
      .select(`
        grammar_concepts (
          id,
          name,
          description,
          explanation
        )
      `)
      .eq('lesson_id', lessonId)

    if (grammarError) {
      console.error('Grammar concepts fetch error:', grammarError)
    }

    // Format the response for the preview modal
    const previewData = {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        overview: lesson.overview,
        courses: lesson.courses
      },
      contentBlocks: contentBlocks || [],
      readings: readings || [],
      exercises: exercises || [],
      dialogs: formattedDialogs,
      grammarConcepts: (grammarConcepts || []).map((gc: any) => gc.grammar_concepts)
    }

    return NextResponse.json(previewData)

  } catch (error) {
    console.error('Preview API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}