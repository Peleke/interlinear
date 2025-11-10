import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '@/lib/services/course'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { lesson_ids } = body

    if (!Array.isArray(lesson_ids)) {
      return NextResponse.json(
        { error: 'lesson_ids must be an array' },
        { status: 400 }
      )
    }

    await CourseService.reorderLessons(id, lesson_ids)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder lessons:', error)
    return NextResponse.json(
      { error: 'Failed to reorder lessons' },
      { status: 500 }
    )
  }
}
