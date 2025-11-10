import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '@/lib/services/course'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { lesson_id, display_order } = body

    if (!lesson_id) {
      return NextResponse.json(
        { error: 'lesson_id is required' },
        { status: 400 }
      )
    }

    await CourseService.addLesson(id, lesson_id, display_order)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to add lesson to course:', error)
    return NextResponse.json(
      { error: 'Failed to add lesson to course' },
      { status: 500 }
    )
  }
}
