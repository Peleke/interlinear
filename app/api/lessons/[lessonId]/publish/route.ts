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

    // Get lesson with all content for validation
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        overview,
        course_id,
        author_id,
        published_at,
        published_by,
        version
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

    // Check authorization - only lesson author can publish
    if (lesson.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the lesson author can publish this lesson' },
        { status: 403 }
      )
    }

    // Check if lesson is already published
    if (lesson.published_at) {
      return NextResponse.json(
        {
          error: 'Lesson is already published',
          details: {
            published_at: lesson.published_at,
            published_by: lesson.published_by,
            version: lesson.version
          }
        },
        { status: 400 }
      )
    }

    // Fetch all lesson content for validation
    const [
      { data: lessonContent },
      { data: exercises },
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
        .from('lesson_readings')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at'),

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

    // Prepare lesson data for validation
    const lessonForValidation: LessonForValidation = {
      id: lesson.id,
      title: lesson.title,
      overview: lesson.overview,
      course_id: lesson.course_id,
      author_id: lesson.author_id,
      lessonContent: lessonContent || [],
      exercises: exercises || [],
      readings: readings || [],
      dialogs: formattedDialogs,
      grammarConcepts: (grammarConcepts || []).map((gc: any) => gc.grammar_concepts)
    }

    // Validate lesson before publishing
    const validationReport = validateLessonForPublish(lessonForValidation)

    // If validation fails, return validation report
    if (!validationReport.summary.canPublish) {
      return NextResponse.json(
        {
          error: 'Lesson validation failed',
          validation: validationReport
        },
        { status: 400 }
      )
    }

    // Publish the lesson
    const { data: publishedLesson, error: publishError } = await supabase
      .from('lessons')
      .update({
        published_at: new Date().toISOString(),
        published_by: user.id,
        version: lesson.version + 1
      })
      .eq('id', lessonId)
      .select()
      .single()

    if (publishError) {
      console.error('Publish error:', publishError)
      return NextResponse.json(
        { error: 'Failed to publish lesson' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Lesson published successfully',
      lesson: {
        id: publishedLesson.id,
        title: publishedLesson.title,
        published_at: publishedLesson.published_at,
        published_by: publishedLesson.published_by,
        version: publishedLesson.version
      },
      validation: validationReport
    })

  } catch (error) {
    console.error('Publish API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, title, author_id, published_at, published_by, version')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }

    // Check authorization - only lesson author can unpublish
    if (lesson.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the lesson author can unpublish this lesson' },
        { status: 403 }
      )
    }

    // Check if lesson is actually published
    if (!lesson.published_at) {
      return NextResponse.json(
        { error: 'Lesson is not published' },
        { status: 400 }
      )
    }

    // Unpublish the lesson (set published_at to null)
    const { data: unpublishedLesson, error: unpublishError } = await supabase
      .from('lessons')
      .update({
        published_at: null,
        published_by: null
      })
      .eq('id', lessonId)
      .select()
      .single()

    if (unpublishError) {
      console.error('Unpublish error:', unpublishError)
      return NextResponse.json(
        { error: 'Failed to unpublish lesson' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Lesson unpublished successfully',
      lesson: {
        id: unpublishedLesson.id,
        title: unpublishedLesson.title,
        published_at: unpublishedLesson.published_at,
        version: unpublishedLesson.version
      }
    })

  } catch (error) {
    console.error('Unpublish API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}