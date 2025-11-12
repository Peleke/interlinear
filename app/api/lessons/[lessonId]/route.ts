import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LessonService } from '@/lib/lessons'

/**
 * GET /api/lessons/:id
 * Story 3.2: Get lesson with all component counts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const supabase = await createClient()

    // Get current user (optional - for RLS enforcement)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const lesson = await LessonService.getById(lessonId, user?.id)

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/lessons/:id
 * Story 3.3: Update lesson metadata (author only)
 */
export async function PATCH(
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

    const body = await request.json()

    // Extract allowed update fields
    const updateParams = {
      title: body.title,
      overview: body.overview,
      language: body.language,
      course_id: body.course_id,
      xp_value: body.xp_value,
      sequence_order: body.sequence_order,
    }

    // Remove undefined fields
    Object.keys(updateParams).forEach((key) => {
      if (updateParams[key as keyof typeof updateParams] === undefined) {
        delete updateParams[key as keyof typeof updateParams]
      }
    })

    const lesson = await LessonService.update(lessonId, user.id, updateParams)

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Error updating lesson:', error)

    if (error instanceof Error && error.message.includes('Not authorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/lessons/:id
 * Story 3.4: Delete draft lesson (author only, drafts only)
 */
export async function DELETE(
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

    await LessonService.delete(lessonId, user.id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting lesson:', error)

    if (error instanceof Error) {
      if (error.message.includes('Not authorized')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }

      if (error.message.includes('Only draft lessons can be deleted')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }

      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    )
  }
}
