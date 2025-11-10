import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '@/lib/services/course'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const course = await CourseService.getCourse(id)
    return NextResponse.json({ course })
  } catch (error) {
    console.error('Failed to fetch course:', error)
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const course = await CourseService.updateCourse(id, body)
    return NextResponse.json({ course })
  } catch (error) {
    console.error('Failed to update course:', error)
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await CourseService.deleteCourse(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete course:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
