import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params

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
        language,
        author_id,
        courses (
          title,
          difficulty_level
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

    // Get lesson content
    const { data: lessonContent, error: contentError } = await supabase
      .from('lesson_content')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at')

    if (contentError) {
      console.error('Lesson content fetch error:', contentError)
    }

    // Get readings
    const { data: readings, error: readingsError } = await supabase
      .from('lesson_readings')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at')

    if (readingsError) {
      console.error('Readings fetch error:', readingsError)
    }

    // Get OLD structure exercises
    const { data: oldExercises, error: oldExercisesError } = await supabase
      .from('exercises')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at')

    if (oldExercisesError) {
      console.error('Old exercises fetch error:', oldExercisesError)
    }

    // Get NEW structure exercises
    const { data: newExercises, error: newExercisesError } = await supabase
      .from('lesson_exercises')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at')

    if (newExercisesError) {
      console.error('New exercises fetch error:', newExercisesError)
    }

    // Get dialogs
    const { data: dialogs, error: dialogsError } = await supabase
      .from('lesson_dialogs')
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
          content
        )
      `)
      .eq('lesson_id', lessonId)

    if (grammarError) {
      console.error('Grammar concepts fetch error:', grammarError)
    }

    // Detect which structure this lesson uses (like in live lesson page)
    const hasOldStructure = (lessonContent && lessonContent.length > 0) || (oldExercises && oldExercises.length > 0)
    const hasNewStructure = (newExercises && newExercises.length > 0) || (grammarConcepts && grammarConcepts.length > 0)

    // Use appropriate exercise data based on structure
    const exercises = hasNewStructure ? (newExercises || []) : (oldExercises || [])

    // Format the response for the preview modal
    const previewData = {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        overview: lesson.overview,
        language: lesson.language,
        courses: lesson.courses
      },
      lessonContent: lessonContent || [],
      readings: readings || [],
      exercises: exercises,
      dialogs: formattedDialogs,
      grammarConcepts: (grammarConcepts || []).map((gc: any) => gc.grammar_concepts).filter(Boolean)
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