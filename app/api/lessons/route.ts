import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LessonService } from '@/lib/lessons'

/**
 * POST /api/lessons
 * Story 3.1: Create draft lesson
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create lesson
    const lesson = await LessonService.create({
      title: body.title,
      author_id: user.id,
      overview: body.overview,
      language: body.language || 'es',
      xp_value: body.xp_value,
      sequence_order: body.sequence_order,
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/lessons?status=draft&author_id=me&language=es&sort_by=updated_at&limit=10&offset=0
 * Story 3.5: List lessons with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | null
    const authorParam = searchParams.get('author_id')
    const language = searchParams.get('language') as 'es' | 'is' | null
    const sortBy = searchParams.get('sort_by') as 'updated_at' | 'title' | 'sequence_order' | null
    const sortOrder = searchParams.get('sort_order') as 'asc' | 'desc' | null
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    // Handle 'me' as author_id
    const authorId = authorParam === 'me' ? user.id : authorParam || undefined

    const result = await LessonService.list({
      author_id: authorId,
      status: status || undefined,
      language: language || undefined,
      sort_by: sortBy || 'updated_at',
      sort_order: sortOrder || 'desc',
      limit,
      offset,
    })

    return NextResponse.json({
      lessons: result.lessons,
      total: result.total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error listing lessons:', error)
    return NextResponse.json(
      { error: 'Failed to list lessons' },
      { status: 500 }
    )
  }
}
