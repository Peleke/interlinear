import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '@/lib/services/course'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id, lessonId } = await params
    await CourseService.removeLesson(id, lessonId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove lesson from course:', error)
    return NextResponse.json(
      { error: 'Failed to remove lesson from course' },
      { status: 500 }
    )
  }
}
