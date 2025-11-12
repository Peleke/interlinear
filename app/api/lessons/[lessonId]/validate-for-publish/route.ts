import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { validateLessonForPublish, type LessonForValidation } from '@/lib/validation/lesson-publish-validator'

export async function POST(
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

    // Get lesson with basic info for authorization check
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        overview,
        course_id,
        author_id,
        published_at
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

    // Check authorization - only lesson author can validate
    if (lesson.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the lesson author can validate this lesson' },
        { status: 403 }
      )
    }

    // Fetch all lesson content for validation
    const [
      { data: lessonContent },
      { data: exercises },
      { data: lessonExercises },
      { data: readings },
      { data: dialogs },
      { data: grammarConcepts }
    ] = await Promise.all([
      supabase
        .from('lesson_content')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at'),

      supabase
        .from('exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at'),

      supabase
        .from('lesson_exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('sequence_order'),

      supabase
        .from('lesson_readings')
        .select(`
          *,
          reading:library_readings!inner(
            id,
            title,
            author,
            content,
            difficulty_level,
            word_count,
            language
          )
        `)
        .eq('lesson_id', lessonId)
        .order('display_order'),

      supabase
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
        .order('created_at'),

      supabase
        .from('lesson_grammar_concepts')
        .select(`
          grammar_concepts (
            id,
            name,
            content
          )
        `)
        .eq('lesson_id', lessonId)
    ])

    // Format dialogs with exchanges
    const formattedDialogs = (dialogs || []).map(dialog => ({
      id: dialog.id,
      context: dialog.context,
      setting: dialog.setting,
      exchanges: (dialog.dialog_exchanges || []).sort(
        (a: any, b: any) => a.sequence_order - b.sequence_order
      )
    }))

    // Format readings to match the working readings API structure: flatten the reading object
    const formattedReadings = (readings || []).map(item => ({
      id: item.reading?.id || item.id,
      title: item.reading?.title || '',
      content: item.reading?.content || '',
      word_count: item.reading?.word_count || 0
    }))

    // Debug logging to see what data we actually have
    console.log('=== VALIDATION DEBUG ===')
    console.log('Lesson basic data:', {
      id: lesson.id,
      title: lesson.title,
      overview: lesson.overview,
      course_id: lesson.course_id,
      author_id: lesson.author_id
    })
    console.log('Lesson content count:', lessonContent?.length || 0)
    console.log('Lesson content:', lessonContent)
    console.log('Old exercises count:', exercises?.length || 0)
    console.log('Old exercises:', exercises)
    console.log('NEW lesson_exercises count:', lessonExercises?.length || 0)
    console.log('NEW lesson_exercises:', lessonExercises)
    console.log('Readings count:', readings?.length || 0)
    console.log('Raw readings query result:', readings)
    console.log('First reading item structure:', readings && readings[0] ? JSON.stringify(readings[0], null, 2) : 'No readings found')
    console.log('Formatted readings:', JSON.stringify(formattedReadings, null, 2))
    console.log('Dialogs count:', dialogs?.length || 0)
    console.log('Formatted dialogs:', formattedDialogs)
    console.log('Grammar concepts count:', grammarConcepts?.length || 0)
    console.log('Grammar concepts:', grammarConcepts)

    // For comparison, let me also test the working readings API endpoint structure
    console.log('Testing working readings API endpoint...')
    try {
      const workingReadingsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/api/lessons/${lessonId}/readings`)
      if (workingReadingsResponse.ok) {
        const workingReadingsData = await workingReadingsResponse.json()
        console.log('Working readings API response:', JSON.stringify(workingReadingsData, null, 2))
      } else {
        console.log('Working readings API failed:', workingReadingsResponse.status)
      }
    } catch (error) {
      console.log('Working readings API error:', error)
    }

    // Use whichever exercises table has data
    const allExercises = [
      ...(exercises || []),
      ...(lessonExercises || []).map(ex => ({
        id: ex.id,
        type: ex.exercise_type, // Map exercise_type to type for validation
        prompt: ex.prompt,
        spanish_text: ex.spanish_text,
        english_text: ex.english_text
      }))
    ];

    // Prepare lesson data for validation
    const lessonForValidation: LessonForValidation = {
      id: lesson.id,
      title: lesson.title,
      overview: lesson.overview,
      course_id: lesson.course_id,
      author_id: lesson.author_id,
      lessonContent: lessonContent || [],
      exercises: allExercises,
      readings: formattedReadings,
      dialogs: formattedDialogs,
      grammarConcepts: (grammarConcepts || []).map((gc: any) => gc.grammar_concepts)
    }

    console.log('Final lesson for validation:', lessonForValidation)

    // Validate lesson
    const validationReport = validateLessonForPublish(lessonForValidation)

    console.log('Validation report:', validationReport)
    console.log('=========================')

    return NextResponse.json({
      validation: validationReport
    })

  } catch (error) {
    console.error('Validation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}